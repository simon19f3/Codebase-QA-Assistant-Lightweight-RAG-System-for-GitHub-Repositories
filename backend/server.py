import os
import json
import gc
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from github_client.fetch_repo import download_repo_zip
from indexing.file_scanner import scan_repo_files
from indexing.index_builder import make_documents, build_index
from qa.qa_engine import answer_question, generate_repo_overview

app = FastAPI(title="Codebase AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPO_INFO_PATH = "repo_metadata.json"

class RepoRequest(BaseModel):
    github_url: str
    reindex: bool = False

class ChatRequest(BaseModel):
    query: str
    model: str = "gemini-2.5-flash"

def get_current_repo_info():
    if os.path.exists(REPO_INFO_PATH):
        try:
            with open(REPO_INFO_PATH, "r") as f:
                return json.load(f)
        except:
            return None
    return None

# UPDATED: Save summary as well
def save_repo_info(url: str, files: int, summary: str, file_paths: List[str]):
    with open(REPO_INFO_PATH, "w") as f:
        json.dump({
            "url": url, 
            "files_count": files, 
            "summary": summary,
            "file_paths": file_paths # <--- Store the list here
        }, f)

@app.get("/")

def health_check():
    info = get_current_repo_info()
    return {"status": "running", "active_repo": info}

@app.post("/api/load-repo")
def load_repo(request: RepoRequest):
    summary = None
    file_paths = []
    gc.collect()

    try:
        # 1. Check Cache
        current_info = get_current_repo_info()
        
        # FIX 2: Relaxed Cache Check
        # We check if the URL matches. We trust the metadata file if it exists.
        if (not request.reindex and 
            current_info and 
            current_info.get("url") == request.github_url):
            
            print(f"Skipping re-index. {request.github_url} is already active.")
            
            # Retrieve cached data
            cached_summary = current_info.get("summary", "")
            cached_files_count = current_info.get("files_count", 0)
            # FIX 3: Retrieve cached file paths so the UI can build the tree
            cached_file_paths = current_info.get("file_paths", [])
            
            return {
                "message": "Repository already active (Cached)",
                "files_count": cached_files_count,
                "chunks_count": "Stored in DB",
                "summary": cached_summary,
                "file_paths": cached_file_paths # <--- Return actual files!
            }

        # 2. Fresh Download & Index
        print(f"Downloading repo: {request.github_url}...")
        repo_root = download_repo_zip(request.github_url)
        
        print("Scanning files...")
        file_paths = scan_repo_files(repo_root)
        
        print(f"Found {len(file_paths)} supported files. Indexing & Embedding...")
        docs = make_documents(file_paths)
        
        build_index(docs)
        
        # 3. Generate Summary
        print("Generating repository overview...")
        summary = generate_repo_overview()
        
        # 4. Save metadata INCLUDING SUMMARY (Fix for Problem #1)
        save_repo_info(request.github_url, len(file_paths), summary, file_paths)
        
        return {
            "message": "Repository indexed and analyzed",
            "files_count": len(file_paths),
            "chunks_count": "Stored in DB",
            "summary": summary,
            "file_paths": file_paths
        }
        
    except Exception as e:
        print(f"Error: {e}")
        # Return a clean 500 error
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        answer = answer_question(request.query, model_name=request.model)
        return {"answer": answer}
    except Exception as e:
        print(f"Error generating answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)