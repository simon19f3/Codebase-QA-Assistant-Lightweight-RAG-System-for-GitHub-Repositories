import os
import shutil
import stat
import time
import zipfile
import requests
from urllib.parse import urlparse
from config.settings import REPOS_BASE_DIR, GITHUB_TOKEN

# --- 1. Add this Helper Function ---
def remove_readonly(func, path, excinfo):
    """
    Error handler for shutil.rmtree.
    If the file is read-only (Git behavior), change it to writable and retry.
    """
    os.chmod(path, stat.S_IWRITE)
    func(path)

def _extract_repo_full_name(github_url: str) -> str:
    parsed = urlparse(github_url)
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")
    return f"{parts[0]}/{parts[1]}"

def get_default_branch(user: str, repo: str, headers: dict) -> str:
    # ... (Keep existing get_default_branch logic unchanged) ...
    # (Copy the code from previous steps or keep your existing function)
    api_url = f"https://api.github.com/repos/{user}/{repo}"
    try:
        resp = requests.get(api_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return resp.json().get("default_branch", "main")
        return "main"
    except:
        return "main"

def download_repo_zip(github_url: str) -> str:
    os.makedirs(REPOS_BASE_DIR, exist_ok=True)

    full_name = _extract_repo_full_name(github_url)
    user, repo = full_name.split("/")

    # Headers setup (Keep existing)
    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        headers["Accept"] = "application/vnd.github.v3+json"

    branch = get_default_branch(user, repo, headers)
    
    zip_url = f"https://github.com/{user}/{repo}/archive/refs/heads/{branch}.zip"
    print(f"Downloading from: {zip_url}")
    
    resp = requests.get(zip_url, headers=headers, stream=True)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to download repo. Status: {resp.status_code}")

    zip_path = os.path.join(REPOS_BASE_DIR, f"{repo}.zip")
    with open(zip_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    extract_dir = os.path.join(REPOS_BASE_DIR, repo)
    
    # --- 2. ROBUST DELETION LOGIC ---
    if os.path.exists(extract_dir):
        print(f"Cleaning up old directory: {extract_dir}")
        # Try to delete. If it fails, wait 1s and try again (helps with Windows locks)
        try:
            shutil.rmtree(extract_dir, onclick=remove_readonly)
        except Exception:
            time.sleep(1)
            shutil.rmtree(extract_dir, onerror=remove_readonly)
            
    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_dir)

    all_items = os.listdir(extract_dir)
    valid_subdirs = [
        d for d in all_items 
        if os.path.isdir(os.path.join(extract_dir, d)) 
        and not d.startswith("__") 
        and not d.startswith(".")
    ]

    if not valid_subdirs:
        # Fallback if zip structure is flat
        return extract_dir

    repo_root = os.path.join(extract_dir, valid_subdirs[0])
    return repo_root