import os
import time
import logging
from typing import Any, Dict, List
import requests

logger = logging.getLogger("jansahay.llm_service")
logger.setLevel(logging.INFO)

def call_gemini(system_prompt: str, user_prompt: str, history: List[Dict[str, str]], api_key: str) -> str:
    """
    Invokes the Gemini API via its REST endpoint.
    """
    # Use gemini-2.5-flash for reliable response generation
    model_name = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    contents = []
    # Build content turns from conversation history
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
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload, timeout=15.0)
    latency = time.time() - start_time
    logger.info(f"Gemini API Latency: {latency:.3f} seconds")
    
    response.raise_for_status()
    res_data = response.json()
    
    try:
        return res_data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        logger.error(f"Malformed Gemini API Response structure: {res_data}")
        raise ValueError("Invalid response format from Gemini API") from e

def call_openai(system_prompt: str, user_prompt: str, history: List[Dict[str, str]], api_key: str) -> str:
    """
    Invokes the OpenAI API via its Chat Completions endpoint (fallback).
    """
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
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }
    
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload, timeout=15.0)
    latency = time.time() - start_time
    logger.info(f"OpenAI API Latency: {latency:.3f} seconds")
    
    response.raise_for_status()
    res_data = response.json()
    
    try:
        return res_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        logger.error(f"Malformed OpenAI API Response structure: {res_data}")
        raise ValueError("Invalid response format from OpenAI API") from e

def query_llm(system_prompt: str, user_prompt: str, history: List[Dict[str, str]]) -> str:
    """
    Tries calling Gemini, falling back to OpenAI if configured, with exponential backoff retry logic.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    api_to_call = None
    key_to_use = None
    
    if gemini_key:
        api_to_call = "gemini"
        key_to_use = gemini_key
    elif openai_key:
        api_to_call = "openai"
        key_to_use = openai_key
        
    if not api_to_call:
        raise ValueError("No active GEMINI_API_KEY or OPENAI_API_KEY set in backend environment.")
        
    delays = [1.0, 2.0, 4.0]
    for attempt in range(4):
        try:
            if api_to_call == "gemini":
                return call_gemini(system_prompt, user_prompt, history, key_to_use)
            else:
                return call_openai(system_prompt, user_prompt, history, key_to_use)
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else 500
            
            # Retry only on transient errors (500, 502, 503, 504)
            if status_code in [500, 502, 503, 504]:
                if attempt < 3:
                    logger.warning(f"Transient HTTP error {status_code}. Retrying in {delays[attempt]}s...")
                    time.sleep(delays[attempt])
                    continue
                else:
                    logger.error(f"Transient HTTP errors persisted after {attempt + 1} attempts.")
                    raise e
            else:
                # Immediate fail on non-transient errors (e.g. 401, 403, 400)
                logger.error(f"Non-transient HTTP error {status_code} occurred: {e}")
                raise e
        except (requests.exceptions.Timeout,
                requests.exceptions.ConnectionError) as e:
            if attempt < 3:
                logger.warning(f"Network error/timeout. Retrying in {delays[attempt]}s...")
                time.sleep(delays[attempt])
                continue
            else:
                logger.error("Network errors persisted after all retries.")
                raise e
        except Exception as e:
            logger.error(f"Unexpected exception during LLM query execution: {e}")
            raise e
            
    raise RuntimeError("Failed to obtain response from LLM after retries.")
