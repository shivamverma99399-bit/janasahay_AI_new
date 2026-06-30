from typing import Dict, List

# In-memory session store: session_id -> list of message dicts (role: "user"/"assistant", content: "...")
CONVERSATION_MEMORY: Dict[str, List[Dict[str, str]]] = {}
MAX_HISTORY_MESSAGES = 10

def get_history(session_id: str) -> List[Dict[str, str]]:
    """
    Retrieves the conversation history for a given session.
    """
    if not session_id:
        return []
    return CONVERSATION_MEMORY.get(session_id, [])

def add_message(session_id: str, role: str, content: str):
    """
    Adds a message to the history and trims it if it exceeds MAX_HISTORY_MESSAGES.
    """
    if not session_id:
        return
        
    if session_id not in CONVERSATION_MEMORY:
        CONVERSATION_MEMORY[session_id] = []
        
    CONVERSATION_MEMORY[session_id].append({
        "role": role,
        "content": content
    })
    
    # Trim to stay within token / history size budget
    if len(CONVERSATION_MEMORY[session_id]) > MAX_HISTORY_MESSAGES:
        CONVERSATION_MEMORY[session_id] = CONVERSATION_MEMORY[session_id][-MAX_HISTORY_MESSAGES:]

def clear_history(session_id: str):
    """
    Clears the history for a given session.
    """
    if session_id in CONVERSATION_MEMORY:
        CONVERSATION_MEMORY[session_id] = []
