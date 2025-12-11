import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
REPOS_BASE_DIR = "downloaded_repos"

# ChromaDB Persistence Directory (It will create this folder)
CHROMA_DB_PATH = "chroma_db_store"

# Text Splitting
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Models
GENERATION_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "models/text-embedding-004"