import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPOS_BASE_DIR = "downloaded_repos"
# Available Models
AVAILABLE_MODELS = {
    "gemini-2.5-flash": "Gemini 2.5 Flash (Fast & Cheap)",
    "gemini-2.0-flash": "Gemini 2.0 Flash (Balanced)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (Best Reasoning)",
}

# Default
DEFAULT_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "models/text-embedding-004"

# ChromaDB Persistence Directory (It will create this folder)
CHROMA_DB_PATH = "chroma_db_store"

# Text Splitting
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Models
GENERATION_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "models/text-embedding-004"