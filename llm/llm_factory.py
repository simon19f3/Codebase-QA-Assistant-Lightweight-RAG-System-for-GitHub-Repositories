import os
from openai import OpenAI
import google.generativeai as genai
from config.settings import GEMINI_API_KEY

# Configure Gemini once
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def ask_llm(system_prompt: str, user_prompt: str, model_name: str) -> str:
    """
    Unified function to call any supported LLM.
    """
    
    # --- GOOGLE GEMINI ---
    if "gemini" in model_name:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            return response.text
        except Exception as e:
            return f"Gemini Error: {str(e)}"

    # --- OPENAI / DEEPSEEK / GROK ---
    # These all use the OpenAI Client structure
    
    api_key = None
    base_url = None
    
    if "gpt" in model_name or "o1" in model_name:
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = "https://api.openai.com/v1"
        
    elif "deepseek" in model_name:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        base_url = "https://api.deepseek.com"
        
    elif "grok" in model_name:
        api_key = os.getenv("GROK_API_KEY")
        base_url = "https://api.x.ai/v1"

    if not api_key:
        return f"Error: Missing API Key for {model_name}. Check your .env file."

    try:
        client = OpenAI(api_key=api_key, base_url=base_url)
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Provider Error ({model_name}): {str(e)}"