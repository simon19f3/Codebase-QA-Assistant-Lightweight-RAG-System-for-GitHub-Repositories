import time
import os
import json      # For parsing .ipynb
from pypdf import PdfReader # For parsing .pdf
from typing import List, Dict
from config.settings import CHUNK_SIZE
from llm.gemini_client import get_embedding
from db.vector_store import VectorStore
from indexing.smart_splitter import smart_chunk_code

# --- NEW: Specialized Loaders ---

def load_ipynb_content(path: str) -> str:
    """Reads a Jupyter Notebook and converts it to a clean script format."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            notebook = json.load(f)
        
        text_content = []
        for cell in notebook.get("cells", []):
            cell_type = cell.get("cell_type", "")
            source = cell.get("source", [])
            
            # Combine lines in the cell
            cell_text = "".join(source)
            
            if cell_type == "code":
                text_content.append(f"# [CODE CELL]\n{cell_text}")
            elif cell_type == "markdown":
                text_content.append(f"# [MARKDOWN]\n{cell_text}")
                
        return "\n\n".join(text_content)
    except Exception as e:
        print(f"Error parsing .ipynb {path}: {e}")
        return ""

def load_pdf_content(path: str) -> str:
    """Extracts text from a PDF file."""
    try:
        reader = PdfReader(path)
        text_content = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error parsing PDF {path}: {e}")
        return ""

# --- Updated General Loader ---

def load_file_content(path: str) -> str:
    _, ext = os.path.splitext(path)
    ext = ext.lower()
    
    # 1. Handle Notebooks
    if ext == ".ipynb":
        return load_ipynb_content(path)
    
    # 2. Handle PDFs
    if ext == ".pdf":
        return load_pdf_content(path)
    
    # 3. Handle Standard Text Files
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        # Fallback for other binary files that might have slipped through
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
    store = VectorStore()
    store.clear_collection()
    
    raw_chunks = []
    
    for doc in documents:
        text = doc["content"]
        path = doc["path"]
        _, ext = os.path.splitext(path)
        
        # 1. Get structured chunks (dict) instead of strings
        chunks_data = smart_chunk_code(text, ext, CHUNK_SIZE)
        
        for i, data in enumerate(chunks_data):
            raw_chunks.append({
                "path": path,
                "chunk_id": i,
                "chunk": data["text"],
                # 2. Save Line Metadata
                "start_line": data["start_line"],
                "end_line": data["end_line"]
            })

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