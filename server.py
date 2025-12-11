import os
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import your existing modules
from github_client.fetch_repo import download_repo_zip
from indexing.file_scanner import scan_repo_files
from indexing.index_builder import make_documents, build_index
from qa.qa_engine import answer_question

app = FastAPI(title="Codebase AI Assistant")

# Allow CORS so the React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the index in memory
# In a real production app, use a Vector DB (Chroma, Pinecone, etc.)
GLOBAL_INDEX: List[Dict] = []
CURRENT_REPO_PATH: str = ""

class RepoRequest(BaseModel):
    github_url: str

class ChatRequest(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"status": "running"}

@app.post("/api/load-repo")
def load_repo(request: RepoRequest):
    global GLOBAL_INDEX, CURRENT_REPO_PATH
    
    try:
        print(f"Downloading repo: {request.github_url}...")
        repo_root = download_repo_zip(request.github_url)
        CURRENT_REPO_PATH = repo_root
        
        print("Scanning files...")
        file_paths = scan_repo_files(repo_root)
        
        print(f"Found {len(file_paths)} supported files. Indexing...")
        docs = make_documents(file_paths)
        GLOBAL_INDEX = build_index(docs)
        
        return {
            "message": "Repository indexed successfully",
            "files_count": len(file_paths),
            "chunks_count": len(GLOBAL_INDEX)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat(request: ChatRequest):
    global GLOBAL_INDEX
    
    if not GLOBAL_INDEX:
        raise HTTPException(status_code=400, detail="No repository loaded. Please load a repo first.")
    
    try:
        answer = answer_question(request.query, GLOBAL_INDEX)
        return {"answer": answer}
    except Exception as e:
        print(f"Error generating answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    