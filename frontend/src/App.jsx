import { jsPDF } from "jspdf";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Reusable inline SVG icons for professional UI
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const IconDocument = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
);
const IconWand = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconMic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);
const IconPipeline = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
);
const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
);

const SAMPLE_DATA = {
  bullet: "Developed user authentication and database models for a web portal, reducing page load latency by 35%.",
  role: "Full Stack Developer",
  company: "Tech Solutions Inc.",
  jobDescription: `Full Stack Software Engineer
Responsibilities:
- Build responsive web applications using modern React and FastAPI.
- Design database schemas and optimize SQL queries for high throughput.
- Collaborate with product teams to design scalable system architectures.
- Implement robust unit tests and automated CI/CD deployment pipelines.

Requirements:
- Bachelor's degree in Computer Science or equivalent practical experience.
- Proficiency in Python, JavaScript/TypeScript, SQL, and RESTful APIs.
- Experience with Git version control, cloud platforms, and containerization.`,
  multiJobs: `Role 1: Full Stack Engineer
Skills: Python, React, PostgreSQL, REST APIs, Git, Docker, System Design.

---

Role 2: Frontend Engineer
Skills: JavaScript, TypeScript, React.js, HTML5, CSS3, UI Performance, Testing.

---

Role 3: Backend Engineer
Skills: Python, FastAPI, SQL Databases, Redis, Microservices, API Design.`
};

