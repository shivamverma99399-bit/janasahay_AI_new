import time
from typing import Any, Dict, List, Optional
from services.eligibility_engine import match_user_with_schemes

# In-memory schemes cache: data -> list of schemes, timestamp -> float
SCHEMES_CACHE: Dict[str, Any] = {
    "data": None,
    "timestamp": 0.0
}
CACHE_DURATION_SECONDS = 300  # 5 minutes cache

def get_required_documents(scheme_name: str, category: str) -> List[str]:
    """
    Returns required documents for a scheme based on its category and name.
    """
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

def fetch_cached_schemes(supabase_client) -> List[Dict[str, Any]]:
    """
    Fetches schemes from Supabase with in-memory caching.
    """
    now = time.time()
    if SCHEMES_CACHE["data"] is not None and (now - SCHEMES_CACHE["timestamp"] < CACHE_DURATION_SECONDS):
        return SCHEMES_CACHE["data"]
        
    try:
        resp = supabase_client.table('schemes').select('*').execute()
        schemes = resp.data or []
        SCHEMES_CACHE["data"] = schemes
        SCHEMES_CACHE["timestamp"] = now
        return schemes
    except Exception as e:
        # Fallback to cache if database error occurs
        if SCHEMES_CACHE["data"] is not None:
            return SCHEMES_CACHE["data"]
        raise e

def load_user_profile(
    user_id: Optional[str],
    extra_demographics: Optional[Dict[str, Any]],
    supabase_client
) -> Optional[Dict[str, Any]]:
    """
    Resolves the user profile either by fetching from Supabase or parsing guest details.
    """
    user_profile = None
    
    if user_id and user_id != "user_001" and supabase_client:
        try:
            resp = supabase_client.table('users').select('*').eq('id', user_id).execute()
            if resp.data:
                user_profile = resp.data[0]
                if extra_demographics:
                    user_profile["extra_demographics"] = extra_demographics
        except Exception:
            pass
            
    if not user_profile and extra_demographics:
        # Resolve guest profile income range map
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
        
    return user_profile

def build_context(
    user_profile: Optional[Dict[str, Any]],
    user_documents: Optional[List[str]],
    message: str,
    supabase_client
) -> Dict[str, Any]:
    """
    Gathers matches, eligibility reports, schemes details, and document checklists.
    """
    try:
        all_schemes = fetch_cached_schemes(supabase_client)
    except Exception:
        all_schemes = []
        
    matched_schemes = []
    eligibility_report = []
    
    if user_profile and all_schemes:
        # Run standard local matching engine
        matched_schemes = match_user_with_schemes(user_profile, all_schemes)
        
        # Populate detailed eligibility context
        for scheme in matched_schemes:
            req_docs = get_required_documents(scheme.get("scheme_name", ""), scheme.get("category", ""))
            owned_docs = user_documents or []
            
            missing_docs = [doc for doc in req_docs if doc not in owned_docs]
            owned_docs_checklist = [doc for doc in req_docs if doc in owned_docs]
            
            eligibility_report.append({
                "schemeId": scheme.get("id"),
                "schemeName": scheme.get("scheme_name"),
                "eligible": scheme.get("eligible", False),
                "matchScore": scheme.get("match_score", 0),
                "reasons": scheme.get("reasons", []),
                "failedChecks": scheme.get("failed_checks", []),
                "requiredDocuments": req_docs,
                "ownedDocuments": owned_docs_checklist,
                "missingDocuments": missing_docs
            })
            
    return {
        "user_profile": user_profile,
        "all_schemes": all_schemes,
        "matched_schemes": matched_schemes,
        "eligibility_report": eligibility_report,
        "user_documents": user_documents or []
    }
