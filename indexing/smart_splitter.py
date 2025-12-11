import re
from typing import List, Tuple

# Regex patterns to identify logical boundaries in code
# We use lookahead (?=...) to split *before* the keyword, keeping it in the next chunk.
LANGUAGE_PATTERNS = {
    # Python
    ".py": {
        "separators": [r'(?=\nclass\s)', r'(?=\ndef\s)', r'(?=\n@\w+)'], 
        "imports": r'^(import\s|from\s)',
        "comment": r'#'
    },
    # JavaScript / TypeScript
    ".js": {
        "separators": [r'(?=\nclass\s)', r'(?=\nfunction\s)', r'(?=\nconst\s.*=\s.*=>)', r'(?=\nexport\s)'],
        "imports": r'^(import\s|require\()',
        "comment": r'//'
    },
    ".ts": {
        "separators": [r'(?=\nclass\s)', r'(?=\ninterface\s)', r'(?=\nfunction\s)', r'(?=\nconst\s.*=\s.*=>)', r'(?=\nexport\s)'],
        "imports": r'^(import\s|require\()',
        "comment": r'//'
    },
    # Java / C#
    ".java": {
        "separators": [r'(?=\npublic\sclass\s)', r'(?=\nclass\s)', r'(?=\npublic\svoid\s)', r'(?=\nprivate\svoid\s)', r'(?=\nprotected\svoid\s)'],
        "imports": r'^(import\s|package\s)',
        "comment": r'//'
    },
    # Go
    ".go": {
        "separators": [r'(?=\nfunc\s)', r'(?=\ntype\s)'],
        "imports": r'^(import\s|package\s)',
        "comment": r'//'
    },
}

DEFAULT_PATTERN = {
    "separators": [r'\n\n'], # Fallback: split by double newlines
    "imports": r'^$',
    "comment": r''
}

def extract_imports(text: str, import_pattern: str) -> str:
    """
    Extracts import lines from the top of the file to use as context headers.
    """
    if not import_pattern or import_pattern == r'^$':
        return ""
    
    lines = text.split('\n')
    import_lines = []
    # Only check the first 50 lines for imports/package declarations
    for line in lines[:50]:
        if re.match(import_pattern, line.strip()):
            import_lines.append(line)
    
    return "\n".join(import_lines)

def naive_chunk(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Fallback for when code blocks are too large."""
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunks.append(text[start:end])
        if end == length:
            break
        start = end - overlap
        if start < 0: start = 0
    return chunks

def smart_chunk_code(text: str, ext: str, chunk_size: int = 1000) -> List[str]:
    """
    Splits code by logical boundaries and prepends context (imports).
    """
    config = LANGUAGE_PATTERNS.get(ext.lower(), DEFAULT_PATTERN)
    
    # 1. Extract File Context (Imports/Package info)
    file_context = extract_imports(text, config["imports"])
    context_len = len(file_context)
    
    # 2. Split by logical separators
    # We combine all regex separators into one pattern
    combined_pattern = "|".join(config["separators"])
    
    if combined_pattern:
        # Split but keep the delimiters (due to lookahead in regex)
        raw_blocks = re.split(combined_pattern, text)
    else:
        raw_blocks = text.split("\n\n")

    # 3. Merge blocks until they hit chunk_size
    final_chunks = []
    current_chunk = ""
    
    for block in raw_blocks:
        if not block.strip():
            continue
            
        # If adding this block exceeds size, save current_chunk and start new
        if len(current_chunk) + len(block) + context_len > chunk_size:
            if current_chunk:
                final_chunks.append(f"{file_context}\n\n...[Context]...\n\n{current_chunk}")
                current_chunk = ""
            
            # EDGE CASE: If the single block itself is huge (larger than chunk_size)
            # we must fall back to naive splitting for this specific block
            if len(block) + context_len > chunk_size:
                sub_chunks = naive_chunk(block, chunk_size - context_len, overlap=100)
                for sub in sub_chunks:
                    final_chunks.append(f"{file_context}\n\n...[Large Block Split]...\n\n{sub}")
            else:
                current_chunk = block
        else:
            # Append to current
            current_chunk += block

    # Add the last remaining chunk
    if current_chunk:
        final_chunks.append(f"{file_context}\n\n...[Context]...\n\n{current_chunk}")

    return final_chunks