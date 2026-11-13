from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_bullet_coach():
    payload = {
        "bullet_text": "Built a backend using Node.js and MongoDB and fixed bugs to make it faster.",
        "target_role": "Backend Engineer",
        "target_company": "Uber"
    }
    res = client.post("/coach-bullet", json=payload)
    print("Coach Bullet status:", res.status_code)
    assert res.status_code == 200, f"Error: {res.text}"
    data = res.json()
    print("Suggestions count:", len(data["suggestions"]))
    for s in data["suggestions"]:
        print(f"[{s['version_name']}] Power Verb: {s['power_verb']}")
        print(f" -> {s['text']}")
    print("Bullet Coach Passed Successfully!\n")

def test_ats_and_skill_gap():
    import fitz, io
    # Create an in-memory PDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), """
Alex Chen
Email: alex.chen@example.com | Phone: 555-0192 | San Francisco, CA | linkedin.com/in/alexchen

PROFESSIONAL SUMMARY
Full Stack Software Engineer with 3+ years of experience building Python and React applications.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks: FastAPI, React, Node.js, Express
Databases: PostgreSQL, MongoDB
Tools: Git, Linux, Docker

WORK EXPERIENCE
Software Engineer | Acme Technologies (2022 - Present)
- Developed scalable REST APIs using FastAPI and PostgreSQL handling 5,000 requests/minute.
- Built interactive frontend dashboards with React and Tailwind CSS.
- Automated deployment scripts and containerized services using Docker.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley (2018 - 2022)
""")
    pdf_bytes = doc.write()
    doc.close()

    job_desc = """
Senior Backend Engineer
We are seeking an experienced Backend Engineer to scale our fintech platform.
Required Skills:
- Python, FastAPI or Django
- PostgreSQL, Redis caching, Kafka message streams
- AWS cloud infrastructure (ECS, S3, RDS)
- Docker and Kubernetes container orchestration
- 4+ years of backend engineering experience
"""

    # Test ATS Checker
    files = {"resume": ("resume.pdf", pdf_bytes, "application/pdf")}
    data = {"job_description": job_desc}
    res_ats = client.post("/ats-checker", files=files, data=data)
    print("ATS Checker status:", res_ats.status_code)
    assert res_ats.status_code == 200, f"ATS failed: {res_ats.text}"
    ats_data = res_ats.json()
    print("ATS Score:", ats_data["ats_score"], f"({ats_data['grade']})")
    print("Formatting Score:", ats_data["formatting_score"])
    print("Missing Critical Keywords:", ats_data["missing_critical_keywords"])
    print("ATS Checklist count:", len(ats_data["action_checklist"]))

    # Test Skill Gap Analyzer
    files_gap = {"resume": ("resume.pdf", pdf_bytes, "application/pdf")}
    res_gap = client.post("/analyze-skill-gap", files=files_gap, data=data)
    print("\nSkill Gap status:", res_gap.status_code)
    assert res_gap.status_code == 200, f"Skill gap failed: {res_gap.text}"
    gap_data = res_gap.json()
    print("Match Percentage:", gap_data["match_percentage"], "%")
    print("Critical Missing Skills:", gap_data["critical_missing_skills"])
    print("Roadmap Weeks:", len(gap_data["roadmap"]))
    for week in gap_data["roadmap"]:
        print(f" Week {week['week_number']}: {week['theme']}")
    print("\nAll remaining backend milestone tests passed successfully!")

if __name__ == "__main__":
    test_bullet_coach()
    test_ats_and_skill_gap()
