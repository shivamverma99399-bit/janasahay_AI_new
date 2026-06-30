from typing import Any, Dict, List, Optional

SYSTEM_INSTRUCTIONS = """You are Saathi AI, the official verified AI assistant of JanSahay.
Your job is to explain government scheme benefits, eligibility criteria, required documents, application processes, and updates to Indian citizens in a friendly, clear, and easy-to-understand language.

Strict Guidelines:
1. Acknowledge and use the backend database context and eligibility results provided.
2. Never invent government schemes, deadlines, or benefits.
3. Never guess eligibility status. If eligibility results are provided, explain them simply. If not available, ask the user to complete their profile.
4. For application guidance queries: explain the process clearly, but never claim that you can submit applications or modify official records.
5. If the required information is not present in the provided context, state that clearly and offer to help with other queries.
6. Present your answer using clean formatting: use **bold text** for emphasis and bullet points (-) for lists where applicable. Keep the language citizen-friendly.
7. Return your response ONLY as a valid structured JSON object matching the JSON schema below. Do not wrap the JSON in markdown code blocks like ```json ... ```, return it as plain text.

JSON Schema:
{
  "answer": "A friendly, personalized conversational explanation of the schemes, eligibility status, or answers to the user's questions. Use **bolding** and bullet points (- ) where appropriate. Keep it clear, concise, and structured.",
  "matchedSchemes": [
    {
      "id": int/string,
      "title": "Scheme Name",
      "benefit": "Brief description of the benefit",
      "department": "Category/Department name"
    }
  ],
  "eligibility": [
    {
      "schemeId": int/string,
      "schemeName": "Scheme Name",
      "eligible": boolean,
      "reasons": ["string describing why they match"],
      "failedChecks": ["string describing failed checks if not eligible"]
    }
  ],
  "recommendedActions": [
    {
      "label": "Action label (e.g. Set Up Profile, View Eligibility Breakdown)",
      "to": "Destination route (e.g. /profile, /eligibility/results)"
    }
  ],
  "confidence": float between 0.0 and 1.0 representing confidence in the response,
  "sources": ["List of scheme names or update dates referred to"]
}
"""

def build_system_prompt(language: str = "en") -> str:
    """
    Returns the core system instruction prompt.
    """
    prompt = SYSTEM_INSTRUCTIONS
    
    # Language instructions
    if language == "hi":
        prompt += (
            "\n[LANGUAGE DIRECTIVE]\n"
            "You MUST respond completely in Hindi (हिन्दी) using Devanagari script for the 'answer' field and labels. "
            "Keep the tone friendly, polite, and citizen-oriented."
        )
    else:
        prompt += (
            "\n[LANGUAGE DIRECTIVE]\n"
            "You MUST respond in English for all textual fields."
        )
        
    return prompt

def build_user_prompt(
    message: str,
    context: Dict[str, Any]
) -> str:
    """
    Constructs the contextual user prompt combining profile, eligibility, and message context.
    """
    user_profile = context.get("user_profile")
    eligibility_report = context.get("eligibility_report") or []
    user_documents = context.get("user_documents") or []
    
    prompt_lines = []
    
    # 1. User Demographics
    if user_profile:
        extra = user_profile.get("extra_demographics") or {}
        prompt_lines.append("Active User Profile:")
        prompt_lines.append(f"- Name: {user_profile.get('name')}")
        prompt_lines.append(f"- Age: {user_profile.get('age')}")
        prompt_lines.append(f"- Gender: {user_profile.get('gender')}")
        prompt_lines.append(f"- State: {user_profile.get('state')}")
        prompt_lines.append(f"- Income: ₹{user_profile.get('income'):,.0f} annually")
        prompt_lines.append(f"- Occupation: {user_profile.get('occupation')}")
        prompt_lines.append(f"- Education: {user_profile.get('education')}")
        prompt_lines.append(f"- Category: {extra.get('category', 'General')}")
        prompt_lines.append(f"- Disability Status: {'Yes' if str(extra.get('disabilityStatus', 'No')).lower() == 'yes' else 'No'}")
        prompt_lines.append(f"- Owned Documents: {', '.join(user_documents) if user_documents else 'None'}")
    else:
        prompt_lines.append("Active User Profile: None (Guest User)")
        
    # 2. Database Eligibility Context
    prompt_lines.append("\nBackend Database Context & Eligibility Metrics:")
    if eligibility_report:
        for item in eligibility_report[:5]:  # Limit context size to top 5 schemes
            eligible_str = "Eligible" if item["eligible"] else "Not Eligible"
            prompt_lines.append(
                f"- Scheme: {item['schemeName']} (ID: {item['schemeId']})\n"
                f"  Status: {eligible_str} (Match Score: {item['matchScore']}/100)\n"
                f"  Reasons: {', '.join(item['reasons']) if item['reasons'] else 'N/A'}\n"
                f"  Failed Checks: {', '.join(item['failedChecks']) if item['failedChecks'] else 'None'}\n"
                f"  Required Documents: {', '.join(item['requiredDocuments'])}\n"
                f"  Missing Documents: {', '.join(item['missingDocuments']) if item['missingDocuments'] else 'None'}"
            )
    else:
        prompt_lines.append("- No eligible schemes found or profile is missing to run eligibility evaluation.")
        
    # 3. User Message
    prompt_lines.append(f"\nUser Message: {message}")
    
    return "\n".join(prompt_lines)
