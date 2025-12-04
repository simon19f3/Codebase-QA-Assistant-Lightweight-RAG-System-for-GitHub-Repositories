# config/settings.py
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in .env")

# Repo base directory (where we clone / download)
REPOS_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "repos")

# Chunking configuration
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
