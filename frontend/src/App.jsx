import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [status, setStatus] = useState("Checking...");
  const [activeSection, setActiveSection] = useState("overview");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  // Resume Analyzer
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);

  // Job Matcher
  const [jobDescriptions, setJobDescriptions] = useState("");
  const [jobMatches, setJobMatches] = useState([]);
  const [matchFilename, setMatchFilename] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);

  // Interview Preparation
  const [interviewJobDescription, setInterviewJobDescription] = useState("");
  const [interviewData, setInterviewData] = useState(null);
  const [interviewFilename, setInterviewFilename] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);

  // 01 AI Resume Coach State
  const [coachBullet, setCoachBullet] = useState("");
  const [coachTargetRole, setCoachTargetRole] = useState("");
  const [coachTargetCompany, setCoachTargetCompany] = useState("");
  const [coachResult, setCoachResult] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // 02 ATS Compatibility Checker State
  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  // 07 Skill Gap Analyzer State
  const [gapJobDescription, setGapJobDescription] = useState("");
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  // User Authentication & Cloud Database (Milestones 03 & 04)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("careerpilot_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("careerpilot_token") || "");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [authForm, setAuthForm] = useState({ email: "", password: "", full_name: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Cloud Database Saved Resumes
  const [savedResumes, setSavedResumes] = useState([]);
  const [saveResumeTitle, setSaveResumeTitle] = useState("");
  const [saveResumeLoading, setSaveResumeLoading] = useState(false);
  const [saveResumeSuccess, setSaveResumeSuccess] = useState("");

  // Resume Builder
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    summary: "",
    degree: "",
    college: "",
    graduationYear: "",
    cgpa: "",
    skills: "",
    projectName: "",
    projectTech: "",
    projectDescription: "",
    experience: "",
  });

  // Sync token with Axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Fetch saved resumes from cloud database
  const fetchSavedResumes = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/resumes`);
      setSavedResumes(res.data);
    } catch (err) {
      console.error("Failed to fetch saved resumes:", err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchSavedResumes();
    } else {
      setSavedResumes([]);
    }
  }, [user, token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const payload =
        authMode === "signup"
          ? { email: authForm.email, password: authForm.password, full_name: authForm.full_name }
          : { email: authForm.email, password: authForm.password };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      const { access_token, user: userData } = response.data;

      localStorage.setItem("careerpilot_token", access_token);
      localStorage.setItem("careerpilot_user", JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      setShowAuthModal(false);
      setAuthForm({ email: "", password: "", full_name: "" });
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("careerpilot_token");
    localStorage.removeItem("careerpilot_user");
    setToken("");
    setUser(null);
    setSavedResumes([]);
  };

  const handleSaveResumeToDb = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!resumeData.name.trim()) {
      alert("Please enter at least your name before saving your resume.");
      return;
    }

    setSaveResumeLoading(true);
    setSaveResumeSuccess("");
    try {
      const payload = {
        title: saveResumeTitle.trim() || `${resumeData.name}'s Resume`,
        builder_data: JSON.stringify(resumeData),
        raw_text: `${resumeData.name}\n${resumeData.summary}\n${resumeData.skills}\n${resumeData.experience}`,
      };
      await axios.post(`${API_URL}/resumes/save`, payload);
      setSaveResumeSuccess("Resume saved to your cloud database!");
      fetchSavedResumes();
      setTimeout(() => setSaveResumeSuccess(""), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save resume to database.");
    } finally {
      setSaveResumeLoading(false);
    }
  };

  const handleLoadResume = (saved) => {
    try {
      if (saved.builder_data) {
        const parsed = JSON.parse(saved.builder_data);
        setResumeData(parsed);
        setSaveResumeTitle(saved.title);
        setSaveResumeSuccess(`Loaded "${saved.title}" into builder!`);
        setTimeout(() => setSaveResumeSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Failed to parse resume data:", err);
    }
  };

  // ----------------------------------------------------
  // Milestone 05: Job Application Tracker State
  // ----------------------------------------------------
  const [applications, setApplications] = useState([
    {
      id: 1,
      company: "Google",
      role: "Software Engineer",
      status: "Interview",
      location: "Remote / Hybrid",
      salary_range: "$140k - $170k",
      applied_date: "2026-11-01",
      next_interview_date: "2026-11-20",
      notes: "Passed technical screening, preparing for system design round.",
    },
    {
      id: 2,
      company: "Microsoft",
      role: "Full Stack Developer",
      status: "Applied",
      location: "Redmond, WA",
      salary_range: "$130k - $160k",
      applied_date: "2026-11-05",
      next_interview_date: "",
      notes: "Applied with tailored resume via referral.",
    },
    {
      id: 3,
      company: "Stripe",
      role: "Backend Engineer",
      status: "Screening",
      location: "San Francisco, CA",
      salary_range: "$150k - $180k",
      applied_date: "2026-11-08",
      next_interview_date: "2026-11-18",
      notes: "Recruiter phone call scheduled.",
    },
  ]);
  const [activeStageFilter, setActiveStageFilter] = useState("All");
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    company: "",
    role: "",
    status: "Applied",
    location: "",
    salary_range: "",
    job_url: "",
    applied_date: "",
    next_interview_date: "",
    notes: "",
  });
  const [appActionLoading, setAppActionLoading] = useState(false);

  // Fetch applications from cloud DB when authenticated
  const fetchApplications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/applications`);
      if (res.data && res.data.length > 0) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchApplications();
    }
  }, [user, token]);

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    if (!newAppForm.company.trim() || !newAppForm.role.trim()) {
      alert("Please enter both Company and Role.");
      return;
    }

    if (user && token) {
      try {
        setAppActionLoading(true);
        const res = await axios.post(`${API_URL}/applications`, newAppForm);
        setApplications([res.data, ...applications]);
        setShowAddAppModal(false);
        setNewAppForm({
          company: "",
          role: "",
          status: "Applied",
          location: "",
          salary_range: "",
          job_url: "",
          applied_date: new Date().toISOString().split("T")[0],
          next_interview_date: "",
          notes: "",
        });
      } catch (err) {
        alert("Failed to save application: " + (err.response?.data?.detail || err.message));
      } finally {
        setAppActionLoading(false);
      }
    } else {
      const guestApp = {
        id: Date.now(),
        ...newAppForm,
        created_at: new Date().toISOString(),
      };
      setApplications([guestApp, ...applications]);
      setShowAddAppModal(false);
      setNewAppForm({
        company: "",
        role: "",
        status: "Applied",
        location: "",
        salary_range: "",
        job_url: "",
        applied_date: new Date().toISOString().split("T")[0],
        next_interview_date: "",
        notes: "",
      });
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    if (user && token) {
      try {
        const res = await axios.put(`${API_URL}/applications/${appId}`, { status: newStatus });
        setApplications(applications.map((a) => (a.id === appId ? res.data : a)));
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    } else {
      setApplications(applications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) return;
    if (user && token) {
      try {
        await axios.delete(`${API_URL}/applications/${appId}`);
        setApplications(applications.filter((a) => a.id !== appId));
      } catch (err) {
        console.error("Failed to delete application:", err);
      }
    } else {
      setApplications(applications.filter((a) => a.id !== appId));
    }
  };

  const handlePrepareInterviewForRole = (appItem) => {
    const desc = `${appItem.role} at ${appItem.company}
