from typing import List, Dict
import os
from config.settings import CHUNK_SIZE, CHUNK_OVERLAP
from llm.gemini_client import get_embedding

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
        docs.append({
            "path": path,
            "content": content,
        })
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

def build_index(documents: List[Dict]) -> List[Dict]:
    """
    1. Chunks the text.
    2. Generates Embeddings for each chunk.
    3. Returns list of dicts with 'embedding' key.
    """
    index = []
    total_chunks = 0
    
    # 1. First, flatten all documents into chunks
    all_chunks_data = []
    
    for doc in documents:
        text = doc["content"]
        path = doc["path"]
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        
        for i, ch in enumerate(chunks):
            all_chunks_data.append({
                "path": path,
                "chunk_id": i,
                "chunk": ch
            })

    total_chunks = len(all_chunks_data)
    print(f"Generated {total_chunks} text chunks. Starting embedding generation...")

    # 2. Generate embeddings (Batching is better, but doing sequential for simplicity)
    # Note: Gemini has rate limits. If this fails on large repos, we need batching + sleep.
    
    for i, item in enumerate(all_chunks_data):
        # Progress log every 10 chunks
        if i % 10 == 0:
            print(f"Embedding chunk {i+1}/{total_chunks}...")
            
        vector = get_embedding(item["chunk"])
        
        if vector:
            item["embedding"] = vector
            index.append(item)
    
    print("Indexing complete.")
    return index