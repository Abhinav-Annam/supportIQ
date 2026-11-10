
from typing import Literal

from pydantic import BaseModel, Field
from langchain_ollama import ChatOllama

from config import (
    OLLAMA_MODEL,
    OLLAMA_BASE_URL,
    OLLAMA_PROXY_TOKEN
)


class SentimentResult(BaseModel):
    sentiment: Literal["positive", "neutral", "negative"]
    urgency: Literal["low", "medium", "high"]
    reason: str = Field(description="Short explanation")


class SentimentAgent:

    def __init__(self):
        self.llm = ChatOllama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0,
            client_kwargs={
                "headers": {
                    "Authorization": f"Bearer {OLLAMA_PROXY_TOKEN}"
                }
            }
        ).with_structured_output(
            SentimentResult,
            method="json_schema"
        )

    def analyze(self, message: str) -> dict:

        prompt = f"""
        Analyze this customer support message.

        Classify sentiment as:
        positive, neutral, or negative.

        Classify urgency as:
        low, medium, or high.

        Important:
        - Complaints indicate negative sentiment.
        - Damaged products indicate negative sentiment.
        - Repeated unresolved complaints indicate high urgency.
        - Routine questions are generally neutral.

        Customer message:
        {message}
        """

        result = self.llm.invoke(prompt)
        data = result.model_dump()

        text = message.lower()

        high_urgency = [
            "contacted support five times",
            "contacting support five times",
            "contacted support multiple times",
            "contacting support multiple times",
            "nobody helped",
            "no one helped",
            "not been resolved",
            "repeated complaint",
            "safety issue",
            "still unresolved"
        ]

        negative_keywords = [
            "damaged",
            "broken",
            "defective",
            "angry",
            "disappointed",
            "frustrated",
            "complaint",
            "unacceptable",
            "terrible",
            "poor service"
        ]

        positive_keywords = [
            "thank you",
            "very helpful",
            "great service",
            "excellent service",
            "happy with",
            "satisfied",
            "resolved successfully"
        ]

        neutral_keywords = [
            "estimated delivery date",
            "delivery date",
            "order status",
            "status of my order",
            "check the status",
            "check my order",
            "track my order",
            "order tracking",
            "tracking information",
            "where is my order",
            "return policy",
            "refund policy",
            "can you tell me",
            "could you tell me",
            "can you check",
            "i would like to know",
            "please explain",
            "what is the policy",
            "when will my order",
            "how can i"
        ]

        if any(word in text for word in high_urgency):
            data["sentiment"] = "negative"
            data["urgency"] = "high"
            data["reason"] = (
                "Repeated unresolved complaint indicates high urgency."
            )

        elif any(word in text for word in negative_keywords):
            data["sentiment"] = "negative"
            data["urgency"] = "medium"
            data["reason"] = "Customer expressed dissatisfaction."

        elif any(word in text for word in positive_keywords):
            data["sentiment"] = "positive"
            data["urgency"] = "low"
            data["reason"] = "Customer expressed satisfaction."

        elif any(word in text for word in neutral_keywords):
            data["sentiment"] = "neutral"
            data["urgency"] = "low"
            data["reason"] = (
                "Routine customer information request."
            )

        return data


sentiment_agent = SentimentAgent()
