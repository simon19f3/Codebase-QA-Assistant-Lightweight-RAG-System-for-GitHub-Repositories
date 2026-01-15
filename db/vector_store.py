import chromadb
from typing import List, Dict
from config.settings import CHROMA_DB_PATH

class VectorStore:
    def __init__(self):
        # Initialize Persistent Client
        self.client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        self._init_collection()

    def _init_collection(self):
        """Helper to ensure collection always exists"""
        self.collection = self.client.get_or_create_collection(
            name="codebase",
            metadata={"hnsw:space": "cosine"}
        )

    def clear_collection(self):
        """
        Safely clears the DB.
        """
        try:
            # Try to delete if it exists
            self.client.delete_collection("codebase")
        except ValueError:
            # "Collection not found" - that's fine, we wanted it gone anyway
            pass
        except Exception as e:
            print(f"Warning during DB clear: {e}")
        
        # Immediately recreate it so it's never missing
        self._init_collection()
        print("Database cleared and ready.")

    def add_documents(self, documents: List[Dict]):
        if not documents:
            return

        ids = []
        embeddings = []
        metadatas = []
        doc_texts = []

        for doc in documents:
            unique_id = f"{doc['path']}_{doc['chunk_id']}"
            ids.append(unique_id)
            embeddings.append(doc['embedding'])
            doc_texts.append(doc['chunk'])
            
            metadatas.append({
                "path": doc['path'],
                "chunk_id": doc['chunk_id'],
                "start_line": doc.get("start_line", 0),
                "end_line": doc.get("end_line", 0)
            })

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=doc_texts
        )
        print(f"Added {len(documents)} chunks to ChromaDB.")

    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
        try:
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )

            formatted_results = []
            if not results['ids'] or not results['ids'][0]:
                return []

            for i in range(len(results['ids'][0])):
                meta = results['metadatas'][0][i]
                formatted_results.append({
                    "chunk": results['documents'][0][i],
                    "path": meta["path"],
                    "chunk_id": meta["chunk_id"],
                    "start_line": meta.get("start_line", 0),
                    "end_line": meta.get("end_line", 0),
                    "distance": results['distances'][0][i]
                })
                
            return formatted_results
        except Exception as e:
            print(f"Search error: {e}")
            return []