from typing import List, Dict
from llm.gemini_client import ask_gemini
from llm.retriever import retrieve_relevant_chunks

SYSTEM_PROMPT = """
You are a Codebase QA Assistant. 
You are answering questions about a specific GitHub repository's source code.
You will receive several code/documentation snippets (context). Use ONLY that context to answer.

If you are not sure, say you are not sure.
When referencing code, mention the file path and, if possible, the function or class name.
Explain things clearly for a junior developer.
"""

def build_context_snippet(chunks: List[Dict]) -> str:
    parts = []
    for c in chunks:
        header = f"File: {c['path']} | Chunk ID: {c['chunk_id']}"
        body = c["chunk"]
        parts.append(header + "\n" + body)
    return "\n\n---\n\n".join(parts)

# Note: We removed the 'index' argument
def answer_question(query: str) -> str:
    relevant_chunks = retrieve_relevant_chunks(query, top_k=8)
    
    if not relevant_chunks:
        return "I could not find relevant code or docs for that question in this repository."

    context_text = build_context_snippet(relevant_chunks)

    user_prompt = f"""
User question:
{query}

Context from repository:
{context_text}
    """

    answer = ask_gemini(SYSTEM_PROMPT, user_prompt)
    return answer