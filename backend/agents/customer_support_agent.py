from langchain_ollama import ChatOllama
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_PROXY_TOKEN

class CustomerSupportAgent:
    def __init__(self):
        self.llm = ChatOllama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0.3,
            client_kwargs={
                "headers": {
                    "Authorization": f"Bearer {OLLAMA_PROXY_TOKEN}"
                }
            }
        )

        self.system_prompt = """You are SupportIQ, a professional AI customer support assistant.
        Responsibilities:
        1. Understand customer problems.
        2. Respond politely and professionally.
        3. Provide clear and helpful solutions.
        4. Ask questions when information is missing.
        5. Never invent order status or refund information.
        6. Escalate complex complaints to human support.
        Keep responses simple, friendly and helpful.
        """

    def get_response(self, message: str):
        messages = [
            ("system", self.system_prompt),
            ("human", message)
        ]
        response = self.llm.invoke(messages)
        return response.content


support_agent = CustomerSupportAgent()