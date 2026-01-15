import re
from typing import List, Dict, Any

# ... (Keep LANGUAGE_PATTERNS and extract_imports exactly as they were) ...
LANGUAGE_PATTERNS = {
    ".py": {
        "separators": [r'(?=\nclass\s)', r'(?=\ndef\s)', r'(?=\n@\w+)'], 
        "imports": r'^(import\s|from\s)',
        "comment": r'#'
    },
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
    ".java": {
        "separators": [r'(?=\npublic\sclass\s)', r'(?=\nclass\s)', r'(?=\npublic\svoid\s)', r'(?=\nprivate\svoid\s)', r'(?=\nprotected\svoid\s)'],
        "imports": r'^(import\s|package\s)',
        "comment": r'//'
    },
    ".go": {
        "separators": [r'(?=\nfunc\s)', r'(?=\ntype\s)'],
        "imports": r'^(import\s|package\s)',
        "comment": r'//'
    },
}

DEFAULT_PATTERN = {
    "separators": [r'\n\n'],
    "imports": r'^$',
    "comment": r''
}

def extract_imports(text: str, import_pattern: str) -> str:
    if not import_pattern or import_pattern == r'^$':
        return ""
    lines = text.split('\n')
    import_lines = []
    for line in lines[:50]:
        if re.match(import_pattern, line.strip()):
            import_lines.append(line)
    return "\n".join(import_lines)

# --- NEW: Helper for huge blocks ---
def naive_chunk_with_lines(text: str, start_line: int, chunk_size: int, overlap: int) -> List[Dict[str, Any]]:
    chunks = []
    start = 0
    length = len(text)
    
    while start < length:
        end = min(start + chunk_size, length)
        chunk_text = text[start:end]
        
        # Calculate line span for this sub-chunk
        # This is an approximation for sub-chunks, but better than nothing
        sub_lines = chunk_text.count('\n')
        chunk_end_line = start_line + sub_lines
        
        chunks.append({
            "text": chunk_text,
            "start_line": start_line,
            "end_line": chunk_end_line
        })
        
        if end == length:
            break
            
        # Calculate overlap adjustment
        start = end - overlap
        if start < 0: start = 0
        
        # Adjust start_line for the next loop based on what we skipped
        # (This is complex to get perfect in naive mode, so we approximate)
        start_line += sub_lines 

    return chunks

def smart_chunk_code(text: str, ext: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
    """
    Splits code and tracks line numbers.
    Returns list of dicts: {'text': str, 'start_line': int, 'end_line': int}
    """
    config = LANGUAGE_PATTERNS.get(ext.lower(), DEFAULT_PATTERN)
    
    file_context = extract_imports(text, config["imports"])
    context_len = len(file_context)
    
    combined_pattern = "|".join(config["separators"])
    
    if combined_pattern:
        raw_blocks = re.split(combined_pattern, text)
    else:
        raw_blocks = text.split("\n\n")

    final_chunks = []
    current_chunk = ""
    
    # Trackers
    current_line = 1
    chunk_start_line = 1
    
    for block in raw_blocks:
        if not block:
            continue
            
        block_len = len(block)
        block_lines = block.count('\n')
        
        # Check if adding this block exceeds size
        if len(current_chunk) + block_len + context_len > chunk_size:
            # 1. Save the CURRENT chunk
            if current_chunk:
                final_chunks.append({
                    "text": f"{file_context}\n\n...[Context]...\n\n{current_chunk}",
                    "start_line": chunk_start_line,
                    "end_line": chunk_start_line + current_chunk.count('\n')
                })
                current_chunk = ""
            
            # 2. Handle the NEW block
            # If the block itself is huge, split it naively
            if block_len + context_len > chunk_size:
                sub_chunks = naive_chunk_with_lines(block, current_line, chunk_size - context_len, 100)
                for sub in sub_chunks:
                    final_chunks.append({
                        "text": f"{file_context}\n\n...[Large Block Split]...\n\n{sub['text']}",
                        "start_line": sub['start_line'],
                        "end_line": sub['end_line']
                    })
                # Advance line counter
                current_line += block_lines
                chunk_start_line = current_line
            else:
                # Start a new standard chunk
                chunk_start_line = current_line
                current_chunk = block
                current_line += block_lines
        else:
            # Append to current
            if not current_chunk:
                chunk_start_line = current_line
            
            current_chunk += block
            current_line += block_lines

    # Add the last remaining chunk
    if current_chunk:
        final_chunks.append({
            "text": f"{file_context}\n\n# ... [End of File Context / Start of Chunk Lines] ...\n\n{current_chunk}",
            "start_line": chunk_start_line,
            "end_line": chunk_start_line + current_chunk.count('\n')
        })

    return final_chunks