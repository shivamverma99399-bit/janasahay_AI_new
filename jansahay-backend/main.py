import requests
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="JanSahay AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class UserProfile(BaseModel):
    name: str
    age: int
    gender: str
    state: str
    income: float
    occupation: str
    education: str

class ChatMessage(BaseModel):
    user_id: str
    message: str

@app.get("/")
def read_root():
    return {"message": "JanSahay Backend is live!"}

@app.get("/api/schemes")
def get_schemes():
    try:
        response = supabase.table('schemes').select('*').execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/updates")
def get_updates():
    try:
        response = supabase.table('updates').select('*').execute()
        return {"data": response.data}
    except Exception:
        # Fallback to mock updates
        return {
            "data": [
                {
                    "id": "news-1",
                    "title": "PM Kisan Samman Nidhi Installment Disbursed",
                    "summary": "The central government has released the 16th installment of PM-Kisan support, directly transferring funds to over 11 crore farmer bank accounts.",
                    "date": "27 June 2026",
                    "source": "Ministry of Agriculture",
                    "image": "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBhZ3JpY3VsdHVyZXxlbnwwfHx8fDE3ODI1MjgxMjh8MA&ixlib=rb-4.1.0&q=85",
                    "link": "https://pmkisan.gov.in"
                },
                {
                    "id": "news-2",
                    "title": "Ayushman Bharat Card Registration Drive Launched",
                    "summary": "Special camps are being set up across multiple states to facilitate cashless healthcare e-cards registration under Pradhan Mantri Jan Arogya Yojana.",
                    "date": "24 June 2026",
                    "source": "National Health Authority",
                    "image": "https://images.unsplash.com/photo-1639416070357-6dc10225abec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w7NTY2Nzh8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW5kaWF8ZW58MHx8fHwxNzgyNTI4MTI4fDA&ixlib=rb-4.1.0&q=85",
                    "link": "https://dashboard.pmjay.gov.in"
                }
            ]
        }

@app.get("/api/notifications")
def get_notifications():
    try:
        response = supabase.table('notifications').select('*').execute()
        return {"data": response.data}
    except Exception:
        # Fallback to mock notifications
        return {
            "data": [
                {
                    "id": "notif-1",
                    "category": "status",
                    "title": "Profile Synced to Supabase",
                    "message": "Your demographic preferences are successfully saved. Dynamic scheme matching is now active.",
                    "timestamp": "Just now",
                    "read": False
                },
                {
                    "id": "notif-2",
                    "category": "deadlines",
                    "title": "PMAY Urban 2.0 Registration Closing",
                    "message": "Reminder: Credit-linked interest subsidy registrations for EWS households close by 31 December 2026.",
                    "timestamp": "2 hours ago",
                    "read": False
                },
                {
                    "id": "notif-3",
                    "category": "updates",
                    "title": "LPG Connection Subsidy Revised",
                    "message": "Pradhan Mantri Ujjwala Connection has revised the refill DBT parameters for regional districts.",
                    "timestamp": "1 day ago",
                    "read": True
                }
            ]
        }

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_as_read(notification_id: str):
    try:
        supabase.table('notifications').update({"read": True}).eq('id', notification_id).execute()
        return {"success": True}
    except Exception:
        return {"success": True}

@app.post("/api/users")
def create_user(user: UserProfile):
    try:
        response = supabase.table('users').insert(user.model_dump()).execute()
        return {"success": True, "user_id": response.data[0]['id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/{user_id}")
def get_user_dashboard(user_id: str):
    """Fetches user, asks AI to match schemes OR find new ones, returns results"""
    try:
        # 1. Fetch real user from Supabase
        user_response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not user_response.data:
            return {"error": "User not found"}
        user_data = user_response.data[0]

        # 2. Fetch existing database schemes
        schemes_response = supabase.table('schemes').select('*').execute()
        all_schemes = schemes_response.data

        # 3. Send to ACTIVE n8n Production Webhook
        n8n_webhook_url = "http://localhost:5678/webhook/match-schemes"
        
        payload = {
            "user_profile": user_data,
            "schemes": all_schemes
        }
        
        # Call the AI! (Timeout increased to 90s because web searching takes time)
        ai_response = requests.post(n8n_webhook_url, json=payload, timeout=90).json()

        # 4. Merge Logic: Handle both DB Schemes and BRAND NEW Web Schemes
        matched_schemes = []
        db_schemes_dict = {str(s['id']): s for s in all_schemes} # Quick lookup

        for ai_match in ai_response:
            scheme_id = str(ai_match.get('scheme_id', ''))
            
            if scheme_id in db_schemes_dict:
                # The AI matched a scheme we already have in our database
                scheme_copy = db_schemes_dict[scheme_id].copy()
                scheme_copy['match_score'] = ai_match.get('match_score', 0)
                scheme_copy['ai_reason'] = ai_match.get('reason', '')
                matched_schemes.append(scheme_copy)
            else:
                # The AI searched the web and found a BRAND NEW scheme!
                matched_schemes.append({
                    "id": scheme_id,
                    "scheme_name": ai_match.get('scheme_name', 'Newly Discovered Scheme'),
                    "description": "Discovered live by AI Web Search",
                    "eligibility_criteria": "Matched based on dynamic web search",
                    "match_score": ai_match.get('match_score', 0),
                    "ai_reason": ai_match.get('reason', 'The AI Agent found this scheme online for you.')
                })

        # 5. Sort highest match score first
        matched_schemes.sort(key=lambda x: x.get('match_score', 0), reverse=True)

        return {
            "user": user_data,
            "recommended_schemes": matched_schemes
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ai/scheme-info")
def get_scheme_info(chat_data: ChatMessage):
    """
    Workflow 2: Scheme Information Agent
    Fetches schemes and lets the AI answer questions about them.
    """
    try:
        # 1. Fetch all schemes from Supabase to provide context to the AI
        schemes_response = supabase.table('schemes').select('*').execute()
        all_schemes = schemes_response.data
        
        # 2. Forward query and context to n8n
        n8n_scheme_webhook = "http://localhost:5678/webhook-test/webhook/scheme-info"
        
        payload = {
            "user_id": chat_data.user_id,
            "query": chat_data.message,
            "context": all_schemes
        }
        
        response = requests.post(n8n_scheme_webhook, json=payload, timeout=30)
        return response.json()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))