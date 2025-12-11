from typing import List, Dict
from llm.gemini_client import get_query_embedding
from db.vector_store import VectorStore

def retrieve_relevant_chunks(query: str, top_k: int = 5) -> List[Dict]:
    """
    1. Embeds query.
    2. Searches ChromaDB.
    """
    # 1. Get query vector
    query_vector = get_query_embedding(query)
    if not query_vector:
        print("Failed to embed query.")
        return []

    # 2. Search DB
    store = VectorStore() # Connects to existing DB
    results = store.search(query_vector, top_k=top_k)
    
    return results