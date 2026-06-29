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

# Allowed CORS origins (Vercel production and local environments)
allowed_origins = [
    "https://janasahay-ai-new.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

# Read optional origins from environment variables to allow flexible configuration
for env_var in ["ALLOWED_ORIGINS", "FRONTEND_URL", "CORS_ALLOWED_ORIGINS", "CLIENT_URL"]:
    env_val = os.environ.get(env_var)
    if env_val:
        for part in env_val.split(","):
            part = part.strip()
            if part and part not in allowed_origins:
                allowed_origins.append(part)

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
    Direct LLM chat integration endpoint.
    """
    try:
        # If the frontend passes "user_001", treat it as anonymous guest
        user_id = chat.userId if chat.userId != "user_001" and chat.userId else None
        
        result = execute_ai_chat(
            user_id=user_id,
            message=chat.message,
            session_id=chat.sessionId
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
def read_v1_notification(notification_id: int):
    """
    Marks a single notification as read.
    """
    for n in MOCK_NOTIFICATIONS:
        if n["id"] == notification_id:
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
def delete_v1_notification(notification_id: int):
    """
    Deletes a single notification.
    """
    global MOCK_NOTIFICATIONS
    for i, n in enumerate(MOCK_NOTIFICATIONS):
        if n["id"] == notification_id:
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