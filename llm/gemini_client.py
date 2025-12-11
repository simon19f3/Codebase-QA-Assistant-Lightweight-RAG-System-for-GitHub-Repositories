# llm/gemini_client.py
import google.generativeai as genai
from config.settings import GEMINI_API_KEY, EMBEDDING_MODEL

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

genai.configure(api_key=GEMINI_API_KEY)

# UPDATED MODEL NAME based on your list
MODEL_NAME = "gemini-2.5-flash"   # <--- CHANGED THIS

def ask_gemini(system_prompt: str, user_prompt: str) -> str:
    """
    Sends a combined prompt to Gemini and returns the text answer.
    """
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"Error communicating with Gemini: {str(e)}"

def get_embedding(text: str) -> list:
    """
    Generates a vector embedding for a given text using Gemini.
    """
    try:
        # Check if the embedding model needs to be updated too?
        # Usually "models/text-embedding-004" is standard, but if that fails
        # you might need to check available embedding models too.
        # For now, keep it as is since the error was about generateContent.
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document",
            title="Code Snippet"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []