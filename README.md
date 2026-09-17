# JanSahay (जनसहाय) — National Citizen Scheme Discovery & Intelligence Portal

<div align="center">

![National Portal of India](https://img.shields.io/badge/भारत_सरकार-Government_of_India-0b3b60?style=for-the-badge)
![GIGW 3.0 Certified](https://img.shields.io/badge/GIGW_3.0-Compliant-138808?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Mistral AI](https://img.shields.io/badge/Mistral_AI-FF7000?style=for-the-badge&logo=ai)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**An intelligent, accessible, and citizen-first welfare scheme delivery portal designed to Government of India (GIGW 3.0) standards.**

[🌐 Live Portal](https://janasahay-ai-new.vercel.app) • [📖 Deployment Guide](DEPLOYMENT.md) • [📡 Backend API Docs](https://janasahay-backend.onrender.com/docs)

</div>

---

## 🇮🇳 Overview

**JanSahay (जनसहाय)** is a state-of-the-art public service portal that empowers Indian citizens to discover, evaluate, and apply for central and state government welfare schemes with ease.

By fusing **official GIGW 3.0 design standards**, an **AI scheme eligibility diagnostic engine**, and **Mistral AI conversational intelligence (साथी / Saathi Assistant)**, JanSahay removes administrative complexity and bridges the gap between citizens and government benefits.

---

## 🌟 Key Features

### 🤖 Saathi AI Assistant (साथी)
* **Mistral AI Powered**: Integrates with `mistral-small-latest` to provide contextual, verified scheme explanations.
* **Structured Visual Attribute Breakdown**: Every scheme recommendation is displayed with dedicated visual badges:
  * 🏛️ **Department**: Nodal ministry attribution
  * 💰 **Benefit**: Direct financial or social assistance breakdown
  * ✅ **Eligibility**: Exact qualification criteria matched to citizen demographics
  * 📄 **Documents**: Required certificates and verification documents
  * 👉 **Next Steps**: Application routes and direct links
* **Consultation History**: Persistent multi-session conversation tracking stored locally and per-user.
* **One-Click Share & Copy**: Cleanly sanitized clipboard copying for seamless sharing via WhatsApp or SMS.
* **22 Official Languages Ready**: Multi-lingual prompt architecture supporting English, Hindi (हिन्दी), and regional scripts.

### 🎯 National Eligibility Diagnostic Engine (`/eligibility`)
* **Citizen Profiling**: Multi-step demographic intake covering age, gender, occupation, caste category, disability status, annual household income, and state/UT.
* **Instant Eligibility Reports (`/eligibility/results`)**:
  * ✅ **Eligible Schemes**: Matched schemes with positive qualifying factors highlighted.
  * ⚠️ **Needs Review**: Conditionally eligible schemes with specific criteria checks.
  * ❌ **Disqualifying Factors**: Transparent explanation of why a citizen does not meet specific thresholds.

### 🏛️ Central Scheme Directory (`/search`)
* Search through **1,400+ Central and State welfare schemes** spanning 48+ ministries.
* Multi-dimensional filtering by **State/UT**, **Category/Sector** (Agriculture, Education, Healthcare, Business, Women & Child), and **Beneficiary Group**.
* Official Scheme Dossiers with deep link routing (`/scheme/:id` and `/scheme/guide/:id` for step-by-step application walkthroughs).

### 📜 Official Gazette & PIB Circulars (`/government-updates`)
* Real-time notifications and policy circulars synchronized with Press Information Bureau (PIB) and official gazette releases.
* Complete circular dossiers (`/government-updates/:id`) with reference numbers, release dates, and nodal ministry sign-offs.

### 🆔 MeriPehchaan & Citizen Digital Identity (`/profile`)
* **National Citizen Profile**: Secure digital identity pass styled with official watermarks and QR identity badge.
* **DigiLocker Integration Status**: Verification checkmarks for Aadhaar, Income Certificates, and Ration Cards.
* **MeriPehchaan SSO Gateway (`/signin`)**: Secure Single Sign-On simulation adhering to national 256-bit SSL encryption standards.

### 🎨 Authentic Government Design System (GIGW 3.0)
* **National Tricolor Ribbon**: Fixed Saffron (`#FF9933`), White, and Green (`#138808`) header ribbon on every screen.
* **Ashoka Lion Capital Insignia**: High-resolution national emblems and *"भारत सरकार | Government of India"* typography.
* **Accessible Typography & Contrast**: High-contrast slate backgrounds (`#f8fafc`), deep Indian Navy (`#0b3b60`), and WCAG 2.1 AA compliance.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** | High-performance Single Page Application |
| **Routing** | **React Router v7** | Client-side routing with clean URL architecture |
| **Styling** | **Tailwind CSS + Vanilla CSS** | Custom GIGW 3.0 government portal design system |
| **Icons & UI** | **Lucide React & Sonner** | Crisp accessibility icons and toast notifications |
| **Backend Framework** | **FastAPI (Python 3.11)** | High-speed ASGI REST API |
| **AI Intelligence** | **Mistral AI SDK** | Structured JSON schema completion & chat assistant |
| **Database** | **Supabase PostgreSQL** | Cloud PostgreSQL with REST & vector capabilities |
| **Deployment** | **Vercel + Render** | Frontend hosted on Vercel; Backend hosted on Render |

---

## 📁 Repository Structure

```tree
janasahay_AI_new/
├── frontend/                     # React Single Page Application
│   ├── public/                   # Static assets, favicon, manifest
│   │   ├── _redirects            # SPA redirect rule for Render/Netlify
│   │   └── vercel.json           # Vercel SPA routing rewrites
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, Footer, Modals)
│   │   ├── context/              # AppContext & State Management
│   │   ├── pages/                # Route pages (Home, Search, SchemeDetail, AIAssistant, etc.)
│   │   │   ├── AIAssistant.jsx   # Saathi AI Chat interface with Markdown badge renderer
│   │   │   ├── EligibilityChecker.jsx # Demographic intake wizard
│   │   │   ├── EligibilityResults.jsx # Verification report breakdown
│   │   │   ├── GovernmentUpdates.jsx  # Gazette and PIB announcements
│   │   │   ├── SchemeDetail.jsx       # Official scheme dossier & application guide
│   │   │   └── Profile.jsx            # Digital ID pass and DigiLocker status
│   │   └── services/             # API services (aiService, schemeService, api client)
│   ├── craco.config.js           # Craco build configuration
│   └── package.json
│
├── jansahay-backend/             # FastAPI ASGI Backend Application
│   ├── chat/                     # AI Orchestration Module
│   │   ├── client.py             # Mistral AI API client & model caller
│   │   ├── formatter.py          # Structured JSON extraction & newline sanitization
│   │   └── prompt_builder.py     # System instructions, guidelines & schema prompts
│   ├── database/                 # Database connectors & repository helpers
│   ├── main.py                   # FastAPI server entry point & route definitions
│   ├── requirements.txt          # Python runtime dependencies
│   └── .env.example              # Environment variables template
│
├── DEPLOYMENT.md                 # Complete Vercel & Render step-by-step deployment guide
├── render.yaml                   # Infrastructure-as-code Blueprint for Render
└── README.md                     # Project documentation
```

---

## ⚡ Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: v3.10 or higher
* **Git**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/shivamverma99399-bit/janasahay_AI_new.git
cd janasahay_AI_new
```

---

### Step 2: Configure & Launch Backend

1. Navigate to `jansahay-backend`:
   ```bash
   cd jansahay-backend
   ```

2. Create a virtual environment:
   * **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` inside `jansahay-backend/`:
   ```env
   MISTRAL_API_KEY="your_mistral_api_key_here"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_KEY="your_supabase_anon_or_service_key"
   ALLOWED_ORIGINS="http://localhost:3000,https://janasahay-ai-new.vercel.app"
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   * The backend will run at: `http://localhost:8000`
   * Interactive Swagger docs: `http://localhost:8000/docs`

---

### Step 3: Configure & Launch Frontend

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Create `.env` inside `frontend/`:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm start
   ```
   * The web application will launch at: `http://localhost:3000`

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check and API status verification |
| `GET` | `/api/schemes` | Fetch list of schemes with optional search, state, and category filtering |
| `GET` | `/api/schemes/{id}` | Retrieve comprehensive dossier and application guidelines for a scheme |
| `POST` | `/api/eligibility/check` | Evaluates citizen demographics against database rules and returns scored results |
| `POST` | `/ai/chat` | Main conversational endpoint powering Saathi AI Assistant (Mistral AI) |
| `POST` | `/ai/clear` | Clears in-memory session context for a specific conversation session |
| `GET` | `/api/government-updates` | Returns official PIB circulars and gazette notifications |
| `GET` | `/api/government-updates/{id}` | Returns detailed circular dossier with ministry attribution |
| `POST` | `/api/users` | Saves or updates citizen demographic profile in Supabase |
| `GET` | `/api/dashboard/{user_id}` | Retrieves personalized citizen recommendations based on stored profile |

---

## ☁️ Deployment Instructions

* **Frontend (Vercel)**:
  * Framework: `Create React App`
  * Root Directory: `frontend`
  * Environment Variable: `REACT_APP_BACKEND_URL=https://your-render-backend.onrender.com`
* **Backend (Render)**:
  * Runtime: `Python 3`
  * Root Directory: `jansahay-backend`
  * Build Command: `pip install -r requirements.txt`
  * Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  * Environment Variables: `MISTRAL_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `ALLOWED_ORIGINS`

👉 For detailed, step-by-step instructions with troubleshooting tips, see the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

---

## 🤝 Contributing

Contributions to JanSahay are welcome!
1. Fork the Project repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License & Disclaimers

* **License**: Released under the MIT License.
* **Official Disclaimer**: *JanSahay is an open-source civic technology platform designed to facilitate public welfare discovery. Scheme guidelines, benefits, and circulars are synchronized with public domain government portals. Citizens are encouraged to verify final application criteria on respective nodal ministry websites.*
