from typing import List, Dict
from llm.llm_factory import ask_llm 
from llm.retriever import retrieve_relevant_chunks

# --- UPDATED SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are a Codebase QA Assistant. 
You are answering questions about a specific GitHub repository's source code.
You will receive several code/documentation snippets (context). Use ONLY that context to answer.

IMPORTANT FORMATTING RULES:
1. When referencing file paths, function names, class names, or variables, YOU MUST wrap them in backticks (e.g., `main.py`, `run()`, `AppConfig`).
2. Do not just write the name text; make it a code span.
3. If you are not sure, say you are not sure.
4. Explain things clearly for a junior developer.

CRITICAL LINE NUMBER RULES:
- Each context chunk provided to you has two parts:
  1. **Global Context** (Imports/Headers): This appears at the VERY TOP. This code actually belongs to the START of the file (Line 1+), NOT the lines in the header.
  2. **The Chunk**: This appears after the separator `...[Context]...`.
- The "Lines: X-Y" header applies **ONLY** to the code **AFTER** the `...[Context]...` separator.
- When explaining the file, treat the imports as "File Header" and the code after the separator as "Lines X-Y".
"""

def build_context_snippet(chunks: List[Dict]) -> str:
    parts = []
    for c in chunks:
        # --- HEADER FORMAT ---
        lines_info = f"Lines: {c.get('start_line', '?')}-{c.get('end_line', '?')}"
        header = f"File: {c['path']} | {lines_info}"
        body = c["chunk"]
        parts.append(header + "\n" + body)
    return "\n\n---\n\n".join(parts)

def answer_question(query: str, model_name: str = "gemini-2.5-flash") -> str:
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

    answer = ask_llm(SYSTEM_PROMPT, user_prompt, model_name=model_name)
    return answer

# ... (generate_repo_overview remains the same) ...
# ... existing imports ...

def generate_repo_overview() -> str:
    """
    Generates a high-level summary covering specific architectural points.
    """
    query = "README.md architecture main entry point system design workflow components purpose diagram"
    relevant_chunks = retrieve_relevant_chunks(query, top_k=15)
    
    if not relevant_chunks:
        return "Unable to generate summary: No relevant documentation or entry points found."

    context_text = build_context_snippet(relevant_chunks)

    user_prompt = f"""
Based ONLY on the provided context, generate a **Technical Repository Overview**.

You MUST cover these 10 specific topics:
1. **Purpose and Scope**
2. **What the System Does**
3. **Core Workflow**

4. **System Architecture Image**: 
   - Generate a **Mermaid JS** diagram.
   - **CRITICAL SYNTAX RULE**: You **MUST** wrap all node labels in double quotes. 
     - Correct: `NodeID["Label Text (with parens)"]:::class`
     - Incorrect: `NodeID[Label Text (with parens)]:::class`
   - **Structure**: Use `graph TD`.
   
   - **Template Code (Use this structure)**:
     ```mermaid
     graph TD
      %% --- DEEPWIKI DARK THEME ---
      classDef user fill:#000000,stroke:#00e676,stroke-width:2px,color:#fff
      classDef frontend fill:#161b22,stroke:#3fb950,stroke-width:2px,color:#fff
      classDef backend fill:#161b22,stroke:#d2a8ff,stroke-width:2px,color:#fff
      classDef database fill:#161b22,stroke:#ff7b72,stroke-width:2px,color:#fff
      classDef external fill:#161b22,stroke:#79c0ff,stroke-width:2px,stroke-dasharray: 5 5,color:#fff
      
      %% --- NODES ---
      User(("User")):::user
      
      subgraph UI ["User Interface"]
        direction TB
        Client["Frontend Client"]:::frontend
      end
      
      subgraph Logic ["Backend Logic"]
        direction TB
        Server["API Server"]:::backend
        Engine["Processing Engine"]:::backend
      end
      
      subgraph Data ["Storage"]
        DB[("Database")]:::database
      end

      %% --- EDGES ---
      User --> Client
      Client --> Server
      Server --> Engine
      Engine --> DB
     ```
   
   - **Instructions**: 
     1. Replace generic nodes with ACTUAL files/classes from the repo.
     2. Ensure every node has a class styling (e.g., `:::backend`).
     3. **KEEP QUOTES around labels**.

5. **High-Level System Flow**
6. **System Components** (Wrap in backticks)
7. **CLI Mode** (Wrap in code blocks)
8. **Key Design Patterns**
9. **Technologies Used**
10. **Future Improvements**: 
    - CRITICAL INSTRUCTION: Do NOT say "No information provided".
    - You must ACT as a Senior Architect reviewing this code.
    - Suggest 3 concrete, technical improvements based on the code structure, missing features, or best practices (e.g., "Add unit tests", "Implement caching", "Add Docker support", "Refactor X module").

Context from repository:
{context_text}
    """

    answer = ask_llm(SYSTEM_PROMPT, user_prompt, model_name="gemini-2.5-flash")
    return answer