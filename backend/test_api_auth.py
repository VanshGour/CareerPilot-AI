from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_auth_and_db_flow():
    # 1. Signup
    signup_data = {
        "email": "candidate_test@example.com",
        "password": "Password123!",
        "full_name": "Test Candidate"
    }
    res_signup = client.post("/auth/signup", json=signup_data)
    assert res_signup.status_code in [201, 400]
    
    # 2. Login
    login_data = {
        "email": "candidate_test@example.com",
        "password": "Password123!"
    }
    res_login = client.post("/auth/login", json=login_data)
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    token_json = res_login.json()
    token = token_json["access_token"]
    assert token is not None
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Get profile
    res_me = client.get("/auth/me", headers=headers)
    assert res_me.status_code == 200
    user_data = res_me.json()
    assert user_data["email"] == "candidate_test@example.com"
    print("User authenticated successfully:", user_data["full_name"])
    
    # 4. Create Job Application
    app_data = {
        "company": "Google",
        "role": "Software Engineer",
        "status": "Applied",
        "location": "Remote",
        "salary_range": "$120k - $160k",
        "notes": "Applied via referral"
    }
    res_app = client.post("/applications", json=app_data, headers=headers)
    assert res_app.status_code == 201
    created_app = res_app.json()
    app_id = created_app["id"]
    print("Created application id:", app_id)
    
    # 5. List applications
    res_apps = client.get("/applications", headers=headers)
    assert res_apps.status_code == 200
    apps_list = res_apps.json()
    assert len(apps_list) >= 1
    
    # 6. Update application status
    res_update = client.put(f"/applications/{app_id}", json={"status": "Interview", "notes": "Interview scheduled for next Tuesday"}, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "Interview"
    print("Updated application status to Interview successfully.")
    
    # 7. Save resume
    resume_payload = {
        "title": "Software Engineer Resume 2026",
        "builder_data": '{"name": "Test Candidate", "skills": "Python, React, SQL"}'
    }
    res_save_resume = client.post("/resumes/save", json=resume_payload, headers=headers)
    assert res_save_resume.status_code == 200
    saved_resume = res_save_resume.json()
    print("Saved resume id:", saved_resume["id"])
    
    # 8. List saved resumes
    res_resumes = client.get("/resumes", headers=headers)
    assert res_resumes.status_code == 200
    assert len(res_resumes.json()) >= 1
    print("All backend auth & DB integration tests passed successfully!")

if __name__ == "__main__":
    test_full_auth_and_db_flow()
