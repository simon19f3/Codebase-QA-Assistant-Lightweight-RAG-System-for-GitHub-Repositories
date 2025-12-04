# indexing/file_scanner.py
import os
from typing import List

SUPPORTED_EXTENSIONS = [
    ".py", ".js", ".ts", ".tsx",
    ".java", ".go", ".cs",
    ".php", ".rb", ".rs",
    ".cpp", ".c", ".h", ".hpp",
    ".md", ".txt", ".rst", ".yaml", ".yml",
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
        # optional: skip .git, node_modules, etc.
        dirs[:] = [
            d for d in dirs
            if d not in (".git", "node_modules", "__pycache__", ".idea", ".vscode")
        ]
        for fn in files:
            if is_supported_file(fn):
                file_paths.append(os.path.join(root, fn))
    return file_paths
