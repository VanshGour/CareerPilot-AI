from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Float,
    ForeignKey,
    func
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=func.now())

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    analysis_reports = relationship("AnalysisReport", back_populates="user", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), default="My Resume")
    file_name = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=True)
    builder_data = Column(Text, nullable=True)  # JSON-encoded builder structure
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=func.now())

    owner = relationship("User", back_populates="resumes")
    analysis_reports = relationship("AnalysisReport", back_populates="resume")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(50), default="resume_analysis")  # resume_analysis, ats_check, skill_gap
    target_job_title = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=True)
    match_score = Column(Integer, nullable=True)
    ats_score = Column(Integer, nullable=True)
    result_json = Column(Text, nullable=False)  # JSON payload of results
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    user = relationship("User", back_populates="analysis_reports")
    resume = relationship("Resume", back_populates="analysis_reports")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    status = Column(String(50), default="Applied")  # Wishlist, Applied, Screening, Interview, Offer, Rejected
    location = Column(String(255), nullable=True)
    salary_range = Column(String(100), nullable=True)
    job_url = Column(String(500), nullable=True)
    job_description = Column(Text, nullable=True)
    applied_date = Column(String(50), nullable=True)
    next_interview_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=func.now())

    user = relationship("User", back_populates="job_applications")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=True)
    questions_json = Column(Text, nullable=True)
    answers_json = Column(Text, nullable=True)
    evaluations_json = Column(Text, nullable=True)
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    user = relationship("User", back_populates="interview_sessions")