export default function App() {
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

  // Interview Prep
  const [interviewJobDescription, setInterviewJobDescription] = useState("");
  const [interviewData, setInterviewData] = useState(null);
  const [interviewFilename, setInterviewFilename] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Bullet Polisher
  const [coachBullet, setCoachBullet] = useState("");
  const [coachTargetRole, setCoachTargetRole] = useState("");
  const [coachTargetCompany, setCoachTargetCompany] = useState("");
  const [coachResult, setCoachResult] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // ATS Checker
  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  // Skill Gap Analyzer
  const [gapJobDescription, setGapJobDescription] = useState("");
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  // User Auth & Cloud Database
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
  const [authMode, setAuthMode] = useState("login");
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

  // Milestone 05: Job Application Tracker State
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

  // Milestone 06: Mock Interview Practice
  const [openPractice, setOpenPractice] = useState({});
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evalLoading, setEvalLoading] = useState({});

  // Sync auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Service health check with auto-recheck when offline
  const checkBackend = async () => {
    try {
      const res = await axios.get(`${API_URL}/health`, { timeout: 8000 });
      setStatus(res.data.status || "Connected");
    } catch {
      setStatus("Not connected");
    }
  };

  const timerRef = useRef(null);

  useEffect(() => {
    const runCheck = async () => {
      try {
        const res = await axios.get(`${API_URL}/health`, { timeout: 8000 });
        setStatus(res.data.status || "Connected");
      } catch {
        setStatus("Not connected");
        timerRef.current = setTimeout(runCheck, 6000);
      }
    };
    runCheck();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Fetch saved resumes
  const fetchSavedResumes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/resumes`);
      setSavedResumes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
    }
  }, [token]);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/applications`);
      if (res.data && res.data.length > 0) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchSavedResumes();
      fetchApplications();
    } else {
      setSavedResumes([]);
    }
  }, [user, token, fetchSavedResumes, fetchApplications]);

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

      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      const { access_token, user: userData } = res.data;

      localStorage.setItem("careerpilot_token", access_token);
      localStorage.setItem("careerpilot_user", JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      setShowAuthModal(false);
      setAuthForm({ email: "", password: "", full_name: "" });
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
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
      alert("Please provide at least your full name before saving.");
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
      setSaveResumeSuccess("Resume version saved to your account.");
      fetchSavedResumes();
      setTimeout(() => setSaveResumeSuccess(""), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save resume.");
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
        setSaveResumeSuccess(`Loaded "${saved.title}"`);
        setTimeout(() => setSaveResumeSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error loading resume:", err);
    }
  };

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
    if (!window.confirm("Delete this application from your pipeline?")) return;
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
Notes: ${appItem.notes || ""}`;
    setInterviewJobDescription(desc);
    setActiveSection("interview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEvaluateAnswer = async (key, questionText, categoryName, topicName) => {
    const answer = userAnswers[key];
    if (!answer || !answer.trim()) {
      alert("Please provide an answer before submitting for evaluation.");
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
      alert("Optimization failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setCoachLoading(false);
    }
  };

  const handleApplyCoachBullet = (text) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience ? `${prev.experience}\n• ${text}` : `• ${text}`,
    }));
    alert("Bullet point transferred to Resume Studio experience section.");
  };

  const handleRunAtsCheck = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your PDF resume first.");
      return;
    }
    if (!atsJobDescription.trim()) {
      alert("Please provide the target job requirements.");
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
      alert("ATS audit failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setAtsLoading(false);
    }
  };

  const handleRunSkillGap = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your PDF resume first.");
      return;
    }
    if (!gapJobDescription.trim()) {
      alert("Please provide the target job requirements.");
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
      alert("Skill gap analysis failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setGapLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) {
      setFile(null);
      setAnalysis(null);
      setJobMatches([]);
      setInterviewData(null);
      setError("");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Please select a standard PDF document.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("File exceeds 5MB limit. Please upload a smaller PDF.");
      return;
    }
    setFile(selectedFile);
    setError("");
  };

  const validateResume = () => {
    if (!file) {
      setError("Please upload your PDF resume first.");
      return false;
    }
    return true;
  };

  const analyzeResume = async (event) => {
    event.preventDefault();
    setError("");
    setAnalysis(null);
    if (!validateResume()) return;
    if (!jobDescription.trim()) {
      setError("Please paste the target job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/analyze-resume`, formData);
      setAnalysis(res.data.analysis);
      setFilename(res.data.filename);
    } catch (err) {
      setError(err.response?.data?.detail || "Resume diagnostic failed. Please verify inputs.");
    } finally {
      setLoading(false);
    }
  };

  const matchJobs = async (event) => {
    event.preventDefault();
    setError("");
    setJobMatches([]);
    if (!validateResume()) return;
    if (!jobDescriptions.trim()) {
      setError("Please provide at least one job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_descriptions", jobDescriptions);

    try {
      setMatchLoading(true);
      const res = await axios.post(`${API_URL}/match-jobs`, formData);
      setJobMatches(res.data.analysis.matches || []);
      setMatchFilename(res.data.filename);
    } catch (err) {
      setError(err.response?.data?.detail || "Job matching failed.");
    } finally {
      setMatchLoading(false);
    }
  };

  const generateInterview = async (event) => {
    event.preventDefault();
    setError("");
    setInterviewData(null);
    if (!validateResume()) return;
    if (!interviewJobDescription.trim()) {
      setError("Please paste the target job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", interviewJobDescription);

    try {
      setInterviewLoading(true);
      const res = await axios.post(`${API_URL}/generate-interview`, formData);
      setInterviewData(res.data.interview);
      setInterviewFilename(res.data.filename);
    } catch (err) {
      setError(err.response?.data?.detail || "Interview generation failed.");
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleDownloadResume = () => {
    if (!resumeData.name.trim()) {
      alert("Please provide your name before exporting.");
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

    addText(resumeData.name, 18, true);
    addText([resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join(" • "));
    if (resumeData.linkedin || resumeData.github) {
      addText([resumeData.linkedin, resumeData.github].filter(Boolean).join(" • "));
    }
    y += 4;

    if (resumeData.summary) {
      addText("PROFESSIONAL SUMMARY", 12, true);
      addText(resumeData.summary);
      y += 4;
    }

    if (resumeData.degree || resumeData.college) {
      addText("EDUCATION", 12, true);
      addText([resumeData.degree, resumeData.college, resumeData.graduationYear, resumeData.cgpa].filter(Boolean).join(" • "));
      y += 4;
    }

    if (resumeData.skills) {
      addText("TECHNICAL SKILLS", 12, true);
      addText(resumeData.skills);
      y += 4;
    }

    if (resumeData.projectName || resumeData.projectDescription) {
      addText("PROJECTS", 12, true);
      if (resumeData.projectName) addText(resumeData.projectName, 11, true);
      if (resumeData.projectTech) addText(`Technologies: ${resumeData.projectTech}`);
      if (resumeData.projectDescription) addText(resumeData.projectDescription);
      y += 4;
    }

    if (resumeData.experience) {
      addText("EXPERIENCE", 12, true);
      addText(resumeData.experience);
    }

    doc.save(`${resumeData.name.replace(/\s+/g, "_")}_Resume.pdf`);
  };

  // Resume completion calculation
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
  const completedFields = resumeFields.filter((f) => f && f.trim() !== "").length;
  const resumeScore = Math.round((completedFields / resumeFields.length) * 100);

  // Navigation Items
  const navItems = [
    { id: "overview", label: "Dashboard", icon: IconGrid, tag: null },
    { id: "resume", label: "Resume Diagnostic", icon: IconDocument, tag: "Audit" },
    { id: "coach", label: "Bullet Polisher", icon: IconWand, tag: "XYZ" },
    { id: "ats", label: "ATS Compliance", icon: IconShield, tag: "Screener" },
    { id: "gap", label: "Skill Benchmark", icon: IconTarget, tag: "Roadmap" },
    { id: "matcher", label: "Role Fit Matrix", icon: IconSearch, tag: "Multi" },
    { id: "interview", label: "Interview Simulator", icon: IconMic, tag: "STAR" },
    { id: "tracker", label: "Application Pipeline", icon: IconPipeline, tag: "Kanban" },
    { id: "builder", label: "Resume Studio", icon: IconEdit, tag: "PDF" },
  ];

  const currentNav = navItems.find((n) => n.id === activeSection) || navItems[0];

  const renderQuestions = (questions, category, categoryType = "technical") => {
    if (!questions || questions.length === 0) {
      return <p className="empty-message">No questions available for this category.</p>;
    }

    return (
      <div className="analysis-card" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "#0f172a" }}>
          {category}
        </h3>

        {questions.map((item, index) => {
          const key = `${categoryType}-${index}`;
          const isPracticeOpen = openPractice[key];
          const evaluation = evaluations[key];
          const isLoading = evalLoading[key];

          return (
            <div className="interview-question-wrapper" key={index} style={{ marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <details className="interview-question">
                <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "10px 0" }}>
                  <strong style={{ fontSize: "14px", color: "#1e293b", flex: 1 }}>
                    {index + 1}. {item.question}
                  </strong>
                  {item.topic && <span className="score-label" style={{ fontSize: "11px" }}>{item.topic}</span>}
                  {evaluation && (
                    <span
                      className={`eval-score-badge ${
                        evaluation.score >= 8 ? "high" : evaluation.score >= 6 ? "medium" : "low"
                      }`}
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                    >
                      Score: {evaluation.score}/10
                    </span>
                  )}
                </summary>

                <div className="interview-answer" style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", margin: "8px 0" }}>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>Recommended Talking Points</h4>
                  <p style={{ fontSize: "13px", color: "#334155", margin: "6px 0 10px", lineHeight: "1.6" }}>{item.sample_answer}</p>

                  {item.follow_up_questions?.length > 0 && (
                    <div style={{ marginTop: "10px", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
                      <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b" }}>Potential Follow-ups</h4>
                      <ul style={{ paddingLeft: "18px", fontSize: "13px", color: "#475569", margin: "4px 0" }}>
                        {item.follow_up_questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>

              <div style={{ marginTop: "8px" }}>
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
                  <span>{isPracticeOpen ? "Hide Response Sandbox" : "Practice Your Response"}</span>
                </button>

                {isPracticeOpen && (
                  <div className="practice-workspace" style={{ marginTop: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                      Your Spoken / Written Response (Practice articulating your thoughts):
                    </label>
                    <textarea
                      className="practice-textarea"
                      placeholder="Structure your answer using STAR (Situation, Task, Action, Result)..."
                      value={userAnswers[key] || ""}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="practice-submit-btn"
                        disabled={isLoading}
                        onClick={() =>
                          handleEvaluateAnswer(key, item.question, categoryType, item.topic)
                        }
                      >
                        {isLoading ? "Evaluating Answer..." : "Submit for Objective Scoring"}
                      </button>

                      {evaluation && (
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
                          Evaluated: {evaluation.score} / 10 ({evaluation.verdict})
                        </span>
                      )}
                    </div>

                    {evaluation && (
                      <div className="eval-report-card" style={{ marginTop: "12px" }}>
                        <div className="eval-score-header">
                          <div>
                            <span className="eyebrow">ASSESSMENT SCORECARD</span>
                            <h4 style={{ fontSize: "16px", color: "#0f172a", marginTop: "2px" }}>
                              {evaluation.verdict}
                            </h4>
                          </div>
                          <div className={`eval-score-number ${evaluation.score >= 8 ? "high" : evaluation.score >= 6 ? "medium" : "low"}`}>
                            {evaluation.score}<span>/10</span>
                          </div>
                        </div>

                        <div className="eval-metrics-grid">
                          <div className="eval-metric-box">
                            <span>STAR Framework</span>
                            <strong>{evaluation.star_adherence}</strong>
                          </div>
                          <div className="eval-metric-box">
                            <span>Technical Accuracy</span>
                            <strong>{evaluation.technical_accuracy}</strong>
                          </div>
                          <div className="eval-metric-box">
                            <span>Communication Tone</span>
                            <strong>{evaluation.clarity_and_tone}</strong>
                          </div>
                        </div>

                        <div className="eval-feedback-section">
                          <div className="feedback-col">
                            <h5>Effective Elements</h5>
                            <ul>
                              {evaluation.strengths?.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="feedback-col">
                            <h5>Omissions & Growth Areas</h5>
                            <ul>
                              {evaluation.missing_elements?.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {evaluation.improved_version && (
                          <div className="model-answer-box">
                            <h5>Recommended Executive Phrasing</h5>
                            <p>"{evaluation.improved_version}"</p>
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

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">CP</div>
          <div>
            <h2>CareerPilot</h2>
            <span>WORKSPACE SUITE</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <p className="sidebar-label">MODULES</p>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  className={isActive ? "active" : ""}
                  onClick={() => {
                    setActiveSection(item.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="nav-icon"><Icon /></span>
                  <span className="nav-label">{item.label}</span>
                  {item.tag && <span className="nav-tag">{item.tag}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-status-box">
            <div className="sidebar-status-dot-row">
              <span className={`status-dot ${status === "Not connected" ? "offline" : ""}`} />
              <span className="status-text">{status === "Not connected" ? "API Cold / Connecting" : "Live API Connected"}</span>
            </div>
            <button className="reconnect-btn" onClick={checkBackend} title="Verify connection">
              <IconRefresh /> Refresh Status
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <div className="main-layout">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb-nav">
              <span className="breadcrumb-root">CareerPilot</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-active">{currentNav.label}</span>
            </div>
          </div>

          <div className="topbar-right">
            {file && (
              <div className="active-resume-chip" title="Active resume used across all evaluation tools">
                <span className="file-badge">PDF</span>
                <span className="file-name">{file.name}</span>
              </div>
            )}

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
                >
                  Sign Out
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
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="error-banner">
            <div>
              <strong>Notice:</strong> {error}
            </div>
            <button type="button" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        <main className="container">
          {/* ============================================================== */}
          {/* VIEW: OVERVIEW DASHBOARD                                       */}
          {/* ============================================================== */}
          {activeSection === "overview" && (
            <div className="dashboard-view">
              <div className="workspace-hero">
                <div>
                  <span className="hero-eyebrow">CAREER INTELLIGENCE & EVALUATION</span>
                  <h2>Professional Job Application Suite</h2>
                  <p>
                    Audit ATS compatibility, refine achievement bullets, benchmark skill gaps, and simulate technical interviews in a unified workspace.
                  </p>
                </div>
              </div>

              {/* Resume Status Card / Dropzone */}
              <div className="resume-hub-card">
                <div className="resume-hub-header">
                  <div>
                    <span className="hub-tag">PRIMARY CANDIDATE PROFILE</span>
                    <h3>Candidate Resume Document</h3>
                    <p>Attached PDF is automatically loaded into diagnostics, ATS screening, and interview simulations.</p>
                  </div>
                  <label className="upload-trigger-btn" htmlFor="overview-resume-input">
                    <IconUpload /> {file ? "Replace Resume PDF" : "Attach Resume PDF"}
                    <input
                      id="overview-resume-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {file ? (
                  <div className="attached-resume-row">
                    <div className="resume-meta">
                      <div className="pdf-icon-square">PDF</div>
                      <div>
                        <strong>{file.name}</strong>
                        <span>{(file.size / 1024).toFixed(1)} KB • Ready for automated analysis</span>
                      </div>
                    </div>
                    <div className="resume-actions-right">
                      <span className="ready-pill"><IconCheck /> Active in Workspace</span>
                      <button
                        type="button"
                        className="detach-btn"
                        onClick={() => handleFileChange({ target: { files: [] } })}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className="upload-dropzone"
                    htmlFor="overview-resume-input"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = e.dataTransfer.files?.[0];
                      if (dropped) handleFileChange({ target: { files: [dropped] } });
                    }}
                  >
                    <div className="dropzone-icon"><IconUpload /></div>
                    <strong>No resume uploaded yet</strong>
                    <span>Click or drag and drop your PDF resume here to enable full suite evaluations</span>
                  </label>
                )}
              </div>

              {/* Key Metrics */}
              <div className="metrics-strip">
                <div className="metric-card">
                  <span className="metric-label">Resume Profile</span>
                  <h3>{file ? "Attached" : "Unattached"}</h3>
                  <p>{file ? file.name : "Attach PDF to run scans"}</p>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Pipeline Applications</span>
                  <h3>{applications.length}</h3>
                  <p>{applications.filter((a) => a.status === "Interview").length} active in interviews</p>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Studio Completion</span>
                  <h3>{resumeScore}%</h3>
                  <p>{completedFields} of {resumeFields.length} sections defined</p>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Cloud Database</span>
                  <h3>{user ? `${savedResumes.length} Saved` : "Guest Mode"}</h3>
                  <p>{user ? user.email : "Sign in to persist records"}</p>
                </div>
              </div>

              {/* Tools Directory Grid */}
              <div className="tools-directory">
                <div className="section-title-row">
                  <h3>Workspace Modules</h3>
                  <span>Select any module to start a dedicated evaluation session</span>
                </div>

                <div className="tools-grid">
                  <div className="tool-card" onClick={() => { setActiveSection("resume"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconDocument /></div>
                    <span className="tool-category">DIAGNOSTIC</span>
                    <h4>Resume Diagnostic</h4>
                    <p>Scan your resume against any job description to evaluate skill matches, gaps, and strengths.</p>
                    <div className="tool-card-footer">
                      <span>Launch Diagnostic</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("coach"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconWand /></div>
                    <span className="tool-category">XYZ METHOD</span>
                    <h4>Bullet Polisher</h4>
                    <p>Upgrade passive work bullets into quantified accomplishments using executive power verbs.</p>
                    <div className="tool-card-footer">
                      <span>Refine Descriptions</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("ats"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconShield /></div>
                    <span className="tool-category">COMPLIANCE</span>
                    <h4>ATS Compliance</h4>
                    <p>Audit layout readability, critical keyword density, and formatting against screener filters.</p>
                    <div className="tool-card-footer">
                      <span>Audit ATS Score</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("gap"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconTarget /></div>
                    <span className="tool-category">BENCHMARK</span>
                    <h4>Skill Benchmark</h4>
                    <p>Analyze role competency gaps and generate a 4-week structured curriculum roadmap.</p>
                    <div className="tool-card-footer">
                      <span>View Roadmap</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("matcher"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconSearch /></div>
                    <span className="tool-category">MULTI-MATCH</span>
                    <h4>Role Fit Matrix</h4>
                    <p>Compare your profile against several job descriptions simultaneously to find the strongest match.</p>
                    <div className="tool-card-footer">
                      <span>Compare Roles</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("interview"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconMic /></div>
                    <span className="tool-category">SIMULATION</span>
                    <h4>Interview Simulator</h4>
                    <p>Practice technical and behavioral questions with instant STAR evaluation and scorecards.</p>
                    <div className="tool-card-footer">
                      <span>Start Simulation</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("tracker"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconPipeline /></div>
                    <span className="tool-category">PIPELINE</span>
                    <h4>Application Pipeline</h4>
                    <p>Organize target opportunities, log interviews, and monitor your hiring lifecycle.</p>
                    <div className="tool-card-footer">
                      <span>Manage Pipeline</span> <IconArrowRight />
                    </div>
                  </div>

                  <div className="tool-card" onClick={() => { setActiveSection("builder"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <div className="tool-card-icon"><IconEdit /></div>
                    <span className="tool-category">STUDIO</span>
                    <h4>Resume Studio & PDF</h4>
                    <p>Build a clean, structured resume with live preview and export to standard PDF format.</p>
                    <div className="tool-card-footer">
                      <span>Open Studio</span> <IconArrowRight />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FOCUSED TOOL HEADER (FOR ALL NON-OVERVIEW VIEWS)               */}
          {/* ============================================================== */}
          {activeSection !== "overview" && (
            <div className="tool-page-nav-bar">
              <button
                type="button"
                className="tool-back-link"
                onClick={() => { setActiveSection("overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <IconArrowLeft /> <span>Back to Dashboard</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: RESUME DIAGNOSTIC                                         */}
          {/* ============================================================== */}
          {activeSection === "resume" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">DIAGNOSTIC SCANNER</span>
                  <h2>Resume Compatibility Diagnostic</h2>
                  <p>Compare your attached resume against target job requirements to identify matching proficiencies and improvement areas.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => setJobDescription(SAMPLE_DATA.jobDescription)}
                >
                  Load Sample Job Spec
                </button>
              </div>

              <div className="panel">
                <div className="attached-status-banner">
                  <span className="doc-pill">PDF</span>
                  <div>
                    <strong>{file ? file.name : "No PDF attached"}</strong>
                    <p>{file ? "Document attached and ready for scan." : "Attach a PDF resume in Dashboard to run this diagnostic."}</p>
                  </div>
                </div>

                <form onSubmit={analyzeResume} className="feature-form">
                  <label htmlFor="diagnostic-jd">Target Job Requirements *</label>
                  <textarea
                    id="diagnostic-jd"
                    rows="7"
                    required
                    placeholder="Paste the target job description or requirements here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />

                  <button type="submit" disabled={loading} className="primary-action-btn">
                    {loading ? "Scanning Profile..." : "Run Compatibility Diagnostic"}
                  </button>
                </form>

                {loading && (
                  <div className="loading-state">
                    <span className="spinner"></span>
                    Evaluating competency overlap and keyword requirements...
                  </div>
                )}
              </div>

              {analysis && (
                <div className="panel result-panel">
                  <div className="result-heading">
                    <div>
                      <span className="eyebrow">DIAGNOSTIC REPORT</span>
                      <h3>Compatibility Assessment</h3>
                      <p>Evaluated against: {filename}</p>
                    </div>
                    <button className="secondary-button" onClick={() => setAnalysis(null)}>
                      Clear
                    </button>
                  </div>

                  <div className="score-section">
                    <div
                      className="score-circle"
                      style={{
                        background: `conic-gradient(#2563eb ${analysis.match_score}%, #e2e8f0 0)`,
                      }}
                    >
                      <div className="score-inner">
                        <h2>{analysis.match_score}</h2>
                        <span>/100</span>
                      </div>
                    </div>
                    <div className="score-info">
                      <h4>Estimated Compatibility</h4>
                      <p>{analysis.score_explanation}</p>
                    </div>
                  </div>

                  <div className="results-grid">
                    <div className="analysis-card">
                      <h4>Matching Proficiencies</h4>
                      <div className="skill-list">
                        {analysis.matching_skills?.map((skill, index) => (
                          <span className="skill-badge matched" key={index}>{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>Missing Competencies</h4>
                      <div className="skill-list">
                        {analysis.missing_skills?.map((skill, index) => (
                          <span className="skill-badge missing" key={index}>{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>Profile Strengths</h4>
                      <ul>
                        {analysis.strengths?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="analysis-card">
                      <h4>Targeted Enhancements</h4>
                      <ul>
                        {analysis.improvement_suggestions?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="analysis-card full-width">
                      <h4>Recommended ATS Keywords</h4>
                      <div className="skill-list">
                        {analysis.keyword_suggestions?.map((kw, index) => (
                          <span className="skill-badge keyword" key={index}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: BULLET POLISHER                                          */}
          {/* ============================================================== */}
          {activeSection === "coach" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">EXECUTIVE XYZ FORMULA</span>
                  <h2>Resume Bullet Polisher</h2>
                  <p>Convert passive descriptions into high-impact accomplishment statements backed by metrics and strong action verbs.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => {
                    setCoachBullet(SAMPLE_DATA.bullet);
                    setCoachTargetRole(SAMPLE_DATA.role);
                    setCoachTargetCompany(SAMPLE_DATA.company);
                  }}
                >
                  Load Sample Bullet
                </button>
              </div>

              <div className="panel">
                <form onSubmit={handleCoachBullet} className="feature-form">
                  <label>Original Work Description / Raw Bullet *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="e.g. Built frontend components and fixed bugs to make the portal faster..."
                    value={coachBullet}
                    onChange={(e) => setCoachBullet(e.target.value)}
                  />

                  <div className="two-col-inputs">
                    <div>
                      <label>Target Role (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Software Engineer"
                        value={coachTargetRole}
                        onChange={(e) => setCoachTargetRole(e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Target Company or Industry (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Enterprise Cloud / FinTech"
                        value={coachTargetCompany}
                        onChange={(e) => setCoachTargetCompany(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={coachLoading} className="primary-action-btn">
                    {coachLoading ? "Refining Statement..." : "Generate Polished Variations"}
                  </button>
                </form>

                {coachLoading && (
                  <div className="loading-state">
                    <span className="spinner"></span>
                    Restructuring statement using active verbs and impact metrics...
                  </div>
                )}
              </div>

              {coachResult && (
                <div className="panel result-panel">
                  <div className="result-heading">
                    <div>
                      <span className="eyebrow">REFINED VARIATIONS</span>
                      <h3>Recruiter-Ready Options</h3>
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
                            <strong>Metric Integration:</strong> {s.metrics_added}
                          </div>
                          <p className="coach-why-better">{s.why_better}</p>
                        </div>

                        <div className="coach-actions">
                          <button
                            type="button"
                            className="coach-copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(s.text);
                              alert("Copied variation to clipboard.");
                            }}
                          >
                            Copy Text
                          </button>
                          <button
                            type="button"
                            className="coach-apply-btn"
                            onClick={() => handleApplyCoachBullet(s.text)}
                          >
                            Apply to Studio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {coachResult.general_tips?.length > 0 && (
                    <div className="pro-tips-card">
                      <h4>Best Practice Guidance</h4>
                      <ul>
                        {coachResult.general_tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: ATS COMPATIBILITY                                        */}
          {/* ============================================================== */}
          {activeSection === "ats" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">SYSTEM COMPLIANCE</span>
                  <h2>ATS Compatibility Audit</h2>
                  <p>Verify document layout, critical keyword density, and formatting against automated Applicant Tracking Systems.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => setAtsJobDescription(SAMPLE_DATA.jobDescription)}
                >
                  Load Sample Spec
                </button>
              </div>

              <div className="panel">
                <div className="attached-status-banner">
                  <span className="doc-pill">PDF</span>
                  <div>
                    <strong>{file ? file.name : "No PDF attached"}</strong>
                    <p>{file ? "Document attached for ATS compliance check." : "Attach a PDF resume in Dashboard to run this audit."}</p>
                  </div>
                </div>

                <form onSubmit={handleRunAtsCheck} className="feature-form">
                  <label>Target Job Requirements *</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Paste the target job description to check keyword alignment and compliance..."
                    value={atsJobDescription}
                    onChange={(e) => setAtsJobDescription(e.target.value)}
                  />

                  <button type="submit" disabled={atsLoading} className="primary-action-btn">
                    {atsLoading ? "Auditing Compatibility..." : "Run Compliance Audit"}
                  </button>
                </form>

                {atsLoading && (
                  <div className="loading-state">
                    <span className="spinner"></span>
                    Scanning formatting, section headers, and keyword density...
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
                          <span style={{ fontSize: "14px", color: "#94a3b8" }}>/ 100 Overall Score</span>
                        </div>
                        <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "6px" }}>
                          {atsResult.ats_score >= 80
                            ? "High likelihood of passing automated enterprise screening."
                            : atsResult.ats_score >= 65
                            ? "Acceptable baseline, but addressing missing keywords will increase callback rates."
                            : "Optimization recommended. Multiple key screening filters were not matched."}
                        </p>
                      </div>
                    </div>

                    <div className="ats-subscores-grid">
                      <div className="ats-subscore-item">
                        <span>Layout & Structure</span>
                        <strong>{atsResult.formatting_score}%</strong>
                      </div>
                      <div className="ats-subscore-item">
                        <span>Keyword Alignment</span>
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
                      <h4>Compliance Checklist</h4>
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
                      <h4>Missing High-Priority Keywords</h4>
                      <div className="keyword-chips-container">
                        {atsResult.missing_critical_keywords.map((kw, i) => (
                          <span className="keyword-chip missing" key={i}>– {kw}</span>
                        ))}
                      </div>

                      <h4 style={{ marginTop: "18px" }}>Matched Keywords</h4>
                      <div className="keyword-chips-container">
                        {atsResult.matching_keywords.map((kw, i) => (
                          <span className="keyword-chip matched" key={i}>✓ {kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: SKILL GAP & ROADMAP                                      */}
          {/* ============================================================== */}
          {activeSection === "gap" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">CURRICULUM BENCHMARK</span>
                  <h2>Skill Gap & Learning Roadmap</h2>
                  <p>Identify missing core competencies and follow a 4-week structured curriculum to bridge technical gaps.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => setGapJobDescription(SAMPLE_DATA.jobDescription)}
                >
                  Load Sample Spec
                </button>
              </div>

              <div className="panel">
                <div className="attached-status-banner">
                  <span className="doc-pill">PDF</span>
                  <div>
                    <strong>{file ? file.name : "No PDF attached"}</strong>
                    <p>{file ? "Document attached for skill gap benchmark." : "Attach a PDF resume in Dashboard to run this roadmap."}</p>
                  </div>
                </div>

                <form onSubmit={handleRunSkillGap} className="feature-form">
                  <label>Target Role Requirements *</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Paste the target job requirements to generate your learning roadmap..."
                    value={gapJobDescription}
                    onChange={(e) => setGapJobDescription(e.target.value)}
                  />

                  <button type="submit" disabled={gapLoading} className="primary-action-btn">
                    {gapLoading ? "Analyzing Competencies..." : "Build Benchmark & Curriculum"}
                  </button>
                </form>

                {gapLoading && (
                  <div className="loading-state">
                    <span className="spinner"></span>
                    Evaluating candidate competencies and structuring tailored curriculum...
                  </div>
                )}
              </div>

              {gapResult && (
                <div className="panel result-panel">
                  <div className="skill-gap-overview">
                    <span className="eyebrow">COMPETENCY READINESS</span>
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
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2563eb" }}>
                        ~{gapResult.estimated_weeks_to_ready} Weeks to Target Readiness
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                      {gapResult.executive_summary}
                    </p>
                  </div>

                  <div className="analysis-grid">
                    <div className="analysis-card">
                      <h4>Core Technical Gaps</h4>
                      <div className="keyword-chips-container">
                        {gapResult.critical_missing_skills.map((s, i) => (
                          <span className="keyword-chip missing" key={i}>– {s}</span>
                        ))}
                      </div>

                      <h4 style={{ marginTop: "16px" }}>Frameworks & Libraries to Study</h4>
                      <div className="keyword-chips-container">
                        {gapResult.tools_and_frameworks_missing.map((t, i) => (
                          <span className="skill-badge keyword" key={i}>{t}</span>
                        ))}
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>Verified Competencies</h4>
                      <div className="keyword-chips-container">
                        {gapResult.matching_skills.map((s, i) => (
                          <span className="keyword-chip matched" key={i}>✓ {s}</span>
                        ))}
                      </div>

                      <h4 style={{ marginTop: "16px" }}>Soft Skills & Domain Alignment</h4>
                      <div className="keyword-chips-container">
                        {gapResult.soft_skills_missing.map((s, i) => (
                          <span className="skill-badge missing" key={i}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", color: "#0f172a" }}>
                      Personalized 4-Week Learning Roadmap
                    </h3>

                    <div className="roadmap-weeks-container">
                      {gapResult.roadmap.map((week) => (
                        <div className="roadmap-week-card" key={week.week_number}>
                          <div className="roadmap-week-header">
                            <span className="week-badge">Week {week.week_number}</span>
                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>{week.theme}</strong>
                          </div>

                          <div style={{ fontSize: "13px", color: "#475569", margin: "8px 0" }}>
                            <strong>Core Topics:</strong> {week.topics.join(" • ")}
                          </div>

                          <div className="roadmap-project-box">
                            <strong>Recommended Milestone:</strong> {week.recommended_project}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: ROLE FIT MATRIX                                          */}
          {/* ============================================================== */}
          {activeSection === "matcher" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">OPPORTUNITY RANKING</span>
                  <h2>Multi-Role Fit Matrix</h2>
                  <p>Compare your attached resume against several openings at once to pinpoint your highest-probability matches.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => setJobDescriptions(SAMPLE_DATA.multiJobs)}
                >
                  Load Sample Roles
                </button>
              </div>

              <div className="panel">
                <div className="attached-status-banner">
                  <span className="doc-pill">PDF</span>
                  <div>
                    <strong>{file ? file.name : "No PDF attached"}</strong>
                    <p>{file ? "Document attached for multi-role ranking." : "Attach a PDF resume in Dashboard to run this matrix."}</p>
                  </div>
                </div>

                <form onSubmit={matchJobs} className="feature-form">
                  <label htmlFor="multi-jobs">Multiple Job Descriptions (Separate roles using '---') *</label>
                  <textarea
                    id="multi-jobs"
                    rows="10"
                    required
                    placeholder={`Role 1: Frontend Engineer\nSkills: React, TypeScript, CSS...\n\n---\n\nRole 2: Backend Engineer\nSkills: Python, SQL, REST APIs...`}
                    value={jobDescriptions}
                    onChange={(e) => setJobDescriptions(e.target.value)}
                  />

                  <button type="submit" disabled={matchLoading} className="primary-action-btn">
                    {matchLoading ? "Evaluating Matches..." : "Rank Matching Opportunities"}
                  </button>
                </form>

                {matchLoading && (
                  <div className="loading-state">
                    <span className="spinner"></span>
                    Evaluating resume compatibility across all provided specifications...
                  </div>
                )}
              </div>

              {jobMatches.length > 0 && (
                <div className="panel result-panel">
                  <div className="result-heading">
                    <div>
                      <span className="eyebrow">RANKED OPPORTUNITIES</span>
                      <h3>Role Fit Results</h3>
                      <p>Evaluated {jobMatches.length} openings against: {matchFilename}</p>
                    </div>
                    <button className="secondary-button" onClick={() => setJobMatches([])}>
                      Clear
                    </button>
                  </div>

                  {jobMatches.map((job, index) => (
                    <div className="job-result-card" key={index}>
                      <div className="job-result-header">
                        <div>
                          <span className="job-rank">Rank #{index + 1}</span>
                          <h3>{job.job_title}</h3>
                        </div>

                        <div
                          className="job-score"
                          style={{
                            background: `conic-gradient(#2563eb ${job.match_score}%, #e2e8f0 0)`,
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
                          <h4>Matching Proficiencies</h4>
                          <div className="skill-list">
                            {job.matching_skills?.map((s, i) => (
                              <span className="skill-badge matched" key={i}>{s}</span>
                            ))}
                          </div>
                        </div>

                        <div className="analysis-card">
                          <h4>Missing Requirements</h4>
                          <div className="skill-list">
                            {job.missing_skills?.map((s, i) => (
                              <span className="skill-badge missing" key={i}>{s}</span>
                            ))}
                          </div>
                        </div>

                        <div className="analysis-card">
                          <h4>Why You Fit</h4>
                          <ul>
                            {job.why_suitable?.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="analysis-card">
                          <h4>Growth Areas</h4>
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
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: INTERVIEW SIMULATOR                                      */}
          {/* ============================================================== */}
          {activeSection === "interview" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">MOCK SIMULATION</span>
                  <h2>Interactive Interview Simulator</h2>
                  <p>Practice targeted technical, resume-based, and behavioral questions with instant STAR evaluation.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => setInterviewJobDescription(SAMPLE_DATA.jobDescription)}
                >
                  Load Sample Role
                </button>
              </div>

              <div className="panel">
                <div className="attached-status-banner">
                  <span className="doc-pill">PDF</span>
                  <div>
                    <strong>{file ? file.name : "No PDF attached"}</strong>
                    <p>{file ? "Document attached for question generation." : "Attach a PDF resume in Dashboard to run this simulation."}</p>
                  </div>
                </div>

                <form onSubmit={generateInterview} className="feature-form">
                  <label htmlFor="interview-jd">Target Job Requirements *</label>
                  <textarea
                    id="interview-jd"
                    rows="6"
                    required
                    placeholder="Paste the target job description or requirements..."
                    value={interviewJobDescription}
                    onChange={(e) => setInterviewJobDescription(e.target.value)}
                  />

                  <button type="submit" disabled={interviewLoading} className="primary-action-btn">
                    {interviewLoading ? "Generating Question Set..." : "Generate Interview Practice Set"}
                  </button>
                </form>

                {interviewLoading && (
                  <div className="loading-state">
                    <span className="spinner"></span>
                    Synthesizing role requirements and candidate experience into interview questions...
                  </div>
                )}
              </div>

              {interviewData && (
                <div className="panel result-panel">
                  <div className="result-heading">
                    <div>
                      <span className="eyebrow">PRACTICE SESSION</span>
                      <h3>Personalized Question Bank</h3>
                      <p>Targeted for: {interviewFilename}</p>
                    </div>
                    <button className="secondary-button" onClick={() => setInterviewData(null)}>
                      Clear
                    </button>
                  </div>

                  <div className="interview-stats-header">
                    <div>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>Interactive Response Sandbox</strong>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                        Expand any question and use "Practice Your Response" to receive automated feedback and scoring.
                      </p>
                    </div>
                    <div className="eval-summary-badges">
                      <div className="eval-counter-pill">
                        Graded: {Object.keys(evaluations).length} Questions
                      </div>
                      {Object.keys(evaluations).length > 0 && (
                        <div className="eval-counter-pill" style={{ color: "#16a34a", borderColor: "#bbf7d0" }}>
                          Average: {(
                            Object.values(evaluations).reduce((acc, curr) => acc + (curr.score || 0), 0) /
                            Object.keys(evaluations).length
                          ).toFixed(1)} / 10
                        </div>
                      )}
                    </div>
                  </div>

                  {renderQuestions(interviewData.technical_questions, "Technical Competencies", "tech")}
                  {renderQuestions(interviewData.resume_questions, "Experience & Project Deep Dives", "resume")}
                  {renderQuestions(interviewData.hr_questions, "Behavioral & Cultural Questions", "hr")}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: APPLICATION PIPELINE                                     */}
          {/* ============================================================== */}
          {activeSection === "tracker" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">PIPELINE CRM</span>
                  <h2>Job Application Pipeline</h2>
                  <p>Track applications across interview rounds, manage schedules, and organize your job search.</p>
                </div>
                <button
                  type="button"
                  className="sample-preset-btn"
                  onClick={() => setShowAddAppModal(true)}
                >
                  + Add New Application
                </button>
              </div>

              <div className="tracker-stats-bar">
                <div className="tracker-stat-pill">
                  <span>Total Opportunities</span>
                  <strong>{applications.length}</strong>
                </div>
                <div className="tracker-stat-pill">
                  <span>Interview Stage</span>
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
                  <span>Active Funnel</span>
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
              </div>

              {applications.filter((a) => activeStageFilter === "All" || a.status === activeStageFilter).length === 0 ? (
                <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px" }}>
                    No opportunities found in the <strong>{activeStageFilter}</strong> stage.
                  </p>
                  <button
                    type="button"
                    className="primary-action-btn"
                    style={{ margin: "0 auto", display: "inline-block" }}
                    onClick={() => setShowAddAppModal(true)}
                  >
                    Add an Application
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
                                <span>Location:</span> {appItem.location}
                              </div>
                            )}
                            {appItem.salary_range && (
                              <div className="app-meta-item">
                                <span>Compensation:</span> {appItem.salary_range}
                              </div>
                            )}
                            {appItem.applied_date && (
                              <div className="app-meta-item">
                                <span>Applied:</span> {appItem.applied_date}
                              </div>
                            )}
                            {appItem.next_interview_date && (
                              <div className="app-meta-item highlight">
                                <span>Interview Date:</span> {appItem.next_interview_date}
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
                              title="Prepare interview questions for this specific role"
                              onClick={() => handlePrepareInterviewForRole(appItem)}
                            >
                              Simulate Interview
                            </button>
                            <button
                              type="button"
                              className="delete-app-btn"
                              title="Delete application"
                              onClick={() => handleDeleteApplication(appItem.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: RESUME STUDIO & PDF EXPORT                               */}
          {/* ============================================================== */}
          {activeSection === "builder" && (
            <div className="focused-tool-container">
              <div className="tool-header">
                <div>
                  <span className="tool-tag">DOCUMENT STUDIO</span>
                  <h2>Resume Studio & PDF Export</h2>
                  <p>Design a structured, recruiter-ready resume with real-time A4 preview and client-side PDF export.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="sample-preset-btn"
                    onClick={() => {
                      setResumeData({
                        name: "Alex Morgan",
                        email: "alex.morgan@example.com",
                        phone: "+1 (555) 234-5678",
                        location: "San Francisco, CA",
                        linkedin: "linkedin.com/in/alexmorgan",
                        github: "github.com/alexmorgan",
                        summary: "Software Engineer with 3+ years experience building web applications in React, TypeScript, and Python. Passionate about developer tooling, API latency, and UI usability.",
                        degree: "B.S. in Computer Science",
                        college: "University of Technology",
                        graduationYear: "2024",
                        cgpa: "3.85 / 4.0",
                        skills: "React, TypeScript, Python, FastAPI, PostgreSQL, Docker, Git, CI/CD, Jest",
                        projectName: "Cloud Resource Monitor",
                        projectTech: "React, FastAPI, Docker, WebSockets",
                        projectDescription: "Engineered real-time dashboard tracking server throughput and latency, supporting 10,000+ metric data points with sub-second updates.",
                        experience: "• Spearheaded frontend migration to React 18, enhancing rendering throughput by 25%.\n• Built RESTful API endpoints in FastAPI with SQLAlchemy and automated schema migrations.",
                      });
                    }}
                  >
                    Load Sample Profile
                  </button>
                </div>
              </div>

              <div className="resume-builder-layout">
                {/* Form Panel */}
                <div className="panel resume-form-panel">
                  <h3>Personal Information</h3>
                  <div className="resume-form-grid">
                    <input
                      placeholder="Full Name"
                      value={resumeData.name}
                      onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    />
                    <input
                      placeholder="Email Address"
                      value={resumeData.email}
                      onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    />
                    <input
                      placeholder="Phone Number"
                      value={resumeData.phone}
                      onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    />
                    <input
                      placeholder="Location (City, State)"
                      value={resumeData.location}
                      onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                    />
                    <input
                      placeholder="LinkedIn URL"
                      value={resumeData.linkedin}
                      onChange={(e) => setResumeData({ ...resumeData, linkedin: e.target.value })}
                    />
                    <input
                      placeholder="GitHub URL"
                      value={resumeData.github}
                      onChange={(e) => setResumeData({ ...resumeData, github: e.target.value })}
                    />
                  </div>

                  <h3>Professional Summary</h3>
                  <textarea
                    rows="3"
                    placeholder="Executive summary summarizing experience and impact..."
                    value={resumeData.summary}
                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  />

                  <h3>Education</h3>
                  <div className="resume-form-grid">
                    <input
                      placeholder="Degree & Major"
                      value={resumeData.degree}
                      onChange={(e) => setResumeData({ ...resumeData, degree: e.target.value })}
                    />
                    <input
                      placeholder="Institution / University"
                      value={resumeData.college}
                      onChange={(e) => setResumeData({ ...resumeData, college: e.target.value })}
                    />
                    <input
                      placeholder="Graduation Year"
                      value={resumeData.graduationYear}
                      onChange={(e) => setResumeData({ ...resumeData, graduationYear: e.target.value })}
                    />
                    <input
                      placeholder="CGPA / Honors"
                      value={resumeData.cgpa}
                      onChange={(e) => setResumeData({ ...resumeData, cgpa: e.target.value })}
                    />
                  </div>

                  <h3>Technical Proficiencies</h3>
                  <textarea
                    rows="2"
                    placeholder="Languages, frameworks, databases, developer tools..."
                    value={resumeData.skills}
                    onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                  />

                  <h3>Featured Project</h3>
                  <input
                    placeholder="Project Title"
                    value={resumeData.projectName}
                    onChange={(e) => setResumeData({ ...resumeData, projectName: e.target.value })}
                    style={{ marginBottom: "8px" }}
                  />
                  <input
                    placeholder="Technologies Used"
                    value={resumeData.projectTech}
                    onChange={(e) => setResumeData({ ...resumeData, projectTech: e.target.value })}
                    style={{ marginBottom: "8px" }}
                  />
                  <textarea
                    rows="3"
                    placeholder="Project architecture and measurable impact..."
                    value={resumeData.projectDescription}
                    onChange={(e) => setResumeData({ ...resumeData, projectDescription: e.target.value })}
                  />

                  <h3>Work Experience</h3>
                  <textarea
                    rows="4"
                    placeholder="Bullet points formatted with action verbs and quantifiable results..."
                    value={resumeData.experience}
                    onChange={(e) => setResumeData({ ...resumeData, experience: e.target.value })}
                  />
                </div>

                {/* Live Preview Panel */}
                <div className="resume-preview-panel">
                  {saveResumeSuccess && (
                    <div className="cloud-success-toast">
                      <IconCheck /> {saveResumeSuccess}
                    </div>
                  )}

                  <div className="preview-heading">
                    <div>
                      <h3>Live Document Preview</h3>
                      <span>Updates in real time</span>
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
                            Load Saved ({savedResumes.length})...
                          </option>
                          {savedResumes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
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
                        {saveResumeLoading ? "Saving..." : "Save to Cloud"}
                      </button>

                      <button
                        type="button"
                        className="download-resume-button"
                        onClick={handleDownloadResume}
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* A4 Paper Container */}
                  <div className="resume-paper">
                    <header className="resume-header">
                      <h1>{resumeData.name || "Candidate Name"}</h1>
                      <p>
                        {[resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join(" • ")}
                      </p>
                      {(resumeData.linkedin || resumeData.github) && (
                        <p>
                          {[resumeData.linkedin, resumeData.github].filter(Boolean).join(" • ")}
                        </p>
                      )}
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
                          {resumeData.cgpa && ` • CGPA: ${resumeData.cgpa}`}
                        </p>
                      </div>
                    )}

                    {resumeData.skills && (
                      <div className="resume-preview-section">
                        <h2>TECHNICAL PROFICIENCIES</h2>
                        <p>{resumeData.skills}</p>
                      </div>
                    )}

                    {resumeData.projectName && (
                      <div className="resume-preview-section">
                        <h2>KEY PROJECTS</h2>
                        <h3>{resumeData.projectName}</h3>
                        {resumeData.projectTech && <p><strong>Stack:</strong> {resumeData.projectTech}</p>}
                        <p>{resumeData.projectDescription}</p>
                      </div>
                    )}

                    {resumeData.experience && (
                      <div className="resume-preview-section">
                        <h2>EXPERIENCE</h2>
                        <p style={{ whiteSpace: "pre-line" }}>{resumeData.experience}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Auth Modal Dialog */}
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
              <h3>{authMode === "signup" ? "Create Account" : "Sign In"}</h3>
              <p>{authMode === "signup" ? "Register to sync resumes and applications to the cloud." : "Access your saved profile and applications."}</p>
            </div>

            {authError && <div className="auth-error-alert">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === "signup" && (
                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={authForm.full_name}
                    onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                  />
                </div>
              )}

              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              <button type="submit" disabled={authLoading} className="auth-submit-btn">
                {authLoading ? "Authenticating..." : authMode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="auth-switch-mode">
              {authMode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setAuthMode("signup"); setAuthError(""); }}>
                    Create one
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{" "}
                  <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }}>
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Application Modal Dialog */}
      {showAddAppModal && (
        <div className="modal-backdrop" onClick={() => setShowAddAppModal(false)}>
          <div className="auth-modal app-form-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowAddAppModal(false)}
            >
              ×
            </button>

            <div className="auth-modal-header">
              <h3>Log New Application</h3>
              <p>Add a target opportunity to your hiring pipeline.</p>
            </div>

            <form onSubmit={handleCreateApplication} className="auth-form">
              <div className="two-col-inputs">
                <div className="auth-field">
                  <label>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={newAppForm.company}
                    onChange={(e) => setNewAppForm({ ...newAppForm, company: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label>Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Developer"
                    value={newAppForm.role}
                    onChange={(e) => setNewAppForm({ ...newAppForm, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="two-col-inputs">
                <div className="auth-field">
                  <label>Pipeline Stage</label>
                  <select
                    value={newAppForm.status}
                    onChange={(e) => setNewAppForm({ ...newAppForm, status: e.target.value })}
                    className="stage-select-dropdown"
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
                    placeholder="e.g. San Francisco / Remote"
                    value={newAppForm.location}
                    onChange={(e) => setNewAppForm({ ...newAppForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="two-col-inputs">
                <div className="auth-field">
                  <label>Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $120k - $145k"
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
                <label>Recruiter Notes / Job Link</label>
                <textarea
                  rows="3"
                  placeholder="Notes about interview format, referral contacts, or requirements..."
                  value={newAppForm.notes}
                  onChange={(e) => setNewAppForm({ ...newAppForm, notes: e.target.value })}
                />
              </div>

              <button type="submit" disabled={appActionLoading} className="auth-submit-btn">
                {appActionLoading ? "Saving..." : "Add to Pipeline"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
