
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

models = [
    "gemini-3.6-flash",
    "gemini-omni-1.1-flash",
    "gemini-4-argon"
]

for model in models:
    print(f"\nTesting: {model}")

    try:
        response = client.models.generate_content(
            model=model,
            contents="Reply with only: Gemini is working"
        )

        print("SUCCESS:", response.text)
        print("USE THIS MODEL:", model)
        break

    except Exception as error:
        print("FAILED:", error)
