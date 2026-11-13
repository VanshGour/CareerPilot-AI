import os
import json
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import fitz
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import auth

# Load environment variables from .env
load_dotenv()

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing from .env")

client = Groq(api_key=GROQ_API_KEY)

# Create FastAPI application
app = FastAPI(
    title="AI Job Application Copilot",
    description="AI-powered resume analysis and career preparation platform",
    version="2.0.0"
)

# Allow React frontend to communicate with backend
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vansh-pilot.vercel.app",
]

if allowed_origins_env:
    for orig in allowed_origins_env.split(","):
        if orig.strip() and orig.strip() not in allowed_origins:
            allowed_origins.append(orig.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to AI Job Application Copilot API!",
        "version": "2.0.0",
        "database": "connected"
    }


@app.get("/health")
def health():
    return {
        "status": "running",
        "project": "AI Job Application Copilot"
    }


# ==========================================================
# 03 USER AUTHENTICATION ENDPOINTS
# ==========================================================

@app.post("/auth/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserSignup, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Hash password & create user
    hashed = auth.hash_password(user_in.password)
    new_user = models.User(
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name.strip(),
        hashed_password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    token = auth.create_access_token(data={"user_id": new_user.id, "sub": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }


@app.post("/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email.lower().strip()).first()
    if not user or not auth.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = auth.create_access_token(data={"user_id": user.id, "sub": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/auth/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ==========================================================
# 04 DATABASE INTEGRATION (Resumes, History, Applications)
# ==========================================================

# Resumes
@app.get("/resumes", response_model=List[schemas.ResumeOut])
def get_user_resumes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).all()


@app.post("/resumes/save", response_model=schemas.ResumeOut)
def save_resume(
    resume_in: schemas.ResumeCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_resume = models.Resume(
        user_id=current_user.id,
        title=resume_in.title or "My Resume",
        file_name=resume_in.file_name,
        raw_text=resume_in.raw_text,
        builder_data=resume_in.builder_data
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume


@app.delete("/resumes/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    db.delete(resume)
    db.commit()
    return {"success": True, "message": "Resume deleted successfully."}


# Analysis History
@app.get("/analysis/history", response_model=List[schemas.AnalysisReportOut])
def get_analysis_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.AnalysisReport).filter(
        models.AnalysisReport.user_id == current_user.id
    ).order_by(models.AnalysisReport.created_at.desc()).all()


# ==========================================================
# 05 JOB APPLICATION TRACKER ENDPOINTS
# ==========================================================

@app.get("/applications", response_model=List[schemas.JobApplicationOut])
def get_applications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.JobApplication).filter(
        models.JobApplication.user_id == current_user.id
    ).order_by(models.JobApplication.created_at.desc()).all()


@app.post("/applications", response_model=schemas.JobApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: schemas.JobApplicationCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_app = models.JobApplication(
        user_id=current_user.id,
        company=app_in.company.strip(),
        role=app_in.role.strip(),
        status=app_in.status or "Applied",
        location=app_in.location,
        salary_range=app_in.salary_range,
        job_url=app_in.job_url,
        job_description=app_in.job_description,
        applied_date=app_in.applied_date,
        next_interview_date=app_in.next_interview_date,
        notes=app_in.notes
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@app.put("/applications/{app_id}", response_model=schemas.JobApplicationOut)
def update_application(
    app_id: int,
    app_update: schemas.JobApplicationUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    app_item = db.query(models.JobApplication).filter(
        models.JobApplication.id == app_id,
        models.JobApplication.user_id == current_user.id
    ).first()
    if not app_item:
        raise HTTPException(status_code=404, detail="Application not found.")

    update_data = app_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app_item, field, value)

    db.commit()
    db.refresh(app_item)
    return app_item


@app.delete("/applications/{app_id}")
def delete_application(
    app_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    app_item = db.query(models.JobApplication).filter(
        models.JobApplication.id == app_id,
        models.JobApplication.user_id == current_user.id
    ).first()
    if not app_item:
        raise HTTPException(status_code=404, detail="Application not found.")

    db.delete(app_item)
    db.commit()
    return {"success": True, "message": "Application deleted successfully."}


# ==========================================================
# CORE AI WORKFLOWS & HELPER UTILITIES
# ==========================================================

# Extract text from uploaded PDF
def extract_resume_text(pdf_bytes):
    try:
        document = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )
        text = ""
        for page in document:
            text += page.get_text()
        document.close()

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF."
            )
        return text

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this PDF file."
        )


# Resume analysis API
@app.post("/analyze-resume")
def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user)
):
    # Check file type
    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    # Read uploaded file
    pdf_bytes = resume.file.read()

    # Check file size (5 MB maximum)
    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 5 MB."
        )

    if not pdf_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    if not job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty."
        )

    # Extract resume text
    resume_text = extract_resume_text(pdf_bytes)

    # Prepare prompt for Groq
    prompt = f"""
You are an expert resume analyzer and technical recruiter.

Analyze the candidate's resume against the given job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY valid JSON. Do not use Markdown code fences.

Follow this exact JSON structure:

{{
    "match_score": 85,
    "score_explanation": "Explain why this score was given.",
    "matching_skills": [
        "Java",
        "SQL"
    ],
    "missing_skills": [
        "DBMS"
    ],
    "strengths": [
        "Strong knowledge of Java",
        "Relevant academic projects"
    ],
    "improvement_suggestions": [
        "Add measurable results to project descriptions",
        "Highlight relevant technical skills"
    ],
    "keyword_suggestions": [
        "Object-Oriented Programming",
        "Problem Solving"
    ]
}}

IMPORTANT RULES:
1. Match score must be a number between 0 and 100.
2. Only identify skills actually supported by the resume.
3. Do not invent qualifications, projects or experience.
4. Missing skills must be based on the job description.
5. Keep all suggestions practical and relevant.
6. Every list must contain strings.
7. Return valid JSON only.
"""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        analysis_text = response.choices[0].message.content

        if not analysis_text:
            raise HTTPException(
                status_code=502,
                detail="Groq returned an empty response."
            )

        try:
            analysis = json.loads(analysis_text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail="AI returned an invalid JSON response. Please try again."
            )

        # Automatically persist to database if user is logged in
        if current_user:
            try:
                report = models.AnalysisReport(
                    user_id=current_user.id,
                    report_type="resume_analysis",
                    job_description=job_description[:1000],
                    match_score=analysis.get("match_score"),
                    result_json=json.dumps(analysis)
                )
                db.add(report)
                db.commit()
            except Exception as db_err:
                print("Failed to save report to database:", db_err)

        return {
            "success": True,
            "filename": resume.filename,
            "analysis": analysis
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Groq API error:", error)
        raise HTTPException(
            status_code=502,
            detail="AI analysis failed. Check your Groq API access and try again."
        )


@app.post("/match-jobs")
async def match_jobs(
    resume: UploadFile = File(...),
    job_descriptions: str = Form(...)
):
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    pdf_bytes = await resume.read()

    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 5 MB."
        )

    resume_text = extract_resume_text(pdf_bytes)

    prompt = f"""
You are an expert job matching assistant.

Compare the candidate's resume against each job description.

RESUME:
{resume_text}

JOB DESCRIPTIONS:
{job_descriptions}

For EACH job, evaluate:
1. Job title
2. Match score from 0 to 100
3. Matching skills
4. Missing skills
5. Reasons why the candidate is suitable
6. Skills the candidate should improve

IMPORTANT:
- Use only evidence from the resume.
- Do not invent candidate qualifications.
- Give realistic match scores.
- Return ONLY valid JSON.
- Sort jobs by match_score from highest to lowest.

Use exactly this JSON structure:

{{
  "matches": [
    {{
      "job_title": "Job title",
      "match_score": 80,
      "matching_skills": ["Java", "SQL"],
      "missing_skills": ["AWS"],
      "why_suitable": ["Relevant project experience"],
      "skills_to_improve": ["AWS"]
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        analysis_text = response.choices[0].message.content

        if not analysis_text:
            raise HTTPException(
                status_code=502,
                detail="Groq returned an empty response."
            )

        analysis = json.loads(analysis_text)

        return {
            "success": True,
            "filename": resume.filename,
            "analysis": analysis
        }

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned invalid JSON. Please try again."
        )
    except Exception as error:
        print("Groq Job Matcher error:", error)
        raise HTTPException(
            status_code=502,
            detail="Job matching failed. Please try again."
        )


@app.post("/generate-interview")
async def generate_interview(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    interview_text = ""

    try:
        if not resume.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a PDF resume."
            )

        pdf_bytes = await resume.read()

        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty."
            )

        if len(pdf_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Resume must be smaller than 5 MB."
            )

        resume_text = extract_resume_text(pdf_bytes)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume."
            )

        if not job_description.strip():
            raise HTTPException(
                status_code=400,
                detail="Please enter a job description."
            )

        prompt = f"""
You are an experienced technical interviewer.

Generate a personalized interview preparation set
using the candidate's resume and job description.

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Generate exactly:

1. Five technical interview questions.
2. Five resume and project-related questions.
3. Five HR and behavioral questions.
4. Two follow-up questions for every technical question.

Return a JSON object with this exact structure:

{{
    "technical_questions": [
        {{
            "question": "What is OOP in Java?",
            "topic": "Java OOP",
            "sample_answer": "OOP is a programming approach based on objects and classes.",
            "follow_up_questions": [
                "What is inheritance?",
                "What is polymorphism?"
            ]
        }}
    ],
    "resume_questions": [
        {{
            "question": "Explain your project.",
            "sample_answer": "Explain the project using only details from the resume."
        }}
    ],
    "hr_questions": [
        {{
            "question": "Tell me about yourself.",
            "sample_answer": "Give a simple and professional answer."
        }}
    ]
}}

IMPORTANT RULES:
- Return only valid JSON.
- Do not use Markdown code fences.
- Use simple English in all sample answers.
- Keep answers short, accurate and easy to learn.
- Do not invent skills, projects or work experience.
- Ask resume questions only about information actually present.
- Make technical questions relevant to the job description.
- Generate exactly 5 questions in each of the three categories.
- Generate exactly 2 follow-up questions for each technical question.
"""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert interview preparation assistant. "
                        "Return only a valid JSON object. "
                        "Never include Markdown or extra text."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_completion_tokens=6000
        )

        interview_text = response.choices[0].message.content

        if not interview_text:
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty response."
            )

        interview_data = json.loads(interview_text)

        required_keys = [
            "technical_questions",
            "resume_questions",
            "hr_questions"
        ]

        for key in required_keys:
            if key not in interview_data:
                raise ValueError(f"Missing field in AI response: {key}")

            if not isinstance(interview_data[key], list):
                raise ValueError(f"Invalid format for {key}")

        if len(interview_data["technical_questions"]) != 5:
            raise ValueError("AI did not generate exactly 5 technical questions.")

        if len(interview_data["resume_questions"]) != 5:
            raise ValueError("AI did not generate exactly 5 resume questions.")

        if len(interview_data["hr_questions"]) != 5:
            raise ValueError("AI did not generate exactly 5 HR questions.")

        for question in interview_data["technical_questions"]:
            if len(question.get("follow_up_questions", [])) != 2:
                raise ValueError(
                    "Each technical question must have exactly 2 follow-up questions."
                )

        return {
            "success": True,
            "filename": resume.filename,
            "interview": interview_data
        }

    except HTTPException:
        raise
    except json.JSONDecodeError as error:
        print("JSON parsing error:", error)
        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid JSON response. Please try again."
        )
    except ValueError as error:
        print("Response validation error:", error)
        raise HTTPException(
            status_code=502,
            detail=str(error)
        )
    except Exception as error:
        print("Interview generation error:", error)
        raise HTTPException(
            status_code=502,
            detail="Interview generation failed. Please try again."
        )


@app.post("/evaluate-interview-answer", response_model=schemas.InterviewEvaluationResponse)
def evaluate_interview_answer(
    req: schemas.InterviewEvaluationRequest,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Interview question cannot be empty.")
    if not req.user_answer.strip():
        raise HTTPException(status_code=400, detail="Candidate answer cannot be empty.")

    prompt = f"""
You are an expert technical interviewer and senior hiring manager.

Evaluate the candidate's answer to the following interview question:

QUESTION:
{req.question}

CATEGORY:
{req.category or "General"}

TOPIC:
{req.topic or "General"}

JOB DESCRIPTION / CONTEXT:
{req.job_description or "General Software / Technical Role"}

CANDIDATE'S ANSWER:
{req.user_answer}

Provide a constructive, realistic, and thorough evaluation:
1. "score": A numeric rating between 0.0 and 10.0 (e.g. 7.5, 8.0, 9.2).
2. "verdict": Short verdict (e.g. "Outstanding", "Strong Answer", "Adequate with Gaps", "Needs Substantial Work").
3. "feedback": 2-3 sentences explaining the rating.
4. "strengths": Array of 2 to 4 bullet strings highlighting what was done well.
5. "improvements": Array of 2 to 4 bullet strings suggesting missing details, clearer wording, or technical depth.
6. "star_breakdown": An object with "situation", "task", "action", "result" assessments (brief string for each).
7. "model_answer": A high-scoring, ideal answer candidate can study.

Return ONLY valid JSON. Do not include markdown code blocks.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict, helpful interview evaluator. "
                        "Return only a valid JSON object matching the requested schema."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_completion_tokens=2500
        )

        res_text = response.choices[0].message.content
        if not res_text:
            raise HTTPException(status_code=502, detail="Empty response from AI.")

        eval_data = json.loads(res_text)

        score = float(eval_data.get("score", 7.0))
        verdict = str(eval_data.get("verdict", "Good Answer"))
        feedback = str(eval_data.get("feedback", "Your answer addresses the main points."))
        strengths = [str(s) for s in eval_data.get("strengths", ["Addressed core question"])]
        improvements = [str(i) for i in eval_data.get("improvements", ["Provide more specific details"])]
        star_breakdown = eval_data.get("star_breakdown", {
            "situation": "Context stated",
            "task": "Task outlined",
            "action": "Action described",
            "result": "Impact described"
        })
        model_answer = str(eval_data.get("model_answer", "Focus on impact, structure, and concrete examples."))

        # Persist session if logged in
        if current_user:
            try:
                session_rec = models.InterviewSession(
                    user_id=current_user.id,
                    job_title=req.topic or "Interview Practice",
                    job_description=req.job_description,
                    questions_json=json.dumps([req.question]),
                    answers_json=json.dumps([req.user_answer]),
                    evaluations_json=json.dumps(eval_data),
                    overall_score=score
                )
                db.add(session_rec)
                db.commit()
            except Exception as db_err:
                print("Failed to save interview session:", db_err)

        return schemas.InterviewEvaluationResponse(
            score=score,
            verdict=verdict,
            feedback=feedback,
            strengths=strengths,
            improvements=improvements,
            star_breakdown=star_breakdown,
            model_answer=model_answer
        )

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON response.")
    except Exception as err:
        print("Interview evaluation error:", err)
        raise HTTPException(status_code=502, detail="Failed to evaluate interview answer.")


# ==========================================================
# 01 AI RESUME COACH (Bullet Polisher & Description Improver)
# ==========================================================

@app.post("/coach-bullet", response_model=schemas.BulletCoachResponse)
def coach_bullet(req: schemas.BulletCoachRequest):
    if not req.bullet_text.strip():
        raise HTTPException(status_code=400, detail="Bullet description cannot be empty.")

    prompt = f"""
You are an elite Silicon Valley executive resume coach and hiring manager.

Transform the following weak or ordinary resume bullet point into 3 high-impact, professional descriptions:

ORIGINAL BULLET:
"{req.bullet_text}"

TARGET ROLE:
"{req.target_role or 'Software Engineer / Technology Role'}"

TARGET COMPANY / INDUSTRY CONTEXT:
"{req.target_company or 'Top Tech Companies'}"

Apply the Google XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]" and action-driven STAR framing.
For each of the 3 suggestions, provide:
1. "version_name": E.g. "Metrics & Impact Focused", "Technical Depth & Architecture", or "Leadership & Ownership".
2. "text": The polished bullet point starting with a powerful past-tense action verb.
3. "power_verb": The lead action verb used (e.g. "Architected", "Engineered", "Orchestrated", "Accelerated").
4. "metrics_added": What quantifiable metric or scale was introduced (e.g. "35% latency reduction", "10k+ daily users").
5. "why_better": 1 concise sentence explaining why recruiters will prefer this over the original.

Also provide 2-3 "general_tips" for resume descriptions.

Return ONLY a valid JSON object matching this structure:
{{
  "original": "{req.bullet_text}",
  "suggestions": [
    {{
      "version_name": "Metrics & Impact Focused",
      "text": "Architected high-throughput REST APIs using FastAPI and PostgreSQL, slashing p99 latency by 42% for 15,000+ active users.",
      "power_verb": "Architected",
      "metrics_added": "42% latency reduction, 15,000+ users",
      "why_better": "Transforms passive wording into a quantifiable engineering accomplishment."
    }}
  ],
  "general_tips": [
    "Always lead with high-impact past tense verbs.",
    "Quantify scale, speed, revenue, or user adoption wherever possible."
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional resume writer and coach. Return only valid JSON without markdown code fences."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_completion_tokens=2500
        )

        res_text = response.choices[0].message.content
        if not res_text:
            raise HTTPException(status_code=502, detail="Empty response from AI.")

        data = json.loads(res_text)

        suggestions = []
        for s in data.get("suggestions", []):
            suggestions.append(schemas.RewrittenBullet(
                version_name=s.get("version_name", "Enhanced Version"),
                text=s.get("text", req.bullet_text),
                power_verb=s.get("power_verb", "Developed"),
                metrics_added=s.get("metrics_added", "Quantified business impact"),
                why_better=s.get("why_better", "Stronger action-oriented phrasing.")
            ))

        return schemas.BulletCoachResponse(
            original=req.bullet_text,
            suggestions=suggestions,
            general_tips=data.get("general_tips", ["Use active verbs and quantifiable results."])
        )

    except HTTPException:
        raise
    except Exception as err:
        print("Bullet coach error:", err)
        raise HTTPException(status_code=502, detail="Resume coaching failed. Please try again.")


# ==========================================================
# 02 ATS COMPATIBILITY CHECKER
# ==========================================================

@app.post("/ats-checker", response_model=schemas.ATSCheckResponse)
async def ats_checker(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Resume must be smaller than 5 MB.")

    resume_text = extract_resume_text(pdf_bytes)
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    # Structural heuristic checks
    has_email = "@" in resume_text
    has_phone = any(char.isdigit() for char in resume_text)
    word_count = len(resume_text.split())

    prompt = f"""
You are an expert ATS (Applicant Tracking System) parser and recruitment compliance auditor.

Thoroughly inspect this candidate's resume against the target job description to determine ATS compatibility, layout risks, missing requirements, and keyword optimization.

RESUME CONTENT:
{resume_text}

TARGET JOB DESCRIPTION:
{job_description}

STRUCTURAL PRE-SCAN:
- Word count: {word_count}
- Email detected: {has_email}
- Phone detected: {has_phone}

Perform a rigorous ATS audit and return a valid JSON object matching this exact structure:
{{
  "ats_score": 82,
  "grade": "B+",
  "formatting_score": 88,
  "keyword_score": 78,
  "content_score": 80,
  "detected_sections": ["Experience", "Education", "Skills", "Projects"],
  "missing_sections": ["Certifications"],
  "formatting_issues": [
    "Ensure section headers use standardized names (e.g. Work Experience instead of What I've Done).",
    "Keep font formatting clean and avoid nested tables."
  ],
  "missing_critical_keywords": ["Docker", "Kubernetes", "GraphQL"],
  "matching_keywords": ["Python", "FastAPI", "PostgreSQL", "Git"],
  "missing_job_requirements": ["3+ years of cloud deployment experience", "Bachelor's degree in CS or equivalent"],
  "action_checklist": [
    {{"priority": "High", "item": "Incorporate missing keywords (Docker, Kubernetes) in your project descriptions."}},
    {{"priority": "Medium", "item": "Add explicit metrics to recent employment achievements."}},
    {{"priority": "Low", "item": "Standardize date formatting across all timeline entries."}}
  ]
}}

Rules:
- ats_score must be an integer between 0 and 100.
- grade must be A+, A, B, C, or D based on the score.
- Ensure all lists are non-empty arrays of strings.
- Return ONLY valid JSON without markdown code fences.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an ATS parsing auditor. Return only valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_completion_tokens=3000
        )

        res_text = response.choices[0].message.content
        if not res_text:
            raise HTTPException(status_code=502, detail="Empty response from ATS checker.")

        data = json.loads(res_text)

        # Save report if authenticated
        if current_user:
            try:
                report = models.AnalysisReport(
                    user_id=current_user.id,
                    report_type="ats_check",
                    job_description=job_description[:1000],
                    match_score=data.get("keyword_score", 75),
                    ats_score=data.get("ats_score", 80),
                    result_json=json.dumps(data)
                )
                db.add(report)
                db.commit()
            except Exception as db_err:
                print("Failed to save ATS report:", db_err)

        return schemas.ATSCheckResponse(
            ats_score=int(data.get("ats_score", 75)),
            grade=str(data.get("grade", "B")),
            formatting_score=int(data.get("formatting_score", 80)),
            keyword_score=int(data.get("keyword_score", 70)),
            content_score=int(data.get("content_score", 75)),
            detected_sections=data.get("detected_sections", ["Skills", "Education"]),
            missing_sections=data.get("missing_sections", []),
            formatting_issues=data.get("formatting_issues", []),
            missing_critical_keywords=data.get("missing_critical_keywords", []),
            matching_keywords=data.get("matching_keywords", []),
            missing_job_requirements=data.get("missing_job_requirements", []),
            action_checklist=data.get("action_checklist", [])
        )

    except HTTPException:
        raise
    except Exception as err:
        print("ATS Checker error:", err)
        raise HTTPException(status_code=502, detail="ATS compatibility scan failed. Please try again.")


