# test_gemini.py
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in .env")

genai.configure(api_key=api_key)

# IMPORTANT: use a model that exists on v1beta
MODEL_NAME = "gemini-2.5-flash" # v1beta-friendly text model

model = genai.GenerativeModel(MODEL_NAME)

resp = model.generate_content("Say hello in one sentence.")
print("RESPONSE:", resp.text)
