import time
import os
from typing import List, Dict
from config.settings import CHUNK_SIZE
from llm.gemini_client import get_embedding
from db.vector_store import VectorStore
# Import the new smart chunker
from indexing.smart_splitter import smart_chunk_code

def load_file_content(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        return ""

def make_documents(file_paths: List[str]) -> List[Dict]:
    docs = []
    for path in file_paths:
        content = load_file_content(path)
        if not content.strip():
            continue
        docs.append({"path": path, "content": content})
    return docs

def build_index(documents: List[Dict]):
    """
    Generates embeddings and saves them to ChromaDB.
    """
    store = VectorStore()
    store.clear_collection()
    
    raw_chunks = []
    
    # --- CHANGED: Use Smart Chunking ---
    for doc in documents:
        text = doc["content"]
        path = doc["path"]
        _, ext = os.path.splitext(path)
        
        # Call the new smart chunker
        # It handles context injection automatically
        chunks = smart_chunk_code(text, ext, CHUNK_SIZE)
        
        for i, ch in enumerate(chunks):
            raw_chunks.append({
                "path": path,
                "chunk_id": i,
                "chunk": ch
            })
    # -----------------------------------

    total_chunks = len(raw_chunks)
    print(f"Generated {total_chunks} smart chunks. Starting embedding generation...")

    batch = []
    for i, item in enumerate(raw_chunks):
        if i % 10 == 0:
            print(f"Processing chunk {i}/{total_chunks}...")
        
        vector = get_embedding(item["chunk"])
        if vector:
            item["embedding"] = vector
            batch.append(item)
        
        if len(batch) >= 50:
            store.add_documents(batch)
            batch = []
        
        time.sleep(0.1) 

    if batch:
        store.add_documents(batch)

    print("Indexing to ChromaDB complete.")