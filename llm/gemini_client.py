import google.generativeai as genai
import time
from config.settings import GEMINI_API_KEY, GENERATION_MODEL, EMBEDDING_MODEL
from config.settings import DEFAULT_MODEL

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

genai.configure(api_key=GEMINI_API_KEY)

def ask_gemini(system_prompt: str, user_prompt: str, model_name: str = DEFAULT_MODEL) -> str:
    try:
        # Use the requested model
        model = genai.GenerativeModel(model_name)
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"Error communicating with Gemini ({model_name}): {str(e)}"
    
def get_embedding(text: str) -> list:
    """
    Generates a vector embedding for a given text.
    Includes a retry mechanism and rate limit handling.
    """
    retries = 3
    for attempt in range(retries):
        try:
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text,
                task_type="retrieval_document",
                title="Code Snippet"
            )
            return result['embedding']
        except Exception as e:
            if "429" in str(e): # Rate limit error
                time.sleep(2) # Wait 2 seconds and try again
                continue
            print(f"Error generating embedding: {e}")
            return []
    return []

def get_query_embedding(text: str) -> list:
    """
    Embeds the user question (Task Type is different for queries).
    """
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error embedding query: {e}")
        return []