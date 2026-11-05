# CareerPilot AI 🚀

**An AI-powered Job Application Copilot that helps job seekers prepare for their career journey.**

CareerPilot AI is a web application designed to help users analyze their resumes, match their skills with job opportunities, and prepare for interviews using AI.

## ✨ Features

- **Resume Analyzer:** Upload a PDF resume and receive AI-powered feedback.
- **Job Matcher:** Analyze how well your resume matches a job description.
- **Interview Preparation:** Generate interview questions based on your preparation needs.
- **Resume Builder:** Create a resume using a form with a live preview.
- **PDF Export:** Download your generated resume as a PDF.
- **Modern Dashboard:** Navigate between CareerPilot AI tools through a clean interface.

## 🛠️ Tech Stack

**Frontend**
- React.js
- JavaScript
- HTML
- CSS
- Axios

**Backend**
- Python
- FastAPI
- Groq API
- PyMuPDF

**Tools**
- Git
- GitHub
- VS Code

## 📁 Project Structure

```text
AI-Job-Copilot/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/VanshGour/CareerPilot-AI.git
cd CareerPilot-AI
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend folder and add your own Groq API key:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

Start the backend:

```bash
python -m uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 🔐 Environment Variables

Keep your API keys private.

Never upload your `.env` file, API keys, or virtual environment to GitHub.

## 🎯 Project Goal

The goal of CareerPilot AI is to simplify job application preparation by bringing resume analysis, job matching, interview preparation, and resume creation into one platform.

## 👨‍💻 Author

**Vansh Gour**

GitHub: [VanshGour](https://github.com/VanshGour)