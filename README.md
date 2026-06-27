# JanSahay — AI-Powered Government Scheme Discovery Platform

JanSahay is a modern, citizen-centric government scheme discovery platform. It enables citizens to quickly search, filter, and verify eligibility for central and state government schemes. 

By integrating **React**, **FastAPI**, **Supabase (PostgreSQL)**, and **n8n AI matchmaker workflows**, JanSahay automates eligibility evaluations based on user demographics and income constraints.

---

## 🚀 Key Features

* 🔍 **Smart Search Directory**: Search government schemes by keyword, state, category sector, or ministry.
* 📋 **AI Matchmaker Questionnaire**: Run diagnostic verification checks to identify matched and partially-matched schemes.
* 🤖 **Saathi AI Chat Assistant**: Dedicated context-aware chatbot helper on scheme detailed specification pages.
* 📰 **Policy Announcements & Updates**: Feeds detailing government updates and deadline notifications.
* 👤 **Demographics Syncing**: Secure, direct profiles saving to Supabase PostgreSQL database schemas.

---

## 📁 Repository Structure

```tree
├── frontend/                 # React SPA frontend application
├── jansahay-backend/         # FastAPI backend application
├── README.md                 # Project launch instructions
└── requirements.txt          # Python dependencies requirements file
```

---

## 🛠️ Tech Stack

* **Frontend**: React (v18), React Router (v7), TanStack React Query, Tailwind CSS, Lucide icons.
* **Backend**: FastAPI (Python 3.10+), Pydantic v2 validation models.
* **Database**: Supabase PostgreSQL.
* **AI Matchmaker**: n8n Webhook workflow matcher & LLM integrations.

---

## ⚡ Setup & Installation

### Prerequisite Configuration
Ensure you have the following installed:
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **n8n** (running locally or in cloud)

---

### Step 1: Configure Backend Environment Variables
Create a file named `.env` in the `jansahay-backend` directory:
```env
SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
SUPABASE_KEY="YOUR_SUPABASE_ANON_OR_SERVICE_KEY"
```

### Step 2: Install Backend Dependencies & Start Server
Navigate to the `jansahay-backend` directory, activate your virtual environment, and start the ASGI web server:

**On Windows:**
```bash
cd jansahay-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**On macOS/Linux:**
```bash
cd jansahay-backend
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
uvicorn main:app --reload
```
The server will boot and listen at `http://localhost:8000`.

---

### Step 3: Configure Frontend Environment Variables
Create a file named `.env` in the `frontend` directory:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Step 4: Install Frontend Packages & Start React App
Navigate to the `frontend` directory, install packages, and boot the Webpack development server:
```bash
cd frontend
npm install
npm start
```
The application will launch in your browser at `http://localhost:3000`.

---

## 📊 API Mappings

| HTTP Method | Backend URL Route | Input Schema | Response Model | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | `{"message": "JanSahay Backend is live!"}` | Health verification |
| `GET` | `/api/schemes` | None | `{"data": [...]}` | Selects all database schemes |
| `POST` | `/api/users` | `UserProfile` | `{"success": true, "user_id": str}` | Inserts demographic profiles |
| `GET` | `/api/dashboard/{user_id}`| Path parameters | `{"user": User, "recommended_schemes": [...]}` | Matches user details via n8n |

---

## 🤝 Contributing
1. Fork the Repository.
2. Create your Feature Branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add NewFeature'`).
4. Push to the Branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.
