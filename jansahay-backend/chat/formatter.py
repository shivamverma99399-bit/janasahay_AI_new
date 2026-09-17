import json
import logging
import re
from typing import Any, Dict

logger = logging.getLogger("jansahay.formatter")

def clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """
    Cleans up any markdown wrapper blocks (e.g. ```json ... ```) from LLM output,
    extracts the raw JSON object string, and parses it.
    If parsing fails, returns a safe fallback structured dictionary.
    """
    if not raw_text:
        return create_fallback_response("No response received from the AI model.")
        
    cleaned = raw_text.strip()
    
    # Strip markdown block tags if present
    if cleaned.startswith("```"):
        # Match from first '{' to last '}'
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1)
        else:
            # Strip fences manually
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        
        # Enforce all required fields from the structured format
        formatted_response = {
            "answer": str(data.get("answer", "")),
            "matchedSchemes": list(data.get("matchedSchemes", [])),
            "eligibility": list(data.get("eligibility", [])),
            "recommendedActions": list(data.get("recommendedActions", [])),
            "confidence": float(data.get("confidence", 0.95)),
            "sources": list(data.get("sources", []))
        }
        
        # Clean scheme and eligibility item fields to ensure correct formatting
        for idx, scheme in enumerate(formatted_response["matchedSchemes"]):
            formatted_response["matchedSchemes"][idx] = {
                "id": scheme.get("id", ""),
                "title": scheme.get("title", scheme.get("scheme_name", "")),
                "benefit": scheme.get("benefit", scheme.get("description", "")),
                "department": scheme.get("department", scheme.get("category", ""))
            }
            
        for idx, report in enumerate(formatted_response["eligibility"]):
            formatted_response["eligibility"][idx] = {
                "schemeId": report.get("schemeId", ""),
                "schemeName": report.get("schemeName", ""),
                "eligible": bool(report.get("eligible", False)),
                "reasons": list(report.get("reasons", [])),
                "failedChecks": list(report.get("failedChecks", []))
            }
            
        cleaned_actions = []
        for action in formatted_response["recommendedActions"]:
            if isinstance(action, dict):
                to_val = str(action.get("to", "")).strip()
                label_val = str(action.get("label", "")).strip()
                # Normalize /scheme/guide/<id> or /schemes/<id> to /scheme/<id>
                guide_match = re.search(r"/(?:scheme|schemes)/(?:guide|apply)/([0-9a-fA-F-]+)", to_val)
                if guide_match:
                    to_val = f"/scheme/{guide_match.group(1)}"
                elif to_val.startswith("/schemes/"):
                    to_val = to_val.replace("/schemes/", "/scheme/")
                cleaned_actions.append({"label": label_val, "to": to_val})
        formatted_response["recommendedActions"] = cleaned_actions
            
        return formatted_response
        
    except Exception as e:
        logger.error(f"Failed to parse or structure raw LLM response as JSON: {e}. Raw text was: {raw_text}")
        return create_fallback_response(raw_text)

def create_fallback_response(raw_answer: str) -> Dict[str, Any]:
    """
    Creates a fallback structured response containing the raw response in the answer field.
    """
    return {
      "answer": raw_answer,
      "matchedSchemes": [],
      "eligibility": [],
      "recommendedActions": [],
      "confidence": 0.50,
      "sources": []
    }
