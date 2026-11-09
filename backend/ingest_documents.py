from rag.knowledge_base import knowledge_base

print("Loading ShopEase policy documents...")

count = knowledge_base.create_vector_store()

print(f"Successfully indexed {count} document chunks.")

print("Knowledge Base is ready!")