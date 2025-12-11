# config/settings.py
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
REPOS_BASE_DIR = "downloaded_repos"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# This is the standard embedding model
EMBEDDING_MODEL = "models/text-embedding-004"