# ==========================================================
# 07 SKILL GAP ANALYZER & PERSONALIZED LEARNING ROADMAP
# ==========================================================

@app.post("/analyze-skill-gap", response_model=schemas.SkillGapResponse)
async def analyze_skill_gap(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Resume must be smaller than 5 MB.")

    resume_text = extract_resume_text(pdf_bytes)
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    prompt = f"""
You are a senior tech career strategist and developer advocate.

Perform a thorough Skill Gap Analysis by comparing the candidate's resume with the target job requirements.
Then construct a targeted 4-week learning roadmap to close the candidate's critical skill gaps.

RESUME CONTENT:
{resume_text}

TARGET JOB DESCRIPTION:
{job_description}

Return a valid JSON object matching this exact structure:
{{
  "match_percentage": 68,
  "matching_skills": ["Python", "FastAPI", "SQL", "Git"],
  "critical_missing_skills": ["Docker containerization", "Redis caching", "CI/CD pipelines"],
  "secondary_missing_skills": ["Kubernetes", "GraphQL", "TypeScript"],
  "tools_and_frameworks_missing": ["Docker", "Redis", "GitHub Actions"],
  "soft_skills_missing": ["Agile sprint planning", "Cross-team design collaboration"],
  "estimated_weeks_to_ready": 4,
  "executive_summary": "Candidate has solid foundational backend skills but lacks production containerization and caching experience required for this role.",
  "roadmap": [
    {{
      "week_number": 1,
      "theme": "Containerization Fundamentals with Docker",
      "topics": ["Dockerfiles", "Multi-stage builds", "Docker Compose for local dev"],
      "recommended_project": "Containerize an existing FastAPI and PostgreSQL app with healthchecks.",
      "learning_resources": ["Docker official docs", "Docker for Python Developers guide"]
    }},
    {{
      "week_number": 2,
      "theme": "High-Performance Caching with Redis",
      "topics": ["Cache-aside pattern", "In-memory key expiration", "Rate limiting with Redis"],
      "recommended_project": "Add Redis caching layer to API endpoints to reduce database query load.",
      "learning_resources": ["Redis University courses", "FastAPI Redis integration tutorials"]
    }},
    {{
      "week_number": 3,
      "theme": "Automated Testing & CI/CD Pipelines",
      "topics": ["GitHub Actions workflows", "Pytest automated testing", "Automated image build and push"],
      "recommended_project": "Set up a complete GitHub Actions CI/CD pipeline running tests on PRs.",
      "learning_resources": ["GitHub Actions documentation", "Test-driven Python development"]
    }},
    {{
      "week_number": 4,
      "theme": "System Architecture Capstone & Interview Readiness",
      "topics": ["System design trade-offs", "Production observability & logging", "Portfolio showcase"],
      "recommended_project": "Deploy the complete containerized, cached microservice to a public cloud instance.",
      "learning_resources": ["System Design Primer", "Production Engineering checklists"]
    }}
  ]
}}

Rules:
- match_percentage must be an integer between 0 and 100.
- roadmap must have exactly 4 structured weeks.
- Return ONLY valid JSON without markdown code fences.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert career and skills advisor. Return only valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.25,
            max_completion_tokens=3500
        )

        res_text = response.choices[0].message.content
        if not res_text:
            raise HTTPException(status_code=502, detail="Empty response from Skill Gap Analyzer.")

        data = json.loads(res_text)

        roadmap_weeks = []
        for w in data.get("roadmap", []):
            roadmap_weeks.append(schemas.SkillGapWeek(
                week_number=int(w.get("week_number", 1)),
                theme=str(w.get("theme", "Core Skills")),
                topics=[str(t) for t in w.get("topics", [])],
                recommended_project=str(w.get("recommended_project", "Build a practice prototype.")),
                learning_resources=[str(r) for r in w.get("learning_resources", [])]
            ))

        if current_user:
            try:
                report = models.AnalysisReport(
                    user_id=current_user.id,
                    report_type="skill_gap",
                    job_description=job_description[:1000],
                    match_score=int(data.get("match_percentage", 65)),
                    result_json=json.dumps(data)
                )
                db.add(report)
                db.commit()
            except Exception as db_err:
                print("Failed to save Skill Gap report:", db_err)

        return schemas.SkillGapResponse(
            match_percentage=int(data.get("match_percentage", 65)),
            matching_skills=[str(s) for s in data.get("matching_skills", [])],
            critical_missing_skills=[str(s) for s in data.get("critical_missing_skills", [])],
            secondary_missing_skills=[str(s) for s in data.get("secondary_missing_skills", [])],
            tools_and_frameworks_missing=[str(s) for s in data.get("tools_and_frameworks_missing", [])],
            soft_skills_missing=[str(s) for s in data.get("soft_skills_missing", [])],
            estimated_weeks_to_ready=int(data.get("estimated_weeks_to_ready", 4)),
            roadmap=roadmap_weeks,
            executive_summary=str(data.get("executive_summary", "Skill comparison complete.")),
        )

    except HTTPException:
        raise
    except Exception as err:
        print("Skill Gap error:", err)
        raise HTTPException(status_code=502, detail="Skill gap analysis failed. Please try again.")
