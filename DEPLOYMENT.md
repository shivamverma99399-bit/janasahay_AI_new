# JanSahay Deployment Guide

This guide details how to deploy the **JanSahay Backend to Render** and the **Frontend to Vercel**.

---

## 1. Deploying the Backend on Render

### Method A: Connect via Web Dashboard (Recommended)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `janasahay_AI_new`.
4. Configure the service settings:
   - **Name**: `jansahay-backend` (or your preferred name)
   - **Region**: Closest to your users (e.g. *Singapore* or *Frankfurt*)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `jansahay-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

5. Add **Environment Variables** under the **Environment** tab:
   | Key | Example / Description |
   | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.9` |
   | `MISTRAL_API_KEY` | `your_mistral_api_key` |
   | `SUPABASE_URL` | `https://your-project.supabase.co` |
   | `SUPABASE_KEY` | `your_supabase_service_role_key` |
   | `ALLOWED_ORIGINS` | `http://localhost:3000,https://*.vercel.app` |

6. Click **Create Web Service**.
7. Once deployment finishes, copy your Render URL:
   `https://<your-service-name>.onrender.com`

---

## 2. Deploying the Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `janasahay_AI_new`.
4. In the Project Configuration:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `build`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `REACT_APP_BACKEND_URL` | `https://<your-service-name>.onrender.com` |
   | `WDS_SOCKET_PORT` | `443` |
   | `ENABLE_HEALTH_CHECK` | `false` |

   > **Note**: Do not add a trailing slash `/` or `/api` to `REACT_APP_BACKEND_URL`. Simply use `https://your-service-name.onrender.com`.

6. Click **Deploy**.
7. Once deployed, test opening pages like `/search`, `/ai`, `/scheme/guide/...`, and `/profile`. The `vercel.json` rewrite file handles SPA routing automatically without 404 errors.

---

## 3. Connecting Frontend & Backend

Once your Vercel URL is live (e.g. `https://janasahay.vercel.app`):
1. In your **Render Dashboard** → `jansahay-backend` → **Environment**:
   Set `ALLOWED_ORIGINS`:
   ```
   http://localhost:3000,https://*.vercel.app,https://janasahay.vercel.app
   ```
2. Render will automatically re-deploy or reload the environment changes.
