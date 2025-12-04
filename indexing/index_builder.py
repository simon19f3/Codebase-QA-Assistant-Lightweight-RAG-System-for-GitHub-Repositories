# indexing/index_builder.py
from typing import List, Dict
import os
from config.settings import CHUNK_SIZE, CHUNK_OVERLAP

def load_file_content(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        # skip binary or weird encoded files
        return ""

def make_documents(file_paths: List[str]) -> List[Dict]:
    """
    Convert each file into a document dict with metadata.
    """
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
    """
    Simple sliding-window chunking.
    """
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
    Returns list of chunk dicts:
    { "path": ..., "chunk": ..., "chunk_id": ... }
    """
    index = []
    for doc in documents:
        text = doc["content"]
        path = doc["path"]
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        for i, ch in enumerate(chunks):
            index.append({
                "path": path,
                "chunk_id": i,
                "chunk": ch,
            })
    return index
