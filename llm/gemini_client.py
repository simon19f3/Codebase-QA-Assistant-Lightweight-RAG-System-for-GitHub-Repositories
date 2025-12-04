# llm/gemini_client.py
import google.generativeai as genai
from config.settings import GEMINI_API_KEY

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

# Configure the SDK once
genai.configure(api_key=GEMINI_API_KEY)

# Choose a valid current model
MODEL_NAME = "gemini-2.5-flash"   # fast & cheap
# you can also try: MODEL_NAME = "gemini-1.5-pro"

def ask_gemini(system_prompt: str, user_prompt: str) -> str:
    """
    Sends a combined prompt to Gemini and returns the text answer.
    """
    model = genai.GenerativeModel(MODEL_NAME)

    # Recommended style: send as list of parts, but a single string is fine too
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    response = model.generate_content(full_prompt)

    # On recent SDK versions, response.text is where the text lives
    return response.text
