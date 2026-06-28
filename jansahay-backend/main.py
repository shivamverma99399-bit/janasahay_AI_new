import requests
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from services.eligibility_engine import match_user_with_schemes

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


class GeneralChatRequest(BaseModel):
    userId: str
    sessionId: str
    message: str
    language: str = "en"

class MatchSchemesRequest(BaseModel):
    user_id: str

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


@app.post("/api/ai/chat")
def general_chat(chat: GeneralChatRequest):
    """
    Workflow 1: General AI Chat
    Sends user messages to the JanSahay General AI Chat workflow in n8n.
    """

    n8n_chat_webhook = "https://yuvraj99399.app.n8n.cloud/webhook/jansahay-general-ai-chat"

    payload = {
        "userId": chat.userId,
        "sessionId": chat.sessionId,
        "message": chat.message,
        "language": chat.language
    }

    try:
        response = requests.post(
            n8n_chat_webhook,
            json=payload,
            timeout=60
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.HTTPError:
        raise HTTPException(
            status_code=response.status_code,
            detail="The AI workflow returned an error."
        )

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="The AI workflow timed out."
        )

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to the AI workflow."
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@app.post("/api/match-schemes")
def match_schemes(request: MatchSchemesRequest):
    """
    Deterministic matching endpoint. Fetches the user and schemes from Supabase,
    calls the eligibility engine, and returns match metrics sorted by score.
    """
    try:
        # 1. Fetch user by ID from Supabase
        user_response = supabase.table('users').select('*').eq('id', request.user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_data = user_response.data[0]

        # 2. Fetch all schemes from Supabase
        schemes_response = supabase.table('schemes').select('*').execute()
        all_schemes = schemes_response.data

        # 3. Match user with schemes using local python logic
        recommended_schemes = match_user_with_schemes(user_data, all_schemes)

        return {
            "user": user_data,
            "recommended_schemes": recommended_schemes
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))