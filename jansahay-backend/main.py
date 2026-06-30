import requests
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from services.eligibility_engine import match_user_with_schemes
from services.ai_service import execute_ai_chat

load_dotenv()

app = FastAPI(title="JanSahay AI Backend")

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

env_origins = os.getenv("ALLOWED_ORIGINS")

if env_origins:
    for origin in env_origins.split(","):
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

print("Allowed origins:", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

from typing import Optional, Dict, Any, List

class UserProfile(BaseModel):
    id: Optional[str] = None
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
    extra_demographics: Optional[Dict[str, Any]] = None
    user_documents: Optional[List[str]] = None

class MatchSchemesRequest(BaseModel):
    user_id: str
    extra_demographics: Optional[Dict[str, Any]] = None

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




@app.post("/api/users")
def create_user(user: UserProfile):
    try:
        user_dict = user.model_dump()
        user_id = user_dict.get('id')
        if user_id:
            # Update existing user profile
            clean_dict = {k: v for k, v in user_dict.items() if k != 'id'}
            response = supabase.table('users').update(clean_dict).eq('id', user_id).execute()
            return {"success": True, "user_id": user_id}
        else:
            # Create new user profile
            clean_dict = {k: v for k, v in user_dict.items() if k != 'id'}
            response = supabase.table('users').insert(clean_dict).execute()
            return {"success": True, "user_id": response.data[0]['id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/chat")
def general_chat(chat: GeneralChatRequest):
    """
    Direct LLM chat integration endpoint.
    """
    try:
        # If the frontend passes "user_001", treat it as anonymous guest
        user_id = chat.userId if chat.userId != "user_001" and chat.userId else None
        
        result = execute_ai_chat(
            user_id=user_id,
            message=chat.message,
            session_id=chat.sessionId,
            language=chat.language,
            extra_demographics=chat.extra_demographics,
            user_documents=chat.user_documents
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Saathi AI service error: {str(e)}"
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

        # Inject extra demographics if sent from frontend
        if request.extra_demographics:
            user_data["extra_demographics"] = request.extra_demographics

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


@app.get("/api/v1/government-updates")
def get_v1_government_updates():
    """
    Returns government scheme updates and announcements.
    """
    return [
        {
            "id": 1,
            "title": "PM Kisan 20th Installment Released",
            "description": "Eligible farmers will receive financial assistance of ₹2,000 directly in their bank accounts as part of the 20th installment of the PM Kisan Samman Nidhi scheme.",
            "category": "Agriculture",
            "priority": "High",
            "date": "2026-06-28",
            "url": "https://pmkisan.gov.in"
        },
        {
            "id": 2,
            "title": "National Scholarship Portal Open for 2026-27",
            "description": "The Ministry of Education has opened registrations for Pre-Matric, Post-Matric, and Merit-cum-Means scholarships on the National Scholarship Portal.",
            "category": "Education",
            "priority": "Medium",
            "date": "2026-06-25",
            "url": "https://scholarships.gov.in"
        },
        {
            "id": 3,
            "title": "Ayushman Bharat PM-JAY Expansion Announced",
            "description": "The central government has expanded the Ayushman Bharat PM-JAY health insurance benefit cap from ₹5 Lakh to ₹10 Lakh per family per year for senior citizens above 70.",
            "category": "Health",
            "priority": "High",
            "date": "2026-06-22",
            "url": "https://pmjay.gov.in"
        },
        {
            "id": 4,
            "title": "Pradhan Mantri Awas Yojana Urban 2.0 Interest Subsidy",
            "description": "PMAY Urban 2.0 interest subsidy registrations are now open for Economically Weaker Sections (EWS) and Low Income Groups (LIG) for regional city housing projects.",
            "category": "Housing",
            "priority": "Medium",
            "date": "2026-06-20",
            "url": "https://pmay-urban.gov.in"
        },
        {
            "id": 5,
            "title": "LPG Cylinder Ujjwala Subsidy Revision",
            "description": "Under the PM Ujjwala Yojana, active beneficiary connections will receive an increased direct benefit transfer (DBT) subsidy of ₹300 per cylinder refill for regional districts.",
            "category": "Women",
            "priority": "Medium",
            "date": "2026-06-18",
            "url": "https://pmuy.gov.in"
        },
        {
            "id": 6,
            "title": "Pradhan Mantri Kaushal Vikas Yojana (PMKVY) 4.0 Registration",
            "description": "PMKVY 4.0 registrations have commenced, offering free industry-relevant skill training and placement support in emerging technology sectors (AI, IoT, Robotics) to unemployed youth.",
            "category": "Employment",
            "priority": "High",
            "date": "2026-06-15",
            "url": "https://pmkvyofficial.org"
        },
        {
            "id": 7,
            "title": "PM Mudra Yojana Loan Limits Increased",
            "description": "Under the Shishu, Kishor, and Tarun loan categories of the PM Mudra Yojana, maximum lending limit has been increased to ₹20 Lakh for women-owned microenterprises and small startups.",
            "category": "Finance",
            "priority": "High",
            "date": "2026-06-12",
            "url": "https://mudra.org.in"
        }
    ]


# In-memory notifications database to support live UI actions (Read / Delete / Clear)
MOCK_NOTIFICATIONS = [
    {
        "id": 1,
        "title": "New Scheme Added",
        "description": "PM Internship Scheme registrations are now open. Apply for matching corporate sectors today.",
        "type": "New Scheme",
        "is_read": False,
        "priority": "High",
        "created_at": "2026-06-29"
    },
    {
        "id": 2,
        "title": "Deadline Approaching",
        "description": "National Scholarship Portal applications close in 2 days. Verify profile details and submit documents.",
        "type": "Application Deadline",
        "is_read": False,
        "priority": "High",
        "created_at": "2026-06-28"
    },
    {
        "id": 3,
        "title": "PM Kisan Installment Released",
        "description": "The central government has released direct benefits transfer (DBT) payments. Eligible farmers can check payment status.",
        "type": "Government Update",
        "is_read": True,
        "priority": "Medium",
        "created_at": "2026-06-27"
    },
    {
        "id": 4,
        "title": "AI Recommendation",
        "description": "Based on your household income preferences, you may be eligible for PMAY housing interest subsidies.",
        "type": "AI Recommendation",
        "is_read": False,
        "priority": "High",
        "created_at": "2026-06-26"
    },
    {
        "id": 5,
        "title": "System Announcement",
        "description": "FastAPI backend services and Saathi AI chatbot modules are operating at 100% efficiency.",
        "type": "System Announcement",
        "is_read": True,
        "priority": "Low",
        "created_at": "2026-06-25"
    }
]


@app.get("/api/v1/notifications")
def get_v1_notifications():
    """
    Returns list of active notifications.
    """
    return MOCK_NOTIFICATIONS


@app.post("/api/v1/notifications/{notification_id}/read")
def read_v1_notification(notification_id: str):
    """
    Marks a single notification as read.
    """
    try:
        notif_id = int(notification_id)
    except ValueError:
        notif_id = notification_id

    for n in MOCK_NOTIFICATIONS:
        if str(n["id"]) == str(notif_id):
            n["is_read"] = True
            return {"success": True}
    raise HTTPException(status_code=404, detail="Notification not found")


@app.post("/api/v1/notifications/read-all")
def read_all_v1_notifications():
    """
    Marks all notifications as read.
    """
    for n in MOCK_NOTIFICATIONS:
        n["is_read"] = True
    return {"success": True}


@app.delete("/api/v1/notifications/{notification_id}")
def delete_v1_notification(notification_id: str):
    """
    Deletes a single notification.
    """
    try:
        notif_id = int(notification_id)
    except ValueError:
        notif_id = notification_id

    global MOCK_NOTIFICATIONS
    for i, n in enumerate(MOCK_NOTIFICATIONS):
        if str(n["id"]) == str(notif_id):
            MOCK_NOTIFICATIONS.pop(i)
            return {"success": True}
    raise HTTPException(status_code=404, detail="Notification not found")


@app.delete("/api/v1/notifications")
def clear_all_v1_notifications():
    """
    Clears all active notifications from drawer.
    """
    global MOCK_NOTIFICATIONS
    MOCK_NOTIFICATIONS.clear()
    return {"success": True}