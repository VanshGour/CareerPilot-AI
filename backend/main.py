
import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import fitz

# Load environment variables from .env
load_dotenv()

# Initialize Gemini
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing from .env")

client = Groq(api_key=GROQ_API_KEY)

# Create FastAPI application
app = FastAPI(
    title="AI Job Application Copilot",
    description="AI-powered resume analysis platform",
    version="1.0.0"
)

# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to AI Job Application Copilot!"
    }


@app.get("/health")
def health():
    return {
        "status": "running",
        "project": "AI Job Application Copilot"
    }


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
    job_description: str = Form(...)
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

    # Prepare prompt for Gemini
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
        # Send prompt to Groq
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
    # Check PDF file
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    # Check file size
    pdf_bytes = await resume.read()

    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 5 MB."
        )

    # Extract resume text
    resume_text = extract_resume_text(pdf_bytes)

    # Prepare AI prompt
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
        # 1. Validate uploaded file
        if not resume.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a PDF resume."
            )

        # 2. Read PDF
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

        # 3. Extract resume text
        resume_text = extract_resume_text(pdf_bytes)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume."
            )

        # 4. Validate job description
        if not job_description.strip():
            raise HTTPException(
                status_code=400,
                detail="Please enter a job description."
            )

        # 5. Create AI prompt
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

        # 6. Send request to Groq
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

        # 7. Get AI response
        interview_text = response.choices[0].message.content

        if not interview_text:
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty response."
            )

        # 8. Convert AI response into Python JSON
        interview_data = json.loads(interview_text)

        # 9. Validate response structure
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

        # 10. Return successful response
        return {
            "success": True,
            "filename": resume.filename,
            "interview": interview_data
        }

    except HTTPException:
        raise

    except json.JSONDecodeError as error:
        print("JSON parsing error:", error)
        print("Groq response:", interview_text)

        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid JSON response. Please try again."
        )

    except ValueError as error:
        print("Response validation error:", error)
        print("Groq response:", interview_text)

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