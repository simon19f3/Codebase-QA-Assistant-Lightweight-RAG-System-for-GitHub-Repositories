import os
from typing import List

# ADD .ipynb and .pdf to this list
SUPPORTED_EXTENSIONS = [
    ".py", ".js", ".ts", ".tsx",
    ".java", ".go", ".cs",
    ".php", ".rb", ".rs",
    ".cpp", ".c", ".h", ".hpp",
    ".md", ".txt", ".rst", ".yaml", ".yml",
    ".ipynb", ".pdf"  # <--- NEW EXTENSIONS
]

def is_supported_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in SUPPORTED_EXTENSIONS

def scan_repo_files(repo_root: str) -> List[str]:
    """
    Return list of absolute paths of supported files in repo.
    """
    file_paths = []
    for root, dirs, files in os.walk(repo_root):
        # Skip hidden/system directories
        dirs[:] = [
            d for d in dirs
            if d not in (".git", "node_modules", "__pycache__", ".idea", ".vscode", "venv", "env")
        ]
        for fn in files:
            if is_supported_file(fn):
                file_paths.append(os.path.join(root, fn))
    return file_paths