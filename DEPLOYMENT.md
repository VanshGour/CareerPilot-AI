# CareerPilot AI — Live Cloud Deployment Guide 🚀

This guide explains how to deploy **CareerPilot AI** (FastAPI backend + React frontend + SQLite/Postgres DB) to production so it is accessible online.

---

## 🏗️ Architecture Overview

- **Backend**: Python 3.11 + FastAPI + Groq LLM API + SQLAlchemy (`/backend`)
- **Frontend**: React + Vite SPA (`/frontend`)
- **Recommended Free Hosting**:
  - **Backend**: [Render.com](https://render.com) or [Railway.app](https://railway.app)
  - **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

---

## Step 1: Deploy Backend (FastAPI on Render)

1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Complete CareerPilot AI 8 milestones"
   git push origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
3. Connect your GitHub repository: `AI-Job-Copilot`.
4. Configure the Web Service:
   - **Name**: `careerpilot-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add **Environment Variables** in Render:
   - `GROQ_API_KEY`: *(Your Groq API key)*
   - `GROQ_MODEL`: `openai/gpt-oss-20b`
   - `JWT_SECRET_KEY`: *(A random 32+ character string for token encryption)*
   - `DATABASE_URL`: `sqlite:///./careerpilot.db` *(or connect a Render PostgreSQL instance)*
   - `ALLOWED_ORIGINS`: `*` *(or your Vercel URL once deployed)*

6. Click **Create Web Service**.
   - Render will build and deploy your API.
   - Note your public backend URL (e.g. `https://careerpilot-backend.onrender.com`).
   - Test it by visiting `https://careerpilot-backend.onrender.com/health`.

---

## Step 2: Deploy Frontend (React + Vite on Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** ➔ **Project**.
2. Select your repository: `AI-Job-Copilot`.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add **Environment Variables** in Vercel:
   - `VITE_API_URL`: `https://careerpilot-backend.onrender.com` *(The Render backend URL from Step 1)*

5. Click **Deploy**.
   - Vercel will bundle the React application and provide a live URL (e.g., `https://careerpilot-ai.vercel.app`).

---

## Step 3: Link CORS Security (Optional Best Practice)

Once your Vercel URL is live:
1. Return to **Render** ➔ `careerpilot-backend` ➔ **Environment**.
2. Set `ALLOWED_ORIGINS`: `https://careerpilot-ai.vercel.app,http://localhost:5173`.
3. Save changes — Render will automatically re-deploy.

---

## 🐳 Alternative: Run Anywhere with Docker

You can also run the backend in a container anywhere:

```bash
cd backend
docker build -t careerpilot-backend .
docker run -p 8000:8000 \
  -e GROQ_API_KEY="your_groq_key" \
  -e JWT_SECRET_KEY="your_secret" \
  careerpilot-backend
```

---

## ✅ Post-Deployment Verification Checklist

1. [ ] Visit your Vercel URL in your browser.
2. [ ] Check Topbar status indicator displays **Connected**.
3. [ ] Test **User Authentication**: Sign up for an account.
4. [ ] Test **AI Resume Coach**: Paste a bullet point and click "Optimize Description".
5. [ ] Test **ATS Compatibility Checker**: Upload a PDF and run a scan.
6. [ ] Test **Skill Gap Analyzer**: View the generated 4-week learning roadmap.
7. [ ] Test **Job Application Tracker**: Add an application and update its pipeline stage.
8. [ ] Test **AI Mock Interview**: Answer a question and verify AI score and feedback.
9. [ ] Test **Resume Builder**: Fill details, click "Save to Cloud", and download the PDF.

