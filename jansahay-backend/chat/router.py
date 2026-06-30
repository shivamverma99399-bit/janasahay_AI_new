import os
import logging
from fastapi import APIRouter, HTTPException, Response, status
from supabase import create_client, Client

from chat.validators import GeneralChatRequest, sanitize_text, check_rate_limit
from chat.conversation import get_history, add_message, clear_history
from chat.context import load_user_profile, build_context
from chat.prompt_builder import build_system_prompt, build_user_prompt
from chat.llm_service import query_llm
from chat.formatter import clean_and_parse_json, create_fallback_response

logger = logging.getLogger("jansahay.chat_router")
logger.setLevel(logging.INFO)

router = APIRouter()

# Initialize Supabase client for DB contexts
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client in chat router: {e}")

@router.post("/chat")
def chat_endpoint(request: GeneralChatRequest, response: Response):
    """
    Modular chatbot endpoint. Validates, handles rate limits, gathers context,
    runs LLM, updates history, and returns structured JSON output.
    """
    session_id = request.sessionId
    user_id = request.userId
    
    # 1. Rate Limiting Check
    if not check_rate_limit(session_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another message."
        )
        
    # 2. Input Sanitization
    sanitized_message = sanitize_text(request.message)
    if not sanitized_message:
        return create_fallback_response("Please enter a valid message.")
        
    try:
        # 3. Load User Profile & Context
        active_user_id = None if user_id == "user_001" or not user_id else user_id
        user_profile = load_user_profile(active_user_id, request.extra_demographics, supabase_client)
        context_data = build_context(user_profile, request.user_documents, sanitized_message, supabase_client)
        
        # 4. Get Conversation Memory
        history = get_history(session_id)
        
        # 5. Build Prompts
        system_prompt = build_system_prompt(request.language)
        user_prompt = build_user_prompt(sanitized_message, context_data)
        
        # 6. Execute LLM Call
        raw_llm_response = query_llm(system_prompt, user_prompt, history)
        
        # 7. Format Output JSON
        formatted_response = clean_and_parse_json(raw_llm_response)
        
        # 8. Update Memory (Only save textual user query and assistant answer for flow)
        add_message(session_id, "user", sanitized_message)
        add_message(session_id, "assistant", formatted_response["answer"])
        
        return formatted_response
        
    except Exception as e:
        logger.error(f"Error occurred in chat_endpoint: {e}", exc_info=True)
        # Graceful error response containing structured JSON fallback instead of status 500 crashes
        return create_fallback_response(
            "I encountered a temporary issue while connecting to the Saathi AI services. Please try sending your message again."
        )

@router.post("/chat/clear")
def clear_chat_endpoint(request: dict):
    """
    Clears the rolling memory for a given session.
    """
    session_id = request.get("sessionId")
    if session_id:
        clear_history(session_id)
        return {"success": True, "message": "Conversation history cleared successfully."}
    raise HTTPException(status_code=400, detail="Missing sessionId in clear chat request.")
