# github_client/fetch_repo.py
import os
import shutil
import zipfile
import requests
from urllib.parse import urlparse
from config.settings import REPOS_BASE_DIR

def _extract_repo_full_name(github_url: str) -> str:
    """
    Converts https://github.com/user/repo to user/repo
    """
    parsed = urlparse(github_url)
    # parsed.path = /user/repo or /user/repo/
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")
    return f"{parts[0]}/{parts[1]}"

def download_repo_zip(github_url: str) -> str:
    """
    Downloads the GitHub repo as a ZIP and extracts it into REPOS_BASE_DIR.
    Returns the local path to the extracted repo root.
    """
    os.makedirs(REPOS_BASE_DIR, exist_ok=True)

    full_name = _extract_repo_full_name(github_url)  # e.g. user/repo
    user, repo = full_name.split("/")

    zip_url = f"https://github.com/{user}/{repo}/archive/refs/heads/master.zip"

    resp = requests.get(zip_url, stream=True)
    if resp.status_code != 200:
        # try main branch
        zip_url = f"https://github.com/{user}/{repo}/archive/refs/heads/main.zip"
        resp = requests.get(zip_url, stream=True)
        if resp.status_code != 200:
            raise RuntimeError(f"Failed to download repo ZIP from GitHub. Status: {resp.status_code}")

    zip_path = os.path.join(REPOS_BASE_DIR, f"{repo}.zip")
    with open(zip_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    extract_dir = os.path.join(REPOS_BASE_DIR, repo)
    if os.path.exists(extract_dir):
        shutil.rmtree(extract_dir)
    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_dir)

    # Typically we get repo-main/ under extract_dir
    subdirs = [os.path.join(extract_dir, d) for d in os.listdir(extract_dir)]
    repo_root = [d for d in subdirs if os.path.isdir(d)][0]

    return repo_root
