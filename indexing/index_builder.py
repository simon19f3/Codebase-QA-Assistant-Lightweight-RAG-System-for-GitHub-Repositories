import time
from typing import List, Dict
from config.settings import CHUNK_SIZE, CHUNK_OVERLAP
from llm.gemini_client import get_embedding
from db.vector_store import VectorStore # Import the new DB class

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

def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunks.append(text[start:end])
        if end == length:
            break
        start = end - overlap
        if start < 0:
            start = 0
    return chunks

def build_index(documents: List[Dict]):
    """
    Generates embeddings and saves them to ChromaDB.
    No longer returns a list; saves directly to DB.
    """
    # 1. Initialize DB and clear old data (since we are loading a NEW repo)
    store = VectorStore()
    store.clear_collection()
    
    # 2. Chunking
    raw_chunks = []
    for doc in documents:
        text = doc["content"]
        path = doc["path"]
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        for i, ch in enumerate(chunks):
            raw_chunks.append({
                "path": path,
                "chunk_id": i,
                "chunk": ch
            })

    total_chunks = len(raw_chunks)
    print(f"Generated {total_chunks} text chunks. Starting embedding generation...")

    # 3. Embed & Save Loop
    # We will accumulate a batch and save it to reduce DB calls
    batch = []
    
    for i, item in enumerate(raw_chunks):
        if i % 10 == 0:
            print(f"Processing chunk {i}/{total_chunks}...")
        
        vector = get_embedding(item["chunk"])
        if vector:
            item["embedding"] = vector
            batch.append(item)
        
        # Save every 50 chunks to DB to be safe
        if len(batch) >= 50:
            store.add_documents(batch)
            batch = []
        
        time.sleep(0.1) # Rate limiting

    # Save remaining
    if batch:
        store.add_documents(batch)

    print("Indexing to ChromaDB complete.")