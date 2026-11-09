
from pathlib import Path

from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


BASE_DIR = Path(__file__).resolve().parent

DOCUMENTS_DIR = BASE_DIR / "documents"

DB_DIR = BASE_DIR / "chroma_db"


class KnowledgeBase:

    def __init__(self):

        self.embeddings = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url="http://localhost:11434"
        )

        self.vector_store = None

    def load_documents(self):

        documents = []

        for file_path in DOCUMENTS_DIR.glob("*.txt"):

            content = file_path.read_text(
                encoding="utf-8"
            )

            documents.append(
                Document(
                    page_content=content,
                    metadata={
                        "source": file_path.name
                    }
                )
            )

        if not documents:
            raise ValueError(
                "No policy documents found."
            )

        return documents

    def create_vector_store(self):

        documents = self.load_documents()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )

        chunks = splitter.split_documents(documents)

        self.vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            collection_name="shopease_policies",
            persist_directory=str(DB_DIR)
        )

        return len(chunks)

    def search(self, query: str, k: int = 3):

        if self.vector_store is None:

            self.vector_store = Chroma(
                collection_name="shopease_policies",
                embedding_function=self.embeddings,
                persist_directory=str(DB_DIR)
            )

        return self.vector_store.similarity_search(
            query,
            k=k
        )


knowledge_base = KnowledgeBase()
