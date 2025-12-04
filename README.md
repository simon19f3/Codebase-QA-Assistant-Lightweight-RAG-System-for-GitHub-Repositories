🚀 Codebase QA Assistant

A lightweight Retrieval-Augmented Generation (RAG) system that lets you query any GitHub repository using natural language.
Ask questions like:

"Where is user authentication handled?"

"Explain how this API endpoint works."

"Which functions use this variable?"

The system downloads a repository, indexes its source code & docs, retrieves relevant chunks, and uses Gemini to answer your questions.

📌 Features

🔗 GitHub Repo Loader — automatically fetches and scans any public repo

📂 File Scanner — reads source code, documentation, and comments

🧩 Text Chunking — splits large files into search-friendly segments

🔍 Vector-Free Retrieval — keyword relevance scoring 

🤖 LLM Response Generation — uses Google Gemini REST API


🧰 Installation 

1️⃣ Clone the project
`git clone https://github.com/yourname/codebasegpt.git`
`cd codebasegpt`
`
2️⃣ Create & activate a virtual environment
`python -m venv venv`
`venv\Scripts\activate`

3️⃣ Install dependencies
`pip install -r requirements.txt`

🔑 Setup Gemini API Key

Set your environment variable:

setx GEMINI_API_KEY "your_api_key_here"


Restart the terminal after setting it.

To verify Gemini works:

python test_gemini.py

🤖 Run the Codebase QA Assistant
`python main.py`


You will be asked:

GitHub repo URL

A natural-language question

Example:

`Enter GitHub URL: https://github.com/vercel/next.js`
`Your question: Where is routing logic implemented?`

🧠 How It Works (Beginner Friendly)

Download GitHub Repo
The tool fetches the repo into a local folder.

Scan Files
It reads .py, .js, .ts, .md, and other text-based files.

Chunking
Large files are split into smaller segments (chunks) so the model can understand them better.

Retrieval
The system finds the most relevant chunks using simple keyword matching (no vector DB needed).

LLM Answering
The selected code chunks + question are sent to Gemini, which produces a human-friendly answer.

✔️ What This Project Demonstrates

A working RAG pipeline 

Modular Python architecture

Gemini REST API integration

Practical codebase question-answering



📜 License

MIT License — free to use, modify, and distribute.