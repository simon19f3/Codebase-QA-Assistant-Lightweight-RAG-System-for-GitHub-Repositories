import os
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from github_client.fetch_repo import download_repo_zip
from indexing.file_scanner import scan_repo_files
from indexing.index_builder import make_documents, build_index
from qa.qa_engine import answer_question
# We no longer need pickle or GLOBAL_INDEX

app = FastAPI(title="Codebase AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    github_url: str

class ChatRequest(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"status": "running", "db": "ChromaDB"}

@app.post("/api/load-repo")
def load_repo(request: RepoRequest):
    try:
        print(f"Downloading repo: {request.github_url}...")
        repo_root = download_repo_zip(request.github_url)
        
        print("Scanning files...")
        file_paths = scan_repo_files(repo_root)
        
        print(f"Found {len(file_paths)} supported files. Indexing & Embedding...")
        docs = make_documents(file_paths)
        
        # build_index now saves directly to ChromaDB
        build_index(docs)
        
        return {
            "message": "Repository indexed to ChromaDB",
            "files_count": len(file_paths),
            "chunks_count": "Stored in DB"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat(request: ChatRequest):
    # No need to check for GLOBAL_INDEX.
    # We could add a check if DB is empty, but Chroma handles empty queries gracefully.
    try:
        # We don't pass an index anymore
        answer = answer_question(request.query)
        return {"answer": answer}
    except Exception as e:
        print(f"Error generating answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)