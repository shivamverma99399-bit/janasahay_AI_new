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