"""
JanSahay Direct LLM Integration Service
Orchestrates intent detection, database context loading, eligibility checks, 
conversation memory, and direct API calls to Gemini or OpenAI with automated retries.
"""

import os
import time
from typing import Any, Dict, List, Optional
import requests
from supabase import create_client, Client
from dotenv import load_dotenv
from services.eligibility_engine import match_user_with_schemes

# Custom exception classes for clean error propagation
class AIServiceException(Exception):
    """Base exception for JanSahay AI Service."""
    pass

class AIServiceUnavailableException(AIServiceException):
    """Exception raised when the AI service is unavailable (e.g. 429, connection error, timeouts, SSL, etc.)."""
    pass

class AITemporarilyUnavailableException(AIServiceException):
    """Exception raised when transient errors (500-504) persist after exponential backoff retries."""
    pass

# Load environment variables
load_dotenv()

# Setup Supabase client
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")
supabase_client: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        pass

# Simple in-memory session cache for rolling chat memory: session_id -> list of {"role": "user"/"assistant", "content": "..."}
CONVERSATION_MEMORY: Dict[str, List[Dict[str, str]]] = {}

# Permanent System Prompt
SYSTEM_PROMPT = """You are Saathi AI, the official verified AI assistant of JanSahay.
Your job is to explain government scheme benefits, eligibility criteria, required documents, application processes, and updates to Indian citizens in a friendly, clear, and easy-to-understand language.

Strict Guidelines:
1. Answer only using the backend database context provided.
2. Never invent government schemes, deadlines, or benefits.
3. Never guess eligibility status. If eligibility results are provided, explain them simply. If not available, ask the user to complete their profile.
4. For application guidance queries: explain the process clearly, but never claim that you can submit applications or modify official records.
5. If the required information is not present in the provided context, state that clearly and offer to help with other queries.
6. Present your answer using clean formatting: use **bold text** for emphasis and bullet points (-) for lists where applicable. Keep the language citizen-friendly.
"""


def detect_intent(message: str) -> str:
    """
    Determines user intent using deterministic keyword matching.
    Returns one of: 'guidance', 'eligibility', 'updates', 'notifications', 'scheme_question'
    """
    msg = message.lower()
    
    # 1. Application Guidance
    guidance_kws = ["apply", "how do i apply", "how can i apply", "where do i apply", "documents", "process", "steps", "application", "document required"]
    if any(kw in msg for kw in guidance_kws):
        return "guidance"
        
    # 2. Eligibility
    eligibility_kws = ["eligible", "eligibility", "qualify", "fit", "suit", "match", "qualifications", "reasons", "match score"]
    if any(kw in msg for kw in eligibility_kws):
        return "eligibility"
        
    # 3. Updates
    updates_kws = ["update", "news", "announcement", "recent", "latest", "changes"]
    if any(kw in msg for kw in updates_kws):
        return "updates"
        
    # 4. Notifications
    notifications_kws = ["notification", "alert", "message", "inbox", "unread", "deadline"]
    if any(kw in msg for kw in notifications_kws):
        return "notifications"
        
    return "scheme_question"


def search_schemes(query: str, schemes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Performs a case-insensitive match on scheme name, description, category, and eligibility_criteria.
    Returns the top 3-5 matching schemes.
    """
    keywords = [k.strip().lower() for k in query.lower().split() if len(k.strip()) > 2]
    if not keywords:
        return []
        
    scored_schemes = []
    for scheme in schemes:
        score = 0
        name = str(scheme.get("scheme_name", "")).lower()
        desc = str(scheme.get("description", "")).lower()
        cat = str(scheme.get("category", "")).lower()
        elig = str(scheme.get("eligibility_criteria", "")).lower()
        
        for kw in keywords:
            if kw in name:
                score += 10
            if kw in cat:
                score += 5
            if kw in desc:
                score += 3
            if kw in elig:
                score += 2
                
            # Synonym / keyword matches
            if kw == "farmer" and ("kisan" in name or "kisan" in desc or "kisan" in elig):
                score += 10
            if kw in ["women", "woman", "girl", "female"]:
                if any(x in name or x in desc or x in elig for x in ["girl", "female", "beti", "sukanya", "pragati"]):
                    score += 12
            if kw in ["student", "scholarship", "education"]:
                if any(x in name or x in cat or x in desc for x in ["scholarship", "matric", "pragati", "saksham", "yasasvi"]):
                    score += 12
            if kw in ["business", "startup", "entrepreneur", "loan"]:
                if any(x in name or x in desc for x in ["mudra", "stand-up", "startup", "pmegp"]):
                    score += 12
                    
        if score > 0:
            scored_schemes.append((score, scheme))
            
    scored_schemes.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_schemes[:5]]


def call_gemini(system_prompt: str, user_prompt: str, history: List[Dict[str, str]], api_key: str) -> str:
    """Invokes Gemini API via standard POST REST request."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    contents = []
    for h in history:
        role = "user" if h["role"] == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": h["content"]}]
        })
        
    contents.append({
        "role": "user",
        "parts": [{"text": user_prompt}]
    })
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    res_data = response.json()
    
    try:
        return res_data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise ValueError("Invalid response format from Gemini API")


def call_openai(system_prompt: str, user_prompt: str, history: List[Dict[str, str]], api_key: str) -> str:
    """Invokes OpenAI API via standard POST REST request."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
        
    messages.append({"role": "user", "content": user_prompt})
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.3
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    res_data = response.json()
    
    try:
        return res_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise ValueError("Invalid response format from OpenAI API")


def call_llm_with_retry(system_prompt: str, user_prompt: str, history: List[Dict[str, str]]) -> str:
    """Selects configured API and runs with exponential backoff retries for transient errors."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    runanywhere_key = os.environ.get("RUNANYWHEREAI_KEY")
    
    api_to_call = None
    key_to_use = None
    
    if gemini_key:
        api_to_call = "gemini"
        key_to_use = gemini_key
    elif openai_key:
        api_to_call = "openai"
        key_to_use = openai_key
    elif runanywhere_key and runanywhere_key.startswith("sk-"):
        api_to_call = "openai"
        key_to_use = runanywhere_key
        
    if not api_to_call:
        # User-friendly fallback message when keys are missing
        return (
            "**Welcome to Saathi!** 🙏 I am your JanSahay AI assistant.\n\n"
            "I noticed that no `GEMINI_API_KEY` or `OPENAI_API_KEY` is configured in the `.env` file.\n"
            "Please configure your API keys to enable interactive conversation with me.\n\n"
            "In the meantime, I have retrieved the local database context for your prompt:\n"
            f"- **User Query**: *\"{user_prompt[:150]}...\"*\n"
        )
        
    delays = [1, 2, 4]  # Retry 1: 1s, Retry 2: 2s, Retry 3: 4s
    for attempt in range(4):
        try:
            if api_to_call == "gemini":
                return call_gemini(system_prompt, user_prompt, history, key_to_use)
            else:
                return call_openai(system_prompt, user_prompt, history, key_to_use)
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else 500
            
            # Transient failures (500-504)
            if status_code in [500, 502, 503, 504]:
                if attempt < 3:
                    # Security Audit Comment: Safe retry backoff without leaking keys
                    time.sleep(delays[attempt])
                    continue
                else:
                    raise AITemporarilyUnavailableException("Transient errors persisted after retries") from e
            else:
                # Non-transient errors (like 429 rate limit, etc.)
                raise AIServiceUnavailableException(f"HTTP error {status_code} occurred") from e
        except (requests.exceptions.Timeout,
                requests.exceptions.ConnectionError,
                requests.exceptions.SSLError) as e:
            # Network timeout, DNS failure, SSL failure, Connection reset
            raise AIServiceUnavailableException("Network/timeout/connection error occurred") from e
        except Exception as e:
            raise AIServiceUnavailableException("Unexpected error during LLM call") from e


def get_required_documents(scheme_name: str, category: str) -> List[str]:
    """Deterministically returns list of required documents for a scheme based on category/name."""
    name_lower = scheme_name.lower()
    cat_lower = category.lower()
    
    docs = ["Aadhaar Card"]
    
    if "scholarship" in name_lower or "matric" in name_lower or cat_lower == "education":
        docs.extend(["Income Certificate", "Domicile Certificate", "Bank Passbook"])
        if any(x in name_lower for x in ["yasasvi", "pragati", "saksham"]) or "scholarship" in name_lower:
            docs.append("Caste Certificate")
        if "saksham" in name_lower:
            docs.append("Disability Certificate")
            
    elif cat_lower == "agriculture" or "kisan" in name_lower or "fasal" in name_lower:
        docs.extend(["Domicile Certificate", "Bank Passbook", "Ration Card"])
        
    elif cat_lower == "business" or "mudra" in name_lower or "startup" in name_lower or "pmegp" in name_lower:
        docs.extend(["PAN Card", "Bank Passbook", "Income Certificate"])
        
    elif cat_lower == "healthcare" or "ayushman" in name_lower:
        docs.extend(["Ration Card", "Income Certificate"])
        
    elif cat_lower == "women" or "sukanya" in name_lower or "beti" in name_lower:
        docs.extend(["Domicile Certificate", "Bank Passbook"])
        
    elif cat_lower in ["employment", "social security", "labour", "unorganized"]:
        docs.extend(["Bank Passbook"])
        
    return list(sorted(set(docs)))


def execute_ai_chat(
    user_id: Optional[str],
    message: str,
    session_id: str,
    language: str = "en",
    apply_scheme_id: Optional[str] = None,
    extra_demographics: Optional[Dict[str, Any]] = None,
    user_documents: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Main orchestration entry point. Matches profile, determines intent, 
    fetches minimal context, queries LLM, and formats response.
    """
    # 1. Load User Profile
    user_profile = None
    if user_id and supabase_client:
        try:
            resp = supabase_client.table('users').select('*').eq('id', user_id).execute()
            if resp.data:
                user_profile = resp.data[0]
                if extra_demographics:
                    user_profile["extra_demographics"] = extra_demographics
        except Exception:
            pass
    elif extra_demographics:
        # Guest user with a saved local profile
        income_map = {
            "Below ₹1 Lakh": 80000.0,
            "₹1L – ₹3L": 200000.0,
            "₹3L – ₹6L": 450000.0,
            "₹6L – ₹18L": 1200000.0,
            "Above ₹18L": 2000000.0
        }
        raw_income = extra_demographics.get("income")
        income_float = 0.0
        if isinstance(raw_income, (int, float)):
            income_float = float(raw_income)
        elif isinstance(raw_income, str):
            income_float = income_map.get(raw_income, 0.0)
            if not income_float:
                try:
                    income_float = float(raw_income.replace("₹", "").replace("L", "00000").replace(" ", ""))
                except:
                    pass
        
        user_profile = {
            "name": extra_demographics.get("name", "Guest Citizen"),
            "age": int(extra_demographics.get("age") or 0) if extra_demographics.get("age") else 0,
            "gender": extra_demographics.get("gender", "Female"),
            "state": extra_demographics.get("state", ""),
            "income": income_float,
            "occupation": extra_demographics.get("occupation", ""),
            "education": extra_demographics.get("education", ""),
            "extra_demographics": extra_demographics
        }
            
    # 2. Determine User Intent
    intent = detect_intent(message)
    
    # 3. Retrieve Context & Matched Schemes
    context_data = ""
    matched_schemes_context: List[Dict[str, Any]] = []
    cta = None
    
    # Fetch all schemes only when needed (guidance, eligibility, scheme_question)
    all_schemes = []
    if (intent in ["guidance", "eligibility", "scheme_question"] or apply_scheme_id) and supabase_client:
        try:
            resp = supabase_client.table('schemes').select('*').execute()
            all_schemes = resp.data or []
        except Exception:
            pass

    if intent == "eligibility":
        if not user_profile:
            context_data = "User has no profile saved. Tell the user they need to set up their Profile first to evaluate scheme eligibility matching."
            cta = {"to": "/profile", "label": "Set Up Profile"}
        else:
            # Run eligibility engine
            matched_results = match_user_with_schemes(user_profile, all_schemes)
            matched_schemes_context = matched_results
            
            # Format summarized context
            eligible_names = [s["scheme_name"] for s in matched_results if s.get("eligible")]
            partial_names = [s["scheme_name"] for s in matched_results if not s.get("eligible") and s.get("match_score", 0) >= 40]
            
            extra = user_profile.get("extra_demographics") or {}
            context_data = (
                f"User Profile details: Age={user_profile.get('age')}, Income={user_profile.get('income')}, Gender={user_profile.get('gender')}, "
                f"State={user_profile.get('state')}, District={extra.get('district', 'N/A')}, Occupation={user_profile.get('occupation')}, "
                f"Education={user_profile.get('education')}, Category={extra.get('category', 'General')}, "
                f"Disability={'Yes' if str(extra.get('disabilityStatus', 'No')).lower() == 'yes' else 'No'}.\n"
                f"Eligibility Evaluation Results:\n"
                f"- Fully Eligible Schemes: {', '.join(eligible_names) if eligible_names else 'None'}\n"
                f"- Partially Eligible Schemes: {', '.join(partial_names) if partial_names else 'None'}\n"
            )
            cta = {"to": "/eligibility/results", "label": "View Eligibility Breakdown"}
            
    elif intent == "updates":
        try:
            resp = supabase_client.table('updates').select('*').execute()
            updates = resp.data or []
            context_data = "Recent Government Updates:\n"
            for u in updates[:4]:
                context_data += f"- {u.get('date')}: {u.get('title')} ({u.get('summary')})\n"
        except Exception:
            context_data = "Updates database is currently offline."
            
    elif intent == "notifications":
        try:
            resp = supabase_client.table('notifications').select('*').execute()
            notifs = resp.data or []
            context_data = "User Inbox Notifications:\n"
            for n in notifs[:4]:
                context_data += f"- [{n.get('category')}]: {n.get('title')} - {n.get('message')}\n"
        except Exception:
            context_data = "Notification inbox is offline."
            
    elif intent == "guidance":
        # Guidance on how to apply / documents required
        relevant = search_schemes(message, all_schemes)
        if user_profile and relevant:
            matched_relevant = match_user_with_schemes(user_profile, relevant)
            matched_schemes_context = matched_relevant
            context_data = "Application Steps, Required Documents & User Eligibility Context:\n"
            for s in matched_relevant:
                eligible_str = "Eligible" if s.get("eligible") else "Not Eligible"
                req_docs = get_required_documents(s.get('scheme_name', ''), s.get('category', ''))
                user_docs = user_documents or []
                doc_comparison = ""
                for doc in req_docs:
                    if doc in user_docs:
                        doc_comparison += f"✅ {doc}\n"
                    else:
                        doc_comparison += f"❌ {doc}\n"
                context_data += (
                    f"Scheme: {s.get('scheme_name')}\n"
                    f"- Description: {s.get('description')}\n"
                    f"- Eligibility Criteria: {s.get('eligibility_criteria')}\n"
                    f"- Official Website: {s.get('official_link')}\n"
                    f"- User Eligibility Status: {eligible_str} (Match Score: {s.get('match_score')}/100)\n"
                    f"- Required vs Owned Documents Checklist:\n{doc_comparison}\n\n"
                )
        elif relevant:
            matched_schemes_context = relevant
            context_data = "Application Steps and Required Documents Context:\n"
            for s in relevant:
                context_data += (
                    f"Scheme: {s.get('scheme_name')}\n"
                    f"- Description: {s.get('description')}\n"
                    f"- Eligibility Criteria: {s.get('eligibility_criteria')}\n"
                    f"- Official Website: {s.get('official_link')}\n\n"
                )
        else:
            context_data = "No matching schemes found for application guidance."
            
    else:  # intent == "scheme_question"
        relevant = search_schemes(message, all_schemes)
        if user_profile and relevant:
            matched_relevant = match_user_with_schemes(user_profile, relevant)
            matched_schemes_context = matched_relevant
            context_data = "Relevant Scheme Details & User Eligibility Context:\n"
            for s in matched_relevant:
                eligible_str = "Eligible" if s.get("eligible") else "Not Eligible"
                failed_checks_str = ", ".join(s.get("failed_checks", []))
                reasons_str = ", ".join(s.get("reasons", []))
                req_docs = get_required_documents(s.get('scheme_name', ''), s.get('category', ''))
                user_docs = user_documents or []
                doc_comparison = ""
                for doc in req_docs:
                    if doc in user_docs:
                        doc_comparison += f"✅ {doc}\n"
                    else:
                        doc_comparison += f"❌ {doc}\n"
                context_data += (
                    f"Scheme Name: {s.get('scheme_name')}\n"
                    f"- Benefit/Description: {s.get('description')}\n"
                    f"- Category: {s.get('category')}\n"
                    f"- State: {s.get('state')}\n"
                    f"- Eligibility Text: {s.get('eligibility_criteria')}\n"
                    f"- User Eligibility Status: {eligible_str} (Match Score: {s.get('match_score')}/100)\n"
                    f"- Eligibility Reasons: {reasons_str}\n"
                    f"- Failed Eligibility Checks: {failed_checks_str if failed_checks_str else 'None'}\n"
                    f"- Required vs Owned Documents Checklist:\n{doc_comparison}\n\n"
                )
        elif relevant:
            matched_schemes_context = relevant
            context_data = "Relevant Scheme Details Context:\n"
            for s in relevant:
                context_data += (
                    f"Scheme Name: {s.get('scheme_name')}\n"
                    f"- Benefit/Description: {s.get('description')}\n"
                    f"- Category: {s.get('category')}\n"
                    f"- State: {s.get('state')}\n"
                    f"- Eligibility Text: {s.get('eligibility_criteria')}\n\n"
                )
        else:
            context_data = "No matching schemes found. Advise user on general categories (Agriculture, Education, Healthcare, Business)."

    # 4. Construct Prompt Context
    user_prompt = f"User Intent detected: {intent.upper()}\n"
    if user_profile:
         extra = user_profile.get("extra_demographics") or {}
         user_prompt += (
             f"Active User Demographics: Name {user_profile.get('name')}, Age {user_profile.get('age')}, State {user_profile.get('state')}, "
             f"District {extra.get('district')}, Occupation {user_profile.get('occupation')}, "
             f"Category {extra.get('category')}.\n"
         )
    user_prompt += f"Retrieved Database Context:\n{context_data}\n\n"
    user_prompt += f"User Message: {message}\n"
    
    # 5. Formulate language instructions and guided application details
    lang_instruction = ""
    if language == "hi":
        lang_instruction = (
            "\n[SYSTEM INSTRUCTION: LANGUAGE DIRECTIVE]\n"
            "You MUST respond completely and natively in Hindi (हिन्दी) using Devanagari script. "
            "Keep the tone friendly, polite, and citizen-oriented."
        )
    else:
        lang_instruction = (
            "\n[SYSTEM INSTRUCTION: LANGUAGE DIRECTIVE]\n"
            "You MUST respond completely and natively in English."
        )

    apply_context = ""
    if apply_scheme_id:
        target_scheme = next((s for s in all_schemes if str(s.get("id")) == str(apply_scheme_id)), None)
        if target_scheme:
            scheme_name = target_scheme.get("scheme_name", "")
            category = target_scheme.get("category", "")
            req_docs = get_required_documents(scheme_name, category)
            user_docs = user_profile.get("documents", []) if user_profile else []
            available_docs = [d for d in req_docs if d in user_docs]
            missing_docs = [d for d in req_docs if d not in user_docs]

            apply_context = (
                f"\n[SYSTEM INSTRUCTION: GUIDED APPLICATION FLOW]\n"
                f"The user wants step-by-step guidance on how to apply for the scheme: '{scheme_name}'.\n"
                f"First, acknowledge with: 'I'll help you apply for this scheme.' (or in Hindi if preferred).\n"
                f"Evaluate document readiness using the citizen's profile:\n"
                f"- Total required documents: {', '.join(req_docs) if req_docs else 'None'}\n"
                f"- Documents they already have: {', '.join(available_docs) if available_docs else 'None'}\n"
                f"- Missing documents: {', '.join(missing_docs) if missing_docs else 'None'}\n\n"
                f"Ask the user step-by-step whether they possess the missing documents (e.g. 'Do you already have Aadhaar Card?'), and guide them based on their response.\n"
                f"Explain which documents are available, which are missing, and what needs to be prepared before applying.\n"
                f"Finally, explain the complete application process step-by-step.\n"
                f"CRITICAL: Never claim that you can submit applications or modify official records."
            )

    personalization_prompt = ""
    if user_profile:
        is_guest = (user_id is None)
        extra = user_profile.get("extra_demographics") or {}
        
        profile_details = [
            f"Name: {user_profile.get('name')}",
            f"Age: {user_profile.get('age')}",
            f"Gender: {user_profile.get('gender')}",
            f"State: {user_profile.get('state')}",
            f"Income: ₹{user_profile.get('income'):,.0f} annually",
            f"Occupation: {user_profile.get('occupation')}",
            f"Education: {user_profile.get('education')}",
            f"District: {extra.get('district', 'N/A')}",
            f"Category: {extra.get('category', 'General')}",
            f"Disability Status: {'Yes' if str(extra.get('disabilityStatus', 'No')).lower() == 'yes' else 'No'}",
            f"Farmer status: {'Yes' if str(user_profile.get('occupation', '')).lower() == 'farmer' else 'No'}",
            f"Student status: {'Yes' if str(user_profile.get('occupation', '')).lower() == 'student' else 'No'}",
            f"Landowner status: {extra.get('land', 'No')}",
            f"Girl child status: {extra.get('girl_child', 'No')}",
            f"Household type: {extra.get('household', 'N/A')}"
        ]
        profile_context_str = "\n".join([f"- {d}" for d in profile_details])
        
        mode_str = "GUEST USER (with saved local profile)" if is_guest else "SIGNED-IN USER"
        personalization_prompt = f"""
[USER MODE: {mode_str}]
The user has a saved profile. You MUST provide a personalized experience using their saved profile.
Here is the user's saved profile data:
{profile_context_str}

Guidelines:
1. Do NOT ask for demographic or personal information that is already provided in the user's profile (such as age, state, income, occupation, gender, education, category, district, disability status, landowner status, girl child status, etc.).
2. If they ask about eligibility or "Which schemes am I eligible for?", directly analyze this profile against the schemes in the context and recommend schemes.
3. If they ask about a specific scheme (e.g. PM Kisan), check if they meet the eligibility criteria using the profile details, explain their eligibility status based on their profile, and do NOT ask them for demographic details again.
4. Compare required documents for schemes against their owned documents (shown in context with ✅/❌) and explain document readiness.
5. Only ask follow-up questions if required profile information is genuinely missing to determine eligibility.
"""
    else:
        personalization_prompt = """
[USER MODE: GUEST (no saved profile)]
The user has no saved profile.
Guidelines:
1. Politely ask the user ONLY for the minimum information required to determine eligibility (specifically: Age, State, Income, and Occupation).
2. Do NOT assume any profile data.
3. Inform them that they can fill in their Profile or sign in to save their preferences and receive automated eligibility checks.
"""

    system_prompt = SYSTEM_PROMPT + personalization_prompt + lang_instruction + apply_context

    # 6. Load Session Memory
    history = CONVERSATION_MEMORY.get(session_id, [])
    
    # 7. Call LLM
    ai_response_text = call_llm_with_retry(system_prompt, user_prompt, history)
    
    # 8. Update Session Memory (Rolling last 10 messages)
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": ai_response_text})
    if len(history) > 10:
        history = history[-10:]
    CONVERSATION_MEMORY[session_id] = history
    
    # 9. Map Scheme Context to Frontend Structure
    formatted_schemes = []
    for s in matched_schemes_context:
        formatted_schemes.append({
            "id": s.get("id"),
            "title": s.get("scheme_name"),
            "benefit": s.get("description", "Government Benefit"),
            "department": s.get("category", "General")
        })
        
    return {
        "response": ai_response_text,
        "schemes": formatted_schemes,
        "cta": cta
    }
