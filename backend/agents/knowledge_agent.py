
from langchain_ollama import ChatOllama

from config import OLLAMA_MODEL, OLLAMA_BASE_URL
from rag.knowledge_base import knowledge_base


class KnowledgeAgent:

    def __init__(self):

        self.llm = ChatOllama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0.1
        )

    def answer(self, question: str):

        documents = knowledge_base.search(
            question,
            k=3
        )

        context = "\n\n".join(
            [
                f"Source: {doc.metadata['source']}\n"
                f"Content: {doc.page_content}"
                for doc in documents
            ]
        )

        prompt = f"""
        You are the ShopEase Knowledge Support Agent.

        Answer the customer's question using only
        the company policy context below.

        Rules:
        1. Do not invent company policies.
        2. Do not invent refund approvals.
        3. If information is missing, say so.
        4. Be polite and professional.
        5. Clearly mention when human verification
           is required.

        COMPANY POLICY CONTEXT:

        {context}

        CUSTOMER QUESTION:

        {question}

        Provide a helpful answer.
        """

        response = self.llm.invoke(prompt)

        return {
            "answer": response.content,
            "sources": list(
                dict.fromkeys(
                    doc.metadata["source"]
                    for doc in documents
                )
            )
        }


knowledge_agent = KnowledgeAgent()
