# main.py
import os
from github_client.fetch_repo import download_repo_zip
from indexing.file_scanner import scan_repo_files
from indexing.index_builder import make_documents, build_index
from qa.qa_engine import answer_question

def build_repo_index(github_url: str):
    print(f"Downloading repo: {github_url}")
    repo_root = download_repo_zip(github_url)
    print(f"Repo downloaded to: {repo_root}")

    print("Scanning files...")
    file_paths = scan_repo_files(repo_root)
    print(f"Found {len(file_paths)} files.")

    print("Building documents...")
    docs = make_documents(file_paths)

    print("Building index...")
    index = build_index(docs)
    print(f"Index contains {len(index)} chunks.")

    return index

def main():
    github_url = input("Enter GitHub repository URL: ").strip()
    index = build_repo_index(github_url)

    print("\nCodebase QA Assistant is ready.")
    print("Type your question (or 'exit' to quit):\n")

    while True:
        q = input(">> ")
        if q.lower() in ("exit", "quit"):
            break
        answer = answer_question(q, index)
        print("\n--- Answer ---")
        print(answer)
        print("--------------\n")

if __name__ == "__main__":
    main()
