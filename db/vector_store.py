# db/vector_store.py
import chromadb
import shutil
import os
from typing import List, Dict
from config.settings import CHROMA_DB_PATH

class VectorStore:
    def __init__(self):
        # Initialize Persistent Client (saves to disk)
        self.client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        
        # Get or create the collection
        # We use a single collection named "codebase" for now.
        self.collection = self.client.get_or_create_collection(
            name="codebase",
            metadata={"hnsw:space": "cosine"} # Use Cosine Similarity
        )

    def clear_collection(self):
        """
        Deletes existing data so we can index a new repo cleanly.
        """
        try:
            self.client.delete_collection("codebase")
            self.collection = self.client.get_or_create_collection(
                name="codebase", 
                metadata={"hnsw:space": "cosine"}
            )
            print("Database cleared.")
        except Exception as e:
            print(f"Error clearing collection: {e}")

    def add_documents(self, documents: List[Dict]):
        """
        Adds documents + embeddings to Chroma.
        documents: List of dicts with keys: 'chunk', 'embedding', 'path', 'chunk_id'
        """
        if not documents:
            return

        ids = []
        embeddings = []
        metadatas = []
        doc_texts = []

        for doc in documents:
            # Create a unique ID for each chunk
            unique_id = f"{doc['path']}_{doc['chunk_id']}"
            ids.append(unique_id)
            
            embeddings.append(doc['embedding'])
            doc_texts.append(doc['chunk'])
            
            # Metadata allows us to filter or see source info later
            metadatas.append({
                "path": doc['path'],
                "chunk_id": doc['chunk_id']
            })

        # Add to Chroma in a batch
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=doc_texts
        )
        print(f"Added {len(documents)} chunks to ChromaDB.")

    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
        """
        Performs semantic search using the vector.
        """
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        # Reformat Chroma's weird result structure back to our list of dicts
        formatted_results = []
        
        # results['ids'][0] is because we only sent 1 query
        if not results['ids'] or not results['ids'][0]:
            return []

        for i in range(len(results['ids'][0])):
            formatted_results.append({
                "chunk": results['documents'][0][i],
                "path": results['metadatas'][0][i]["path"],
                "chunk_id": results['metadatas'][0][i]["chunk_id"],
                "distance": results['distances'][0][i]
            })
            
        return formatted_results