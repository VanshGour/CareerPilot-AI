from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, Field


# ---------------- USER SCHEMAS ---------------- #
class UserSignup(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=128)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------- RESUME SCHEMAS ---------------- #
class ResumeCreate(BaseModel):
    title: Optional[str] = "My Resume"
    file_name: Optional[str] = None
    raw_text: Optional[str] = None
    builder_data: Optional[str] = None  # JSON string


class ResumeOut(BaseModel):
    id: int
    user_id: Optional[int]
    title: str
    file_name: Optional[str]
    raw_text: Optional[str]
    builder_data: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- ANALYSIS REPORT SCHEMAS ---------------- #
class AnalysisReportCreate(BaseModel):
    resume_id: Optional[int] = None
    report_type: str = "resume_analysis"
    target_job_title: Optional[str] = None
    job_description: Optional[str] = None
    match_score: Optional[int] = None
    ats_score: Optional[int] = None
    result_json: str


class AnalysisReportOut(BaseModel):
    id: int
    user_id: Optional[int]
    resume_id: Optional[int]
    report_type: str
    target_job_title: Optional[str]
    match_score: Optional[int]
    ats_score: Optional[int]
    result_json: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- JOB APPLICATION SCHEMAS ---------------- #
class JobApplicationCreate(BaseModel):
    company: str
    role: str
    status: Optional[str] = "Applied"
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    applied_date: Optional[str] = None
    next_interview_date: Optional[str] = None
    notes: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    applied_date: Optional[str] = None
    next_interview_date: Optional[str] = None
    notes: Optional[str] = None


class JobApplicationOut(BaseModel):
    id: int
    user_id: int
    company: str
    role: str
    status: str
    location: Optional[str]
    salary_range: Optional[str]
    job_url: Optional[str]
    job_description: Optional[str]
    applied_date: Optional[str]
    next_interview_date: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------------- INTERVIEW SESSION SCHEMAS ---------------- #
class InterviewSessionCreate(BaseModel):
    job_title: str
    job_description: Optional[str] = None
    questions_json: Optional[str] = None
    answers_json: Optional[str] = None
    evaluations_json: Optional[str] = None
    overall_score: Optional[float] = None


class InterviewSessionOut(BaseModel):
    id: int
    user_id: int
    job_title: str
    job_description: Optional[str]
    questions_json: Optional[str]
    answers_json: Optional[str]
    evaluations_json: Optional[str]
    overall_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True



class InterviewEvaluationRequest(BaseModel):
    question: str
    user_answer: str
    topic: Optional[str] = None
    category: Optional[str] = "technical"
    job_description: Optional[str] = None


class InterviewEvaluationResponse(BaseModel):
    score: float
    verdict: str
    feedback: str
    strengths: List[str]
    improvements: List[str]
    star_breakdown: Optional[dict] = None
    model_answer: str


# ---------------- MILESTONE 01: AI RESUME COACH ---------------- #
class BulletCoachRequest(BaseModel):
    bullet_text: str
    target_role: Optional[str] = None
    target_company: Optional[str] = None


class RewrittenBullet(BaseModel):
    version_name: str
    text: str
    power_verb: str
    metrics_added: str
    why_better: str


class BulletCoachResponse(BaseModel):
    original: str
    suggestions: List[RewrittenBullet]
    general_tips: List[str]


# ---------------- MILESTONE 02: ATS COMPATIBILITY CHECKER ---------------- #
class ATSCheckResponse(BaseModel):
    ats_score: int
    grade: str
    formatting_score: int
    keyword_score: int
    content_score: int
    detected_sections: List[str]
    missing_sections: List[str]
    formatting_issues: List[str]
    missing_critical_keywords: List[str]
    matching_keywords: List[str]
    missing_job_requirements: List[str]
    action_checklist: List[dict]


# ---------------- MILESTONE 07: SKILL GAP ANALYZER ---------------- #
class SkillGapWeek(BaseModel):
    week_number: int
    theme: str
    topics: List[str]
    recommended_project: str
    learning_resources: List[str]


class SkillGapResponse(BaseModel):
    match_percentage: int
    matching_skills: List[str]
    critical_missing_skills: List[str]
    secondary_missing_skills: List[str]
    tools_and_frameworks_missing: List[str]
    soft_skills_missing: List[str]
    estimated_weeks_to_ready: int
    roadmap: List[SkillGapWeek]
    executive_summary: str
