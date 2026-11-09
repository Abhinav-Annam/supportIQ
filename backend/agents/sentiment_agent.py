
from typing import Literal

from pydantic import BaseModel, Field
from langchain_ollama import ChatOllama

from config import OLLAMA_MODEL, OLLAMA_BASE_URL


class SentimentResult(BaseModel):
    sentiment: Literal["positive", "neutral", "negative"]
    urgency: Literal["low", "medium", "high"]
    reason: str = Field(description="Short explanation")


class SentimentAgent:

    def __init__(self):
        self.llm = ChatOllama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0
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
        - A complaint is not positive just because
          the customer uses polite language.
        - Damaged products indicate negative sentiment.
        - Repeated unresolved complaints indicate high urgency.
        - Routine questions are generally neutral.

        Customer message:
        {message}
        """

        result = self.llm.invoke(prompt)

        data = result.model_dump()

        text = message.lower()

        # Deterministic business rules
        high_urgency = [
            "contacted support five times",
            "nobody helped",
            "no one helped",
            "repeated complaint",
            "safety issue"
        ]

        negative_keywords = [
            "damaged",
            "broken",
            "defective",
            "angry",
            "disappointed",
            "frustrated",
            "complaint"
        ]

        if any(word in text for word in negative_keywords):
            data["sentiment"] = "negative"

        if any(word in text for word in high_urgency):
            data["sentiment"] = "negative"
            data["urgency"] = "high"

        elif any(word in text for word in [
            "damaged", "broken", "defective"
        ]):
            data["urgency"] = "medium"

        return data



sentiment_agent = SentimentAgent()
