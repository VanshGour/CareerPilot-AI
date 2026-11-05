import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

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

  const checkBackend = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setStatus(response.data.status || "Connected");
    } catch {
      setStatus("Not connected");
    }
  };

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

  // Reusable interview question display
  const renderQuestions = (questions, category) => {
    if (!questions || questions.length === 0) {
      return <p className="empty-message">No questions available.</p>;
    }

    return (
      <div className="analysis-card">
        <h3>{category}</h3>

        {questions.map((item, index) => (
          <details className="interview-question" key={index}>
            <summary>
              <strong>
                {index + 1}. {item.question}
              </strong>
              {item.topic && <span className="score-label">{item.topic}</span>}
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
        ))}
      </div>
    );
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "resume", label: "Resume Analyzer", icon: "▤" },
    { id: "matcher", label: "Job Matcher", icon: "⌕" },
    { id: "interview", label: "Interview Prep", icon: "◎" },
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
            <div className="user-avatar">AI</div>
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
                <span className="feature-tag">03 / PREPARE</span>
                <h3>Interview Prep</h3>
                <p>
                  Generate personalized technical, resume-based, and HR
                  interview questions.
                </p>
                <span className="feature-link">Prepare interview <span>→</span></span>
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

                <p className="interview-instruction">
                  Expand a question to view its sample answer and follow-up
                  questions.
                </p>

                {renderQuestions(
                  interviewData.technical_questions,
                  "Technical Questions"
                )}

                {renderQuestions(
                  interviewData.resume_questions,
                  "Resume and Project Questions"
                )}

                {renderQuestions(
                  interviewData.hr_questions,
                  "HR and Behavioral Questions"
                )}
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
    <div className="preview-heading">
  <div>
    <h3>Live Resume Preview</h3>
    <span>Updates automatically</span>
  </div>

  <button
    type="button"
    className="download-resume-button"
    onClick={handleDownloadResume}
  >
    ↓ Download PDF
  </button>
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
    </div>
  );
}

export default App;
