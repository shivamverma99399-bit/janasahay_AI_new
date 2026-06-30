import requests
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from services.eligibility_engine import match_user_with_schemes
from chat.router import router as chat_router

load_dotenv(override=True)

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


class MatchSchemesRequest(BaseModel):
    user_id: str
    extra_demographics: Optional[Dict[str, Any]] = None

@app.get("/")
def read_root():
    return {"message": "JanSahay Backend is live!"}

@app.get("/schemes")
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

app.include_router(chat_router, prefix="/api/ai")

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


@app.get("/health")
@app.get("/api/health")
def health_check():
    try:
        # Check supabase connection
        response = supabase.table('schemes').select('id').limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


@app.get("/schemes/search")
@app.get("/api/schemes/search")
def search_schemes(q: Optional[str] = None):
    try:
        response = supabase.table('schemes').select('*').execute()
        all_schemes = response.data or []
        if not q:
            return {"data": all_schemes}
        
        query = q.lower()
        matched = []
        for s in all_schemes:
            title = s.get("title") or s.get("scheme_name") or ""
            summary = s.get("summary") or s.get("description") or ""
            category = s.get("category") or ""
            criteria = s.get("eligibility_criteria") or ""
            dept = s.get("department") or "Government of India"
            search_target = f"{title} {summary} {category} {criteria} {dept}".lower()
            if query in search_target:
                matched.append(s)
        return {"data": matched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schemes/categories")
@app.get("/api/schemes/categories")
def get_categories():
    try:
        response = supabase.table('schemes').select('category').execute()
        categories = list(set([item['category'] for item in response.data if item.get('category')]))
        return {"data": [{"id": c.lower(), "label": c} for c in categories]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))