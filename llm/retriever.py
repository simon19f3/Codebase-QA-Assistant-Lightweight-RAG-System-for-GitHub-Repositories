from typing import List, Dict
import numpy as np
import google.generativeai as genai
from config.settings import EMBEDDING_MODEL
from config.settings import GEMINI_API_KEY

# Ensure genai is configured (redundant if called from main, but safe)
genai.configure(api_key=GEMINI_API_KEY)

def get_query_embedding(text: str) -> list:
    """
    Embeds the query specifically for retrieval tasks.
    """
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error embedding query: {e}")
        return []

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Calculates cosine similarity between two vectors.
    """
    a = np.array(vec_a)
    b = np.array(vec_b)
    
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
        
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def retrieve_relevant_chunks(query: str, index: List[Dict], top_k: int = 5) -> List[Dict]:
    """
    1. Embeds the query.
    2. Calculates similarity with every chunk in the index.
    3. Returns top K matches.
    """
    if not index:
        return []

    # 1. Get query vector
    query_vector = get_query_embedding(query)
    if not query_vector:
        return []

    # 2. Score all chunks
    scored_chunks = []
    for item in index:
        # Skip if chunk failed to embed during indexing
        if "embedding" not in item or not item["embedding"]:
            continue
            
        score = cosine_similarity(query_vector, item["embedding"])
        scored_chunks.append((score, item))

    # 3. Sort by score (Highest first)
    scored_chunks.sort(key=lambda x: x[0], reverse=True)

    # Debug: Print top scores to see how confident the model is
    print(f"Top match score: {scored_chunks[0][0]:.4f}")

    # Return top K chunks
    return [item for _, item in scored_chunks[:top_k]]