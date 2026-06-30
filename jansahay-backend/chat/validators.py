import re
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class GeneralChatRequest(BaseModel):
    userId: str
    sessionId: str
    message: str
    language: str = "en"
    extra_demographics: Optional[Dict[str, Any]] = None
    user_documents: Optional[List[str]] = None

# In-memory rate limiting store: key (user_id/session_id) -> list of timestamps
RATE_LIMIT_STORE: Dict[str, List[float]] = {}
LIMIT_WINDOW_SECONDS = 60
LIMIT_MAX_REQUESTS = 20

def sanitize_text(text: str) -> str:
    """
    Remove HTML/Script tags to prevent injection attacks, and clean excess whitespace.
    """
    if not text:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r'<[^>]*>', '', text)
    # Strip script contents if tags were somehow partially written
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def check_rate_limit(key: str) -> bool:
    """
    Checks if a key (e.g. session_id or user_id) has exceeded rate limits.
    Returns True if allowed, False if rate limited.
    """
    now = time.time()
    if key not in RATE_LIMIT_STORE:
        RATE_LIMIT_STORE[key] = [now]
        return True
    
    # Filter timestamps within the current window
    timestamps = [t for t in RATE_LIMIT_STORE[key] if now - t < LIMIT_WINDOW_SECONDS]
    RATE_LIMIT_STORE[key] = timestamps
    
    if len(timestamps) >= LIMIT_MAX_REQUESTS:
        return False
        
    RATE_LIMIT_STORE[key].append(now)
    return True