Location: ${appItem.location || "N/A"}
Salary Range: ${appItem.salary_range || "N/A"}
Notes & Requirements: ${appItem.notes || ""}`;
    setInterviewJobDescription(desc);
    scrollToSection("interview");
  };

  // ----------------------------------------------------
  // Milestone 06: Interactive Mock Interview State
  // ----------------------------------------------------
  const [openPractice, setOpenPractice] = useState({});
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evalLoading, setEvalLoading] = useState({});

  const handleEvaluateAnswer = async (key, questionText, categoryName, topicName) => {
    const answer = userAnswers[key];
    if (!answer || !answer.trim()) {
      alert("Please type your answer before submitting for AI evaluation.");
      return;
    }

    setEvalLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await axios.post(`${API_URL}/evaluate-interview-answer`, {
        question: questionText,
        user_answer: answer.trim(),
        category: categoryName,
        topic: topicName || categoryName,
        job_description: interviewJobDescription,
      });
      setEvaluations((prev) => ({ ...prev, [key]: res.data }));
    } catch (err) {
      alert("Evaluation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setEvalLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ----------------------------------------------------
  // Milestone 01: AI Resume Coach Handlers
  // ----------------------------------------------------
  const handleCoachBullet = async (e) => {
    e.preventDefault();
    if (!coachBullet.trim()) {
      alert("Please enter a bullet point or description to optimize.");
      return;
    }

    setCoachLoading(true);
    try {
      const res = await axios.post(`${API_URL}/coach-bullet`, {
        bullet_text: coachBullet.trim(),
        target_role: coachTargetRole.trim() || undefined,
        target_company: coachTargetCompany.trim() || undefined,
      });
      setCoachResult(res.data);
    } catch (err) {
      alert("Coaching failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setCoachLoading(false);
    }
  };

  const handleApplyCoachBullet = (text) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience ? `${prev.experience}\n• ${text}` : `• ${text}`,
    }));
    alert("Applied enhanced bullet point to Resume Builder experience section!");
  };

  // ----------------------------------------------------
  // Milestone 02: ATS Compatibility Checker Handler
  // ----------------------------------------------------
  const handleRunAtsCheck = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your PDF resume in the Overview section first.");
      scrollToSection("overview");
      return;
    }
    if (!atsJobDescription.trim()) {
      alert("Please paste the target job description.");
      return;
    }

    setAtsLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", atsJobDescription.trim());

      const res = await axios.post(`${API_URL}/ats-checker`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAtsResult(res.data);
    } catch (err) {
      alert("ATS Check failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setAtsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Milestone 07: Skill Gap Analyzer Handler
  // ----------------------------------------------------
  const handleRunSkillGap = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your PDF resume in the Overview section first.");
      scrollToSection("overview");
      return;
    }
    if (!gapJobDescription.trim()) {
      alert("Please paste the target job description.");
      return;
    }

    setGapLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", gapJobDescription.trim());

      const res = await axios.post(`${API_URL}/analyze-skill-gap`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setGapResult(res.data);
    } catch (err) {
      alert("Skill Gap Analysis failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setGapLoading(false);
    }
  };

  const checkBackend = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setStatus(response.data.status || "Connected");
    } catch {
      setStatus("Not connected");
    }
  };

  useEffect(() => {
    checkBackend();

    const sections = document.querySelectorAll(".page-section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id.replace("-section", "");
            setActiveSection(sectionId);
          }
        });
      },
      {
        rootMargin: "-25% 0px -60% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

// Resume Completion Score
const resumeFields = [
  resumeData.name,
  resumeData.email,
  resumeData.phone,
  resumeData.location,
  resumeData.summary,
  resumeData.degree,
  resumeData.college,
  resumeData.graduationYear,
  resumeData.skills,
  resumeData.projectName,
  resumeData.projectTech,
  resumeData.projectDescription,
  resumeData.experience,
];

const completedFields = resumeFields.filter(
  (field) => field.trim() !== ""
).length;

const resumeScore = Math.round(
  (completedFields / resumeFields.length) * 100
);

  const scrollToSection = (id) => {
    setActiveSection(id);

    document.getElementById(`${id}-section`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const handleDownloadResume = () => {
  if (!resumeData.name.trim()) {
    alert("Please enter your name first.");
    return;
  }

  const doc = new jsPDF();

  let y = 20;
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  const addText = (text, size = 10, bold = false) => {
    if (!text) return;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);

    const lines = doc.splitTextToSize(String(text), contentWidth);

    if (y + lines.length * 6 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, margin, y);
    y += lines.length * 6;
  };

  addText(resumeData.name, 20, true);
  addText(
    [resumeData.email, resumeData.phone, resumeData.location]
      .filter(Boolean).join(" | ")
  );

  addText("PROFESSIONAL SUMMARY", 13, true);
  addText(resumeData.summary);

  addText("EDUCATION", 13, true);
  addText([
    resumeData.degree,
    resumeData.college,
    resumeData.graduationYear,
    resumeData.cgpa
  ].filter(Boolean).join(" | "));

  addText("TECHNICAL SKILLS", 13, true);
  addText(resumeData.skills);

  addText("PROJECTS", 13, true);
  addText(resumeData.projectName, 11, true);
  addText(resumeData.projectTech);
  addText(resumeData.projectDescription);

  addText("EXPERIENCE", 13, true);
  addText(resumeData.experience);

  doc.save("My_Resume.pdf");
};
  const handleFileChange = (event) => {
  const selectedFile = event.target.files?.[0] || null;

  if (!selectedFile) {
    setFile(null);
    setAnalysis(null);
    setJobMatches([]);
    setInterviewData(null);
    setFilename("");
    setMatchFilename("");
    setInterviewFilename("");
    setError("");
    return;
  }

  // Check PDF format
  if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
    setFile(null);
    setError("Invalid file. Please upload a PDF resume.");
    return;
  }

  // Maximum file size: 5 MB
  if (selectedFile.size > 5 * 1024 * 1024) {
    setFile(null);
    setError("File is too large. Maximum allowed size is 5 MB.");
    return;
  }

  setFile(selectedFile);
  setAnalysis(null);
  setJobMatches([]);
  setInterviewData(null);
  setFilename("");
  setMatchFilename("");
  setInterviewFilename("");
  setError("");
};

  const validateResume = () => {
    if (!file) {
      setError("Please upload your PDF resume first.");
      return false;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return false;
    }

    return true;
  };

  // Resume Analyzer
  const analyzeResume = async (event) => {
    event.preventDefault();
    setError("");
    setAnalysis(null);
    setFilename("");

    if (!validateResume()) return;

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/analyze-resume`,
        formData
      );

      setAnalysis(response.data.analysis);
      setFilename(response.data.filename);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Resume analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Job Matcher
  const matchJobs = async (event) => {
    event.preventDefault();
    setError("");
    setJobMatches([]);
    setMatchFilename("");

    if (!validateResume()) return;

    if (!jobDescriptions.trim()) {
      setError("Please enter at least one job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_descriptions", jobDescriptions);

    try {
      setMatchLoading(true);
      const response = await axios.post(
        `${API_URL}/match-jobs`,
        formData
      );

      setJobMatches(response.data.analysis.matches || []);
      setMatchFilename(response.data.filename);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Job matching failed. Please try again."
      );
    } finally {
      setMatchLoading(false);
    }
  };

  // Interview Preparation
  const generateInterview = async (event) => {
    event.preventDefault();
    setError("");
    setInterviewData(null);
    setInterviewFilename("");

    if (!validateResume()) return;

    if (!interviewJobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", interviewJobDescription);

    try {
      setInterviewLoading(true);
      const response = await axios.post(
        `${API_URL}/generate-interview`,
        formData
      );

      setInterviewData(response.data.interview);
      setInterviewFilename(response.data.filename);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Interview generation failed. Please try again."
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  // Reusable interview question display with Interactive AI Answer Evaluation (Milestone 06)
  const renderQuestions = (questions, category, categoryType = "technical") => {
    if (!questions || questions.length === 0) {
      return <p className="empty-message">No questions available.</p>;
    }

    return (
      <div className="analysis-card">
        <h3>{category}</h3>

        {questions.map((item, index) => {
          const key = `${categoryType}-${index}`;
          const isPracticeOpen = openPractice[key];
          const evaluation = evaluations[key];
          const isLoading = evalLoading[key];

          return (
            <div className="interview-question-wrapper" key={index} style={{ marginBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <details className="interview-question">
                <summary>
                  <strong>
                    {index + 1}. {item.question}
                  </strong>
                  {item.topic && <span className="score-label">{item.topic}</span>}
                  {evaluation && (
                    <span
                      className={`eval-score-badge ${
                        evaluation.score >= 8 ? "high" : evaluation.score >= 6 ? "medium" : "low"
                      }`}
                      style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 8px" }}
                    >
                      ⭐ {evaluation.score}/10
                    </span>
                  )}
                </summary>

                <div className="interview-answer">
                  <h4>Sample Answer</h4>
                  <p>{item.sample_answer}</p>

                  {item.follow_up_questions?.length > 0 && (
                    <>
                      <h4>Follow-up Questions</h4>
                      <ul>
                        {item.follow_up_questions.map((question, i) => (
                          <li key={i}>{question}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </details>

              {/* Interactive Practice & Evaluation Workspace */}
              <div style={{ padding: "0 10px 14px 10px" }}>
                <button
                  type="button"
                  className="interview-practice-toggle"
                  onClick={() =>
                    setOpenPractice((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  <span>{isPracticeOpen ? "▲ Hide Practice Area" : "🎤 Practice & Evaluate Your Answer"}</span>
                </button>

                {isPracticeOpen && (
                  <div className="practice-workspace">
                    <label style={{ fontSize: "12px", fontWeight: "650", color: "#334155" }}>
                      Your Answer (Type or speak what you would say to the interviewer):
                    </label>
                    <textarea
                      className="practice-textarea"
                      placeholder={`Draft your answer here...\n• Use STAR method (Situation, Task, Action, Result) for behavioral questions\n• State core concepts, technical trade-offs, and examples for technical questions`}
                      value={userAnswers[key] || ""}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="practice-submit-btn"
                        disabled={isLoading}
                        onClick={() =>
                          handleEvaluateAnswer(key, item.question, categoryType, item.topic)
                        }
                      >
                        {isLoading ? (
                          <>
                            <span className="loader" style={{ width: "14px", height: "14px" }}></span>
                            AI is evaluating your answer...
                          </>
                        ) : (
                          "⚡ Submit Answer for AI Evaluation"
                        )}
                      </button>

                      {evaluation && (
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
                          ✓ Evaluated! Score: {evaluation.score} / 10 ({evaluation.verdict})
                        </span>
                      )}
                    </div>

                    {/* AI Evaluation Report Card */}
                    {evaluation && (
                      <div className="eval-report-card">
                        <div className="eval-score-header">
                          <div>
                            <span className="eyebrow">AI EVALUATOR SCORECARD</span>
                            <h4 style={{ fontSize: "16px", color: "#0f172a", marginTop: "2px" }}>
                              {evaluation.verdict}
                            </h4>
                          </div>
                          <div
                            className={`eval-score-badge ${
                              evaluation.score >= 8
                                ? "high"
                                : evaluation.score >= 6
                                ? "medium"
                                : "low"
                            }`}
                          >
                            ⭐ {evaluation.score} / 10
                          </div>
                        </div>

                        <p className="eval-feedback-text">{evaluation.feedback}</p>

                        <div className="eval-columns">
                          <div className="eval-box strengths">
                            <h5>✓ Key Strengths</h5>
                            <ul>
                              {evaluation.strengths.map((str, i) => (
                                <li key={i}>{str}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="eval-box improvements">
                            <h5>▲ Areas to Improve</h5>
                            <ul>
                              {evaluation.improvements.map((imp, i) => (
                                <li key={i}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {evaluation.star_breakdown && (
                          <div className="eval-star-grid">
                            <div className="star-quadrant">
                              <strong>Situation:</strong>
                              <span>{evaluation.star_breakdown.situation || "N/A"}</span>
                            </div>
                            <div className="star-quadrant">
                              <strong>Task:</strong>
                              <span>{evaluation.star_breakdown.task || "N/A"}</span>
                            </div>
                            <div className="star-quadrant">
                              <strong>Action:</strong>
                              <span>{evaluation.star_breakdown.action || "N/A"}</span>
                            </div>
                            <div className="star-quadrant">
                              <strong>Result:</strong>
                              <span>{evaluation.star_breakdown.result || "N/A"}</span>
                            </div>
                          </div>
                        )}

                        {evaluation.model_answer && (
                          <div className="eval-model-answer">
                            <h5>💡 Ideal / Model Answer Reference</h5>
                            <p>{evaluation.model_answer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "resume", label: "Resume Analyzer", icon: "▤" },
    { id: "coach", label: "AI Resume Coach", icon: "✨" },
    { id: "ats", label: "ATS Checker", icon: "🛡️" },
    { id: "gap", label: "Skill Gap Analyzer", icon: "🎯" },
    { id: "matcher", label: "Job Matcher", icon: "⌕" },
    { id: "interview", label: "Interview Prep", icon: "◎" },
    { id: "tracker", label: "Job Tracker", icon: "📋" },
    { id: "builder", label: "Resume Builder", icon: "✎" },
  ];

  return (
    <div className="app">
      {/* Fixed Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">C</div>
          <div>
            <h2>CareerPilot AI</h2>
            <span>CAREER COPILOT</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={activeSection === item.id ? "active" : ""}
                onClick={() => scrollToSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span
              className={`status-dot ${
                status === "Not connected" ? "offline" : ""
              }`}
            ></span>
            <div>
              <strong>Backend status</strong>
              <p>{status}</p>
            </div>
          </div>

          <button className="connection-button" onClick={checkBackend}>
            ↻ Check connection
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-layout">
        <header className="topbar">
          <div>
            <span className="topbar-label">AI JOB APPLICATION COPILOT</span>
            <h1>Career Dashboard</h1>
          </div>

          <div className="topbar-right">
            <span className="topbar-status">
              <span
                className={`status-dot ${
                  status === "Not connected" ? "offline" : ""
                }`}
              ></span>
              {status}
            </span>

            {user ? (
              <div className="user-profile-menu">
                <div className="user-badge">
                  <div className="user-avatar">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.full_name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="auth-logout-button"
                  onClick={handleLogout}
                  title="Sign out of your account"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="auth-login-button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setShowAuthModal(true);
                }}
              >
                <span>🔐</span> Sign In / Register
              </button>
            )}
          </div>
        </header>

        <main className="container">
          {/* Overview */}
          <section id="overview-section" className="page-section">
            <div className="hero">
              <div>
                <span className="eyebrow">YOUR CAREER, POWERED BY AI</span>
                <h2>Build your next career move.</h2>
                <p>
                  Analyze your resume, discover matching jobs, and prepare
                  confidently for interviews — all in one place.
                </p>
              </div>
            </div>
            
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon blue">📄</div>
    <div>
      <p>Resume status</p>
      <h3>{file ? "Uploaded" : "Not uploaded"}</h3>
      <span>{file ? "PDF ready for analysis" : "Upload to get started"}</span>
    </div>
  </div>

  <div className="stat-card">
    <div className="stat-icon purple">⚡</div>
    <div>
      <p>AI tools available</p>
      <h3>03</h3>
      <span>Ready to help your career</span>
    </div>
  </div>

  <div className="stat-card">
    <div className="stat-icon green">✓</div>
    <div>
      <p>Backend connection</p>
      <h3>{status === "Not connected" ? "Offline" : "Connected"}</h3>
      <span>AI service status</span>
    </div>
  </div>
  <div className="stat-card">
  <div className="stat-icon blue">📊</div>

  <div>
    <p>Resume completion</p>
    <h3>{resumeScore}%</h3>
    <span>
      {completedFields} of {resumeFields.length} fields completed
    </span>

    <div className="completion-bar">
      <div
        className="completion-progress"
        style={{ width: `${resumeScore}%` }}
      ></div> 
    </div>
  </div>
</div>

  <div className="stat-card">
    <div className="stat-icon purple">🗄️</div>
    <div>
      <p>Cloud Database</p>
      <h3>{user ? `${savedResumes.length} Saved` : "Guest"}</h3>
      <span>{user ? `Connected: ${user.full_name}` : "Sign in to save progress"}</span>
    </div>
  </div>
</div>
    
            <div className="dashboard">
              <button
                className="feature-card"
                onClick={() => scrollToSection("resume")}
              >
                <div className="feature-icon blue">▤</div>
                <span className="feature-tag">01 / ANALYZE</span>
                <h3>Resume Analyzer</h3>
                <p>
                  Discover your resume strengths, missing skills, and
                  improvement areas.
                </p>
                <span className="feature-link">Analyze resume <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("coach")}
              >
                <div className="feature-icon blue">✨</div>
                <span className="feature-tag">01 / COACH</span>
                <h3>AI Resume Coach</h3>
                <p>
                  Rewrite weak bullet points using high-impact action verbs and the Google XYZ formula.
                </p>
                <span className="feature-link">Polish descriptions <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("ats")}
              >
                <div className="feature-icon purple">🛡️</div>
                <span className="feature-tag">02 / ATS AUDIT</span>
                <h3>ATS Checker</h3>
                <p>
                  Score formatting, keyword density, and missing requirements against ATS screeners.
                </p>
                <span className="feature-link">Check ATS score <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("gap")}
              >
                <div className="feature-icon blue">🎯</div>
                <span className="feature-tag">07 / ROADMAP</span>
                <h3>Skill Gap Analyzer</h3>
                <p>
                  Compare target job competencies and follow a 4-week tailored learning curriculum.
                </p>
                <span className="feature-link">Analyze gaps <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("matcher")}
              >
                <div className="feature-icon purple">⌕</div>
                <span className="feature-tag">02 / DISCOVER</span>
                <h3>Job Matcher</h3>
                <p>
                  Compare your profile against multiple job descriptions and
                  find suitable roles.
                </p>
                <span className="feature-link">Find matching jobs <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("interview")}
              >
                <div className="feature-icon green">◎</div>
                <span className="feature-tag">06 / SIMULATE</span>
                <h3>AI Mock Interview</h3>
                <p>
                  Practice technical and HR questions with interactive live grading and STAR critique.
                </p>
                <span className="feature-link">Practice interview <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("tracker")}
              >
                <div className="feature-icon purple">📋</div>
                <span className="feature-tag">05 / TRACK</span>
                <h3>Job Application Tracker</h3>
                <p>
                  Track applications across stages, manage interview schedules, and monitor your career pipeline.
                </p>
                <span className="feature-link">Track jobs <span>→</span></span>
              </button>

              <button
                className="feature-card"
                onClick={() => scrollToSection("builder")}
              >
                <div className="feature-icon green">✎</div>
                <span className="feature-tag">04 / BUILD</span>
                <h3>Resume Builder & PDF</h3>
                <p>
                  Craft a polished resume, save versions to your cloud database, and download print-ready PDF.
                </p>
                <span className="feature-link">Build resume <span>→</span></span>
              </button>
            </div>

            {/* Shared Resume Upload */}
            <section className="panel upload-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">GET STARTED</span>
                  <h2>Your resume</h2>
                  <p>
                    Upload your PDF once. All three AI tools will use the same
                    resume.
                  </p>
                </div>
                <div className="upload-heading-icon">↑</div>
              </div>

              <label
  className="upload-area"
  htmlFor="resume"
  onDragOver={(event) => {
    event.preventDefault();
  }}
  onDrop={(event) => {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileChange({
        target: {
          files: [droppedFile],
        },
      });
    }
  }}
>
  <div className="upload-icon">↑</div>

  <strong>
    {file ? "Choose a different resume" : "Upload your resume"}
  </strong>

  <span>Drag and drop your PDF here, or click to browse</span>

  <input
    id="resume"
    type="file"
    accept=".pdf,application/pdf"
    onChange={handleFileChange}
  />
</label>

              {file && (
  <div className="selected-file">
    <span className="file-icon">PDF</span>

    <div className="selected-file-info">
      <strong>{file.name}</strong>
      <p>Resume ready to use</p>
    </div>

    <span className="file-check">✓</span>

    <button
      type="button"
      className="remove-file-button"
      onClick={() => handleFileChange({ target: { files: [] } })}
    >
      Remove
    </button>
  </div>
)}
            </section>
          </section>

          {/* Common Error */}
          {error && (
            <div className="error">
              <strong>Something went wrong</strong>
              <p>{error}</p>
              <button type="button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}

          {/* Resume Analyzer */}
          <section id="resume-section" className="page-section feature-section">
            <div className="page-heading">
              <span className="eyebrow">01 / ANALYZE</span>
              <h2>AI Resume Analyzer</h2>
              <p>
                Understand how well your resume matches a particular job
                description.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">
                <div className="feature-icon blue">▤</div>
                <div>
                  <h3>Analyze your resume</h3>
                  <p>Provide the job description to get your analysis.</p>
                </div>
              </div>

              <div className="resume-reminder">
                <span>PDF</span>
                <div>
                  <strong>{file ? file.name : "No resume uploaded"}</strong>
                  <p>
                    {file
                      ? "This resume will be used for analysis."
                      : "Upload your resume in the Overview section first."}
                  </p>
                </div>
              </div>

              <form onSubmit={analyzeResume} className="feature-form">
                <label htmlFor="job-description">Job description</label>
                <textarea
                  id="job-description"
                  rows="7"
                  placeholder="Paste the complete job description here..."
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Analyzing your resume..." : "Analyze my resume →"}
                </button>
              </form>

              {loading && (
                <div className="loading">
                  <span className="loader"></span>
                  AI is analyzing your resume. Please wait...
                </div>
              )}
            </div>

            {analysis && (
              <div className="panel result-panel">
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">YOUR RESULTS</span>
                    <h2>Resume analysis</h2>
                    <p>Analyzed file: {filename}</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setAnalysis(null)}
                  >
                    Clear results
                  </button>
                </div>

                <div className="score-section">
                  <div
                    className="score-circle"
                    style={{
                      background: `conic-gradient(#2563eb ${analysis.match_score}%, #e8edf5 0)`,
                    }}
                  >
                    <div className="score-inner">
                      <h2>{analysis.match_score}</h2>
                      <span>/100</span>
                    </div>
                  </div>
                  <div className="score-info">
                    <h3>Resume match score</h3>
                    <p>{analysis.score_explanation}</p>
                    <span className="score-label">
                      AI estimated compatibility
                    </span>
                  </div>
                </div>

                <div className="results-grid">
                  <div className="analysis-card">
                    <h3>✓ Matching skills</h3>
                    <div className="skill-list">
                      {analysis.matching_skills?.map((skill, index) => (
                        <span className="skill-badge matched" key={index}>
                          {skill}
                        </span>
                      ))}
                      {analysis.matching_skills?.length === 0 && (
                        <p>No matching skills identified.</p>
                      )}
                    </div>
                  </div>

                  <div className="analysis-card">
                    <h3>! Missing skills</h3>
                    <div className="skill-list">
                      {analysis.missing_skills?.map((skill, index) => (
                        <span className="skill-badge missing" key={index}>
                          {skill}
                        </span>
                      ))}
                      {analysis.missing_skills?.length === 0 && (
                        <p>No missing skills identified.</p>
                      )}
                    </div>
                  </div>

                  <div className="analysis-card">
                    <h3>Resume strengths</h3>
                    <ul>
                      {analysis.strengths?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-card">
                    <h3>Improvement suggestions</h3>
                    <ul>
                      {analysis.improvement_suggestions?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-card full-width">
                    <h3>Recommended keywords</h3>
                    <div className="skill-list">
                      {analysis.keyword_suggestions?.map((keyword, index) => (
                        <span className="skill-badge keyword" key={index}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 01 AI Resume Coach */}
          <section id="coach-section" className="page-section feature-section">
            <div className="page-heading">
              <span className="eyebrow">01 / COACH & REWRITE</span>
              <h2>AI Resume Coach</h2>
              <p>
                Transform weak, passive bullet points into high-impact descriptions using the Google XYZ formula and quantifiable metrics.
              </p>
            </div>

            <div className="coach-input-panel">
              <div className="panel-title">
                <div className="feature-icon blue">✨</div>
                <div>
                  <h3>Bullet Point & Description Polisher</h3>
                  <p>Paste any bullet point or project sentence to generate recruiter-ready versions.</p>
                </div>
              </div>

              <form onSubmit={handleCoachBullet} className="feature-form">
                <label>Raw Bullet Point / Work Description *</label>
                <textarea
                  rows="3"
                  className="practice-textarea"
                  required
                  placeholder="e.g. Worked on the website frontend and fixed some bugs to make it load faster..."
                  value={coachBullet}
                  onChange={(e) => setCoachBullet(e.target.value)}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                  <div className="auth-field">
                    <label>Target Role (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={coachTargetRole}
                      onChange={(e) => setCoachTargetRole(e.target.value)}
                    />
                  </div>
                  <div className="auth-field">
                    <label>Target Company (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Stripe, Tech Startups"
                      value={coachTargetCompany}
                      onChange={(e) => setCoachTargetCompany(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={coachLoading} style={{ marginTop: "14px" }}>
                  {coachLoading ? "Coaching & Polishing..." : "✨ Optimize Description with AI →"}
                </button>
              </form>

              {coachLoading && (
                <div className="loading">
                  <span className="loader"></span>
                  AI Resume Coach is rewriting your description with high-impact metrics...
                </div>
              )}
            </div>

            {coachResult && (
              <div className="panel result-panel">
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">RECRUITER-READY REWRITES</span>
                    <h2>Polished Description Options</h2>
                    <p>Original: "{coachResult.original}"</p>
                  </div>
                  <button className="secondary-button" onClick={() => setCoachResult(null)}>
                    Clear
                  </button>
                </div>

                <div className="coach-suggestions-grid">
                  {coachResult.suggestions.map((s, idx) => (
                    <div className="coach-card" key={idx}>
                      <div>
                        <div className="coach-card-header">
                          <span className="coach-version-badge">{s.version_name}</span>
                          <span className="power-verb-badge">Verb: {s.power_verb}</span>
                        </div>
                        <p className="coach-bullet-text">"{s.text}"</p>
                        <div className="coach-metrics-box">
                          📈 <strong>Metric Added:</strong> {s.metrics_added}
                        </div>
                        <p className="coach-why-better">💡 {s.why_better}</p>
                      </div>

                      <div className="coach-actions">
                        <button
                          type="button"
                          className="coach-copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(s.text);
                            alert("Copied polished bullet to clipboard!");
                          }}
                        >
                          📋 Copy
                        </button>
                        <button
                          type="button"
                          className="coach-apply-btn"
                          onClick={() => handleApplyCoachBullet(s.text)}
                        >
                          ✎ Apply to Builder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {coachResult.general_tips?.length > 0 && (
                  <div style={{ marginTop: "24px", background: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "750", color: "#1e293b", marginBottom: "8px" }}>
                      💡 Pro Coaching Tips
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                      {coachResult.general_tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 02 ATS Compatibility Checker */}
          <section id="ats-section" className="page-section feature-section">
            <div className="page-heading">
              <span className="eyebrow">02 / ATS COMPATIBILITY</span>
              <h2>ATS Compatibility Checker</h2>
              <p>
                Audit your resume layout, keyword density, section headers, and missing job requirements against recruiter ATS parsers.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">
                <div className="feature-icon purple">🛡️</div>
                <div>
                  <h3>Run Full ATS Audit</h3>
                  <p>Check if your resume can pass automated Applicant Tracking Systems.</p>
                </div>
              </div>

              <div className="resume-reminder">
                <span>PDF</span>
                <div>
                  <strong>{file ? file.name : "No resume uploaded"}</strong>
                  <p>
                    {file
                      ? "Your uploaded resume is ready for ATS audit."
                      : "Upload your resume in the Overview section first."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunAtsCheck} className="feature-form">
                <label>Job Description & Requirements *</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Paste the target job description to check keyword alignment and compliance..."
                  value={atsJobDescription}
                  onChange={(e) => setAtsJobDescription(e.target.value)}
                />

                <button type="submit" disabled={atsLoading}>
                  {atsLoading ? "Auditing ATS Compatibility..." : "🛡️ Run ATS Compatibility Scan →"}
                </button>
              </form>

              {atsLoading && (
                <div className="loading">
                  <span className="loader"></span>
                  Scanning formatting, headers, keyword density, and ATS passability...
                </div>
              )}
            </div>

            {atsResult && (
              <div className="panel result-panel">
                <div className="ats-score-card">
                  <div className="ats-score-circle-group">
                    <div className="ats-score-number">{atsResult.ats_score}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="ats-grade-pill">Grade {atsResult.grade}</span>
                        <span style={{ fontSize: "14px", color: "#94a3b8" }}>/ 100 Overall ATS Score</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "6px" }}>
                        {atsResult.ats_score >= 80
                          ? "Excellent! Your resume has high likelihood of passing corporate ATS screening."
                          : atsResult.ats_score >= 65
                          ? "Good base, but addressing missing keywords and formatting issues will boost callback rates."
                          : "Needs immediate optimization. Several critical ATS filters and keywords were missed."}
                      </p>
                    </div>
                  </div>

                  <div className="ats-subscores-grid" style={{ width: "100%" }}>
                    <div className="ats-subscore-item">
                      <span>Formatting Score</span>
                      <strong>{atsResult.formatting_score}%</strong>
                    </div>
                    <div className="ats-subscore-item">
                      <span>Keyword Density</span>
                      <strong>{atsResult.keyword_score}%</strong>
                    </div>
                    <div className="ats-subscore-item">
                      <span>Content Quality</span>
                      <strong>{atsResult.content_score}%</strong>
                    </div>
                  </div>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-card">
                    <h3>⚠️ Actionable Fixes Checklist</h3>
                    <div className="ats-checklist-group">
                      {atsResult.action_checklist.map((item, idx) => (
                        <div className="ats-checklist-item" key={idx}>
                          <span className={`priority-tag ${item.priority.toLowerCase()}`}>
                            {item.priority}
                          </span>
                          <span>{item.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analysis-card">
                    <h3>🔍 Missing Critical Keywords</h3>
                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                      Add these keywords into your skills and project descriptions:
                    </p>
                    <div className="keyword-chips-container">
                      {atsResult.missing_critical_keywords.map((kw, i) => (
                        <span className="keyword-chip missing" key={i}>
                          ✗ {kw}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ marginTop: "20px" }}>✓ Matched ATS Keywords</h3>
                    <div className="keyword-chips-container">
                      {atsResult.matching_keywords.map((kw, i) => (
                        <span className="keyword-chip matched" key={i}>
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 07 Skill Gap Analyzer */}
          <section id="gap-section" className="page-section feature-section">
            <div className="page-heading">
              <span className="eyebrow">07 / SKILL GAP & ROADMAP</span>
              <h2>Skill Gap Analyzer & Roadmap</h2>
              <p>
                Identify exactly which technical and soft skills you are missing, and follow a personalized 4-week learning curriculum.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">
                <div className="feature-icon blue">🎯</div>
                <div>
                  <h3>Analyze Target Role Gaps</h3>
                  <p>Compare your current resume with any desired job description.</p>
                </div>
              </div>

              <div className="resume-reminder">
                <span>PDF</span>
                <div>
                  <strong>{file ? file.name : "No resume uploaded"}</strong>
                  <p>
                    {file
                      ? "Your uploaded resume is ready for skill gap comparison."
                      : "Upload your resume in the Overview section first."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunSkillGap} className="feature-form">
                <label>Target Job Requirements *</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Paste the target job requirements to generate a gap breakdown and tailored 4-week roadmap..."
                  value={gapJobDescription}
                  onChange={(e) => setGapJobDescription(e.target.value)}
                />

                <button type="submit" disabled={gapLoading}>
                  {gapLoading ? "Analyzing Skill Gaps..." : "🎯 Analyze Skill Gaps & Build Roadmap →"}
                </button>
              </form>

              {gapLoading && (
                <div className="loading">
                  <span className="loader"></span>
                  Comparing competencies, finding missing frameworks, and structuring curriculum...
                </div>
              )}
            </div>

            {gapResult && (
              <div className="panel result-panel">
                <div className="skill-gap-overview">
                  <span className="eyebrow">EXECUTIVE SKILL MATCH</span>
                  <div className="skill-gap-meter-container">
                    <strong style={{ fontSize: "28px", color: "#0f172a" }}>
                      {gapResult.match_percentage}%
                    </strong>
                    <div className="skill-gap-meter-bar">
                      <div
                        className="skill-gap-meter-fill"
                        style={{ width: `${gapResult.match_percentage}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "650", color: "#2563eb" }}>
                      ~{gapResult.estimated_weeks_to_ready} Weeks to Job-Ready
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                    {gapResult.executive_summary}
                  </p>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-card">
                    <h3>🚨 Critical Skill Gaps (Must-Haves)</h3>
                    <div className="keyword-chips-container">
                      {gapResult.critical_missing_skills.map((skill, i) => (
                        <span className="keyword-chip missing" key={i}>
                          ! {skill}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ marginTop: "18px" }}>📦 Tools & Frameworks to Learn</h3>
                    <div className="keyword-chips-container">
                      {gapResult.tools_and_frameworks_missing.map((tool, i) => (
                        <span className="skill-badge keyword" key={i}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="analysis-card">
                    <h3>✓ Your Matching Competencies</h3>
                    <div className="keyword-chips-container">
                      {gapResult.matching_skills.map((skill, i) => (
                        <span className="keyword-chip matched" key={i}>
                          ✓ {skill}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ marginTop: "18px" }}>🤝 Soft Skills & Collaboration</h3>
                    <div className="keyword-chips-container">
                      {gapResult.soft_skills_missing.map((soft, i) => (
                        <span className="skill-badge missing" key={i}>
                          • {soft}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">STRUCTURED CURRICULUM</span>
                      <h2>Your Personalized 4-Week Learning Roadmap</h2>
                    </div>
                  </div>

                  <div className="roadmap-weeks-container">
                    {gapResult.roadmap.map((week) => (
                      <div className="roadmap-week-card" key={week.week_number}>
                        <div className="roadmap-week-header">
                          <span className="week-badge">Week {week.week_number}</span>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{week.theme}</strong>
                        </div>

                        <div style={{ fontSize: "13px", color: "#475569", margin: "8px 0" }}>
                          <strong>Topics:</strong> {week.topics.join(" • ")}
                        </div>

                        <div className="roadmap-project-box">
                          🛠️ <strong>Portfolio Project:</strong> {week.recommended_project}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Job Matcher */}
          <section id="matcher-section" className="page-section feature-section">
            <div className="page-heading">
              <span className="eyebrow">02 / DISCOVER</span>
              <h2>AI Job Matcher</h2>
              <p>
                Compare your resume with multiple opportunities and find your
                strongest matches.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">
                <div className="feature-icon purple">⌕</div>
                <div>
                  <h3>Find matching opportunities</h3>
                  <p>Enter multiple job descriptions below.</p>
                </div>
              </div>

              <div className="resume-reminder">
                <span>PDF</span>
                <div>
                  <strong>{file ? file.name : "No resume uploaded"}</strong>
                  <p>
                    {file
                      ? "Your uploaded resume is ready."
                      : "Upload your resume in the Overview section first."}
                  </p>
                </div>
              </div>

              <form onSubmit={matchJobs} className="feature-form">
                <label htmlFor="job-descriptions">
                  Multiple job descriptions
                </label>
                <textarea
                  id="job-descriptions"
                  rows="12"
                  placeholder={`Job 1: Java Developer
Required skills: Java, DSA, OOP, SQL, Spring Boot.

---

Job 2: React Developer
Required skills: JavaScript, React, HTML, CSS, Node.js.

---

Job 3: Data Analyst
Required skills: Python, SQL, Excel, Power BI, Statistics.`}
                  value={jobDescriptions}
                  onChange={(event) => setJobDescriptions(event.target.value)}
                />
                <p className="helper-text">
                  Separate each job description using three hyphens: ---
                </p>

                <button type="submit" disabled={matchLoading}>
                  {matchLoading ? "Matching jobs..." : "Find my best jobs →"}
                </button>
              </form>

              {matchLoading && (
                <div className="loading">
                  <span className="loader"></span>
                  AI is comparing your resume with the jobs...
                </div>
              )}
            </div>

            {jobMatches.length > 0 && (
              <div className="panel result-panel">
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">YOUR RESULTS</span>
                    <h2>Job matching results</h2>
                    <p>
                      Resume: {matchFilename} · {jobMatches.length} opportunities
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setJobMatches([])}
                  >
                    Clear results
                  </button>
                </div>

                {jobMatches.map((job, index) => (
                  <div className="job-result-card" key={index}>
                    <div className="job-result-header">
                      <div>
                        <span className="job-rank">#{index + 1} Best match</span>
                        <h3>{job.job_title}</h3>
                        <span className="score-label">
                          AI estimated compatibility
                        </span>
                      </div>

                      <div
                        className="job-score"
                        style={{
                          background: `conic-gradient(#2563eb ${job.match_score}%, #e8edf5 0)`,
                        }}
                      >
                        <div className="job-score-inner">
                          <strong>{job.match_score}</strong>
                          <span>/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="results-grid">
                      <div className="analysis-card">
                        <h4>Matching skills</h4>
                        <div className="skill-list">
                          {job.matching_skills?.map((skill, i) => (
                            <span className="skill-badge matched" key={i}>
                              {skill}
                            </span>
                          ))}
                        </div>
                        {job.matching_skills?.length === 0 && (
                          <p>No matching skills identified.</p>
                        )}
                      </div>

                      <div className="analysis-card">
                        <h4>Missing skills</h4>
                        <div className="skill-list">
                          {job.missing_skills?.map((skill, i) => (
                            <span className="skill-badge missing" key={i}>
                              {skill}
                            </span>
                          ))}
                        </div>
                        {job.missing_skills?.length === 0 && (
                          <p>No major skill gaps identified.</p>
                        )}
                      </div>

                      <div className="analysis-card">
                        <h4>Why you are suitable</h4>
                        <ul>
                          {job.why_suitable?.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="analysis-card">
                        <h4>Skills to improve</h4>
                        <ul>
                          {job.skills_to_improve?.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Interview Preparation */}
          <section
            id="interview-section"
            className="page-section feature-section"
          >
            <div className="page-heading">
              <span className="eyebrow">03 / PREPARE</span>
              <h2>AI Interview Preparation</h2>
              <p>
                Practice personalized technical, resume-based, and HR
                interview questions.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">
                <div className="feature-icon green">◎</div>
                <div>
                  <h3>Prepare for your interview</h3>
                  <p>
                    Get questions based on your resume and target job role.
                  </p>
                </div>
              </div>

              <div className="resume-reminder">
                <span>PDF</span>
                <div>
                  <strong>{file ? file.name : "No resume uploaded"}</strong>
                  <p>
                    {file
                      ? "Your uploaded resume is ready."
                      : "Upload your resume in the Overview section first."}
                  </p>
                </div>
              </div>

              <form onSubmit={generateInterview} className="feature-form">
                <label htmlFor="interview-job-description">
                  Target job description
                </label>
                <textarea
                  id="interview-job-description"
                  rows="8"
                  placeholder={`Software Development Engineer

Required skills:
Java, Data Structures and Algorithms, OOP,
DBMS, SQL, JavaScript, React and problem solving.

Responsibilities:
Develop software applications, write clean code,
solve programming problems and work with development teams.`}
                  value={interviewJobDescription}
                  onChange={(event) =>
                    setInterviewJobDescription(event.target.value)
                  }
                />

                <button type="submit" disabled={interviewLoading}>
                  {interviewLoading
                    ? "Generating questions..."
                    : "Generate interview questions →"}
                </button>
              </form>

              {interviewLoading && (
                <div className="loading">
                  <span className="loader"></span>
                  AI is preparing your personalized interview...
                </div>
              )}
            </div>

            {interviewData && (
              <div className="panel result-panel">
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">YOUR PRACTICE SET</span>
                    <h2>Your personalized interview</h2>
                    <p>Resume: {interviewFilename}</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setInterviewData(null)}
                  >
                    Clear results
                  </button>
                </div>

                {/* Interview Performance Scorecard (Milestone 06) */}
                <div className="interview-stats-header">
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>AI Mock Interview Session</strong>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                      Click "Practice & Evaluate" on any question to test your verbal answers and receive immediate AI grading.
                    </p>
                  </div>
                  <div className="eval-summary-badges">
                    <div className="eval-counter-pill">
                      Questions: 15
                    </div>
                    <div className="eval-counter-pill" style={{ color: "#2563eb", borderColor: "#bfdbfe" }}>
                      Graded: {Object.keys(evaluations).length} / 15
                    </div>
                    {Object.keys(evaluations).length > 0 && (
                      <div className="eval-counter-pill" style={{ color: "#16a34a", borderColor: "#bbf7d0" }}>
                        Avg Score: {(
                          Object.values(evaluations).reduce((acc, curr) => acc + (curr.score || 0), 0) /
                          Object.keys(evaluations).length
                        ).toFixed(1)} / 10
                      </div>
                    )}
                  </div>
                </div>

                <p className="interview-instruction">
                  Expand a question to view its reference answer, or use the interactive practice area to submit your own answer for AI evaluation.
                </p>

                {renderQuestions(
                  interviewData.technical_questions,
                  "Technical Questions",
                  "tech"
                )}

                {renderQuestions(
                  interviewData.resume_questions,
                  "Resume and Project Questions",
                  "resume"
                )}

                {renderQuestions(
                  interviewData.hr_questions,
                  "HR and Behavioral Questions",
                  "hr"
                )}
              </div>
            )}
          </section>

          {/* Job Application Tracker (Milestone 05) */}
          <section id="tracker-section" className="page-section feature-section">
            <div className="page-heading">
              <span className="eyebrow">05 / TRACK</span>
              <h2>Job Application Tracker</h2>
              <p>
                Track your applications across every hiring stage, organize interviews, and monitor your job hunt in one place.
              </p>
            </div>

            <div className="tracker-stats-bar">
              <div className="tracker-stat-pill">
                <span>Total Applications</span>
                <strong>{applications.length}</strong>
              </div>
              <div className="tracker-stat-pill">
                <span>In Interview Stage</span>
                <strong style={{ color: "#7e22ce" }}>
                  {applications.filter((a) => a.status === "Interview").length}
                </strong>
              </div>
              <div className="tracker-stat-pill">
                <span>Offers Received</span>
                <strong style={{ color: "#15803d" }}>
                  {applications.filter((a) => a.status === "Offer").length}
                </strong>
              </div>
              <div className="tracker-stat-pill">
                <span>Active Pipeline</span>
                <strong style={{ color: "#2563eb" }}>
                  {applications.filter((a) => a.status !== "Rejected").length}
                </strong>
              </div>
            </div>

            <div className="tracker-controls">
              <div className="stage-filter-group">
                {["All", "Wishlist", "Applied", "Screening", "Interview", "Offer", "Rejected"].map((stage) => {
                  const count =
                    stage === "All"
                      ? applications.length
                      : applications.filter((a) => a.status === stage).length;
                  return (
                    <button
                      key={stage}
                      type="button"
                      className={`stage-filter-btn ${activeStageFilter === stage ? "active" : ""}`}
                      onClick={() => setActiveStageFilter(stage)}
                    >
                      {stage} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="add-app-btn"
                onClick={() => setShowAddAppModal(true)}
              >
                <span>+</span> Add New Application
              </button>
            </div>

            {applications.filter((a) => activeStageFilter === "All" || a.status === activeStageFilter).length === 0 ? (
              <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px" }}>
                  No job applications found in the <strong>{activeStageFilter}</strong> stage.
                </p>
                <button
                  type="button"
                  className="add-app-btn"
                  style={{ margin: "0 auto" }}
                  onClick={() => setShowAddAppModal(true)}
                >
                  <span>+</span> Add Your First Application
                </button>
              </div>
            ) : (
              <div className="applications-grid">
                {applications
                  .filter((a) => activeStageFilter === "All" || a.status === activeStageFilter)
                  .map((appItem) => (
                    <div className="app-card" key={appItem.id}>
                      <div>
                        <div className="app-card-header">
                          <div className="app-company-info">
                            <div className="app-avatar">
                              {appItem.company ? appItem.company.charAt(0).toUpperCase() : "J"}
                            </div>
                            <div className="app-title-group">
                              <h3>{appItem.company}</h3>
                              <p>{appItem.role}</p>
                            </div>
                          </div>
                          <span className={`app-stage-badge ${appItem.status.toLowerCase()}`}>
                            {appItem.status}
                          </span>
                        </div>

                        <div className="app-meta-list">
                          {appItem.location && (
                            <div className="app-meta-item">
                              <span>📍</span> {appItem.location}
                            </div>
                          )}
                          {appItem.salary_range && (
                            <div className="app-meta-item">
                              <span>💰</span> {appItem.salary_range}
                            </div>
                          )}
                          {appItem.applied_date && (
                            <div className="app-meta-item">
                              <span>📅</span> Applied: {appItem.applied_date}
                            </div>
                          )}
                          {appItem.next_interview_date && (
                            <div
                              className="app-meta-item"
                              style={{ color: "#7e22ce", fontWeight: "650" }}
                            >
                              <span>⚡</span> Next Interview: {appItem.next_interview_date}
                            </div>
                          )}
                        </div>

                        {appItem.notes && (
                          <div className="app-notes-box">
                            {appItem.notes}
                          </div>
                        )}
                      </div>

                      <div className="app-card-footer">
                        <select
                          className="stage-select-dropdown"
                          value={appItem.status}
                          onChange={(e) => handleUpdateAppStatus(appItem.id, e.target.value)}
                        >
                          <option value="Wishlist">Wishlist</option>
                          <option value="Applied">Applied</option>
                          <option value="Screening">Screening</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>

                        <div className="app-action-buttons">
                          <button
                            type="button"
                            className="prepare-interview-btn"
                            title="Generate personalized interview prep for this position"
                            onClick={() => handlePrepareInterviewForRole(appItem)}
                          >
                            🎯 Prep Interview
                          </button>
                          <button
                            type="button"
                            className="delete-app-btn"
                            title="Delete application"
                            onClick={() => handleDeleteApplication(appItem.id)}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
          {/* Resume Builder */}
<section
  id="builder-section"
  className="page-section feature-section"
>
  <div className="page-heading">
    <span className="eyebrow">04 / CREATE</span>
    <h2>AI Resume Builder</h2>
    <p>
      Create a professional resume using your personal details,
      education, skills and projects.
    </p>
  </div>

 <div className="resume-builder-layout">
  <div className="panel resume-form-panel">
    <h3>Personal Information</h3>

    <div className="resume-form-grid">
      <input
        placeholder="Full Name"
        value={resumeData.name}
        onChange={(e) =>
          setResumeData({ ...resumeData, name: e.target.value })
        }
      />

      <input
        placeholder="Email Address"
        value={resumeData.email}
        onChange={(e) =>
          setResumeData({ ...resumeData, email: e.target.value })
        }
      />

      <input
        placeholder="Phone Number"
        value={resumeData.phone}
        onChange={(e) =>
          setResumeData({ ...resumeData, phone: e.target.value })
        }
      />

      <input
        placeholder="Location"
        value={resumeData.location}
        onChange={(e) =>
          setResumeData({ ...resumeData, location: e.target.value })
        }
      />

      <input
        placeholder="LinkedIn URL"
        value={resumeData.linkedin}
        onChange={(e) =>
          setResumeData({ ...resumeData, linkedin: e.target.value })
        }
      />

      <input
        placeholder="GitHub URL"
        value={resumeData.github}
        onChange={(e) =>
          setResumeData({ ...resumeData, github: e.target.value })
        }
      />
    </div>

    <h3>Professional Summary</h3>

    <textarea
      rows="4"
      placeholder="Write a short professional introduction..."
      value={resumeData.summary}
      onChange={(e) =>
        setResumeData({ ...resumeData, summary: e.target.value })
      }
    />

    <h3>Education</h3>

    <div className="resume-form-grid">
      <input
        placeholder="Degree"
        value={resumeData.degree}
        onChange={(e) =>
          setResumeData({ ...resumeData, degree: e.target.value })
        }
      />

      <input
        placeholder="College / University"
        value={resumeData.college}
        onChange={(e) =>
          setResumeData({ ...resumeData, college: e.target.value })
        }
      />

      <input
        placeholder="Graduation Year"
        value={resumeData.graduationYear}
        onChange={(e) =>
          setResumeData({ ...resumeData, graduationYear: e.target.value })
        }
      />

      <input
        placeholder="CGPA"
        value={resumeData.cgpa}
        onChange={(e) =>
          setResumeData({ ...resumeData, cgpa: e.target.value })
        }
      />
    </div>

    <h3>Technical Skills</h3>

    <textarea
      rows="3"
      placeholder="Java, Python, SQL, React, HTML, CSS..."
      value={resumeData.skills}
      onChange={(e) =>
        setResumeData({ ...resumeData, skills: e.target.value })
      }
    />

    <h3>Project Details</h3>

    <input
      placeholder="Project Name"
      value={resumeData.projectName}
      onChange={(e) =>
        setResumeData({ ...resumeData, projectName: e.target.value })
      }
    />

    <input
      placeholder="Technologies Used"
      value={resumeData.projectTech}
      onChange={(e) =>
        setResumeData({ ...resumeData, projectTech: e.target.value })
      }
    />

    <textarea
      rows="4"
      placeholder="Describe your project and your contribution..."
      value={resumeData.projectDescription}
      onChange={(e) =>
        setResumeData({
          ...resumeData,
          projectDescription: e.target.value,
        })
      }
    />

    <h3>Experience / Internship</h3>

    <textarea
      rows="4"
      placeholder="Describe your internship or work experience..."
      value={resumeData.experience}
      onChange={(e) =>
        setResumeData({ ...resumeData, experience: e.target.value })
      }
    />
  </div>
    </div>

  {/* Live Resume Preview */}
  <div className="resume-preview-panel">
    {saveResumeSuccess && (
      <div className="cloud-success-toast">
        <span>✓</span> {saveResumeSuccess}
      </div>
    )}

    <div className="preview-heading">
      <div>
        <h3>Live Resume Preview</h3>
        <span>Updates automatically</span>
      </div>

      <div className="builder-actions-group">
        {user && savedResumes.length > 0 && (
          <select
            className="load-resume-select"
            onChange={(e) => {
              const found = savedResumes.find((r) => r.id === Number(e.target.value));
              if (found) handleLoadResume(found);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              📂 Load Saved Resume ({savedResumes.length})...
            </option>
            {savedResumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          className="save-resume-button"
          onClick={handleSaveResumeToDb}
          disabled={saveResumeLoading}
        >
          {saveResumeLoading ? "Saving..." : "💾 Save to Cloud"}
        </button>

        <button
          type="button"
          className="download-resume-button"
          onClick={handleDownloadResume}
        >
          ↓ Download PDF
        </button>
      </div>
    </div>

    <div className="resume-paper">
      <header className="resume-header">
        <h1>{resumeData.name || "Your Name"}</h1>

        <p>
          {[resumeData.email, resumeData.phone, resumeData.location]
            .filter(Boolean)
            .join(" | ")}
        </p>

        <p>
          {[resumeData.linkedin, resumeData.github]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </header>

      {resumeData.summary && (
        <div className="resume-preview-section">
          <h2>PROFESSIONAL SUMMARY</h2>
          <p>{resumeData.summary}</p>
        </div>
      )}

      {(resumeData.degree || resumeData.college) && (
        <div className="resume-preview-section">
          <h2>EDUCATION</h2>
          <h3>{resumeData.degree}</h3>
          <p>{resumeData.college}</p>
          <p>
            {resumeData.graduationYear}
            {resumeData.cgpa && ` | CGPA: ${resumeData.cgpa}`}
          </p>
        </div>
      )}

      {resumeData.skills && (
        <div className="resume-preview-section">
          <h2>TECHNICAL SKILLS</h2>
          <p>{resumeData.skills}</p>
        </div>
      )}

      {resumeData.projectName && (
        <div className="resume-preview-section">
          <h2>PROJECTS</h2>
          <h3>{resumeData.projectName}</h3>
          <p><strong>Technologies:</strong> {resumeData.projectTech}</p>
          <p>{resumeData.projectDescription}</p>
        </div>
      )}

      {resumeData.experience && (
        <div className="resume-preview-section">
          <h2>EXPERIENCE</h2>
          <p>{resumeData.experience}</p>
        </div>
      )}
    </div>
  </div>
</section>
          <footer className="footer">
            <strong>CareerPilot AI</strong>
            <span>AI-powered support for your career journey.</span>
          </footer>
        </main>
      </div>

      {/* Auth Modal Dialog (Sign In / Register) */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowAuthModal(false)}
            >
              ×
            </button>

            <div className="auth-modal-header">
              <div className="auth-icon-circle">🚀</div>
              <h2>{authMode === "signup" ? "Create your Account" : "Welcome Back"}</h2>
              <p>
                {authMode === "signup"
                  ? "Sign up to securely store your resumes, track job applications, and save AI interview logs."
                  : "Sign in to access your saved resumes and personalized career copilot history."}
              </p>
            </div>

            <div className="auth-tab-buttons">
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={authMode === "signup" ? "active" : ""}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                }}
              >
                Create Account
              </button>
            </div>

            {authError && <div className="auth-error-alert">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === "signup" && (
                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vansh Gour"
                    value={authForm.full_name}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, full_name: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={authLoading}
              >
                {authLoading
                  ? "Processing..."
                  : authMode === "signup"
                  ? "Create Account & Sign In"
                  : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Job Application Modal (Milestone 05) */}
      {showAddAppModal && (
        <div className="modal-backdrop" onClick={() => setShowAddAppModal(false)}>
          <div className="auth-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowAddAppModal(false)}
            >
              ×
            </button>

            <div className="auth-modal-header" style={{ marginBottom: "16px" }}>
              <div className="auth-icon-circle">💼</div>
              <h2>Track Job Application</h2>
              <p>Add a new job application to your career pipeline and stay organized.</p>
            </div>

            <form onSubmit={handleCreateApplication} className="auth-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="auth-field">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Stripe"
                    value={newAppForm.company}
                    onChange={(e) => setNewAppForm({ ...newAppForm, company: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label>Job Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={newAppForm.role}
                    onChange={(e) => setNewAppForm({ ...newAppForm, role: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="auth-field">
                  <label>Pipeline Stage</label>
                  <select
                    className="stage-select-dropdown"
                    style={{ padding: "10px", width: "100%" }}
                    value={newAppForm.status}
                    onChange={(e) => setNewAppForm({ ...newAppForm, status: e.target.value })}
                  >
                    <option value="Wishlist">Wishlist</option>
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, Hybrid, Bangalore"
                    value={newAppForm.location}
                    onChange={(e) => setNewAppForm({ ...newAppForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="auth-field">
                  <label>Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $130k - $160k"
                    value={newAppForm.salary_range}
                    onChange={(e) => setNewAppForm({ ...newAppForm, salary_range: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label>Next Interview Date</label>
                  <input
                    type="date"
                    value={newAppForm.next_interview_date}
                    onChange={(e) => setNewAppForm({ ...newAppForm, next_interview_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Job URL</label>
                <input
                  type="url"
                  placeholder="https://company.com/careers/..."
                  value={newAppForm.job_url}
                  onChange={(e) => setNewAppForm({ ...newAppForm, job_url: e.target.value })}
                />
              </div>

              <div className="auth-field">
                <label>Notes & Preparation Checklist</label>
                <textarea
                  rows="3"
                  className="practice-textarea"
                  style={{ minHeight: "70px" }}
                  placeholder="Referral name, recruiter info, required skills, or next steps..."
                  value={newAppForm.notes}
                  onChange={(e) => setNewAppForm({ ...newAppForm, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={appActionLoading}
              >
                {appActionLoading ? "Saving..." : "Add Application to Tracker"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
