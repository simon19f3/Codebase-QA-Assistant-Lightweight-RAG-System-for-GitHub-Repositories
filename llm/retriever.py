# llm/retriever.py
from typing import List, Dict
import re

def score_chunk(query: str, chunk: str) -> int:
    """
    Very simple scoring – counts occurrences of important words.
    """
    query_words = re.findall(r"\w+", query.lower())
    score = 0
    lower_chunk = chunk.lower()
    for w in query_words:
        if len(w) < 3:
            continue
        score += lower_chunk.count(w)
    return score

def retrieve_relevant_chunks(query: str, index: List[Dict], top_k: int = 5) -> List[Dict]:
    scored = []
    for item in index:
        s = score_chunk(query, item["chunk"])
        if s > 0:
            scored.append((s, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]
 