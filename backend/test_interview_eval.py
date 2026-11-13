from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_evaluate_answer():
    payload = {
        "question": "Explain how HashMap works in Java and how collisions are handled.",
        "user_answer": "HashMap stores key-value pairs using hashing. It computes the hash code of the key to find the bucket index. When collisions occur, it previously used a linked list, and in Java 8+ it converts the bucket into a balanced tree (Red-Black tree) once threshold is exceeded.",
        "topic": "Java Collections",
        "category": "technical",
        "job_description": "Senior Java Developer"
    }

    res = client.post("/evaluate-interview-answer", json=payload)
    print("Status code:", res.status_code)
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    print("Evaluation Result:")
    print("Score:", data["score"], "/ 10")
    print("Verdict:", data["verdict"])
    print("Feedback:", data["feedback"])
    print("Strengths:", data["strengths"])
    print("Improvements:", data["improvements"])
    print("Model Answer:", data["model_answer"][:100], "...")

if __name__ == "__main__":
    test_evaluate_answer()

