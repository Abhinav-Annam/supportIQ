
import uuid
import json
import urllib.request
import urllib.error

from datetime import datetime
from database.connection import get_connection


class FeedbackAgent:

    OLLAMA_URL = "http://localhost:11434/api/generate"
    OLLAMA_MODEL = "llama3.2"

    def __init__(self):
        self.create_table()

    # --------------------------------
    # CREATE DATABASE TABLE
    # --------------------------------

    def create_table(self):

        connection = get_connection()

        try:
            cursor = connection.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS feedback (
                    feedback_id TEXT PRIMARY KEY,
                    customer_name TEXT NOT NULL,
                    order_id TEXT,
                    support_rating INTEGER NOT NULL,
                    delivery_rating INTEGER NOT NULL,
                    feedback TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    sentiment TEXT DEFAULT 'Pending',
                    sentiment_reason TEXT DEFAULT ''
                )
            """)

            # Migrate existing databases safely
            cursor.execute("PRAGMA table_info(feedback)")

            columns = [
                row["name"] for row in cursor.fetchall()
            ]

            if "sentiment" not in columns:
                cursor.execute("""
                    ALTER TABLE feedback
                    ADD COLUMN sentiment TEXT DEFAULT 'Pending'
                """)

            if "sentiment_reason" not in columns:
                cursor.execute("""
                    ALTER TABLE feedback
                    ADD COLUMN sentiment_reason TEXT DEFAULT ''
                """)

            connection.commit()

        finally:
            connection.close()

    # --------------------------------
    # AI SENTIMENT ANALYSIS
    # --------------------------------

    def analyze_sentiment(self, feedback):

        prompt = f"""
You are a customer feedback sentiment analysis assistant.

Analyze the following customer review.

Customer review:
{feedback}

Classify the review into exactly one category:
Positive, Neutral, or Negative.

Rules:
- Positive: Customer expresses satisfaction.
- Neutral: Customer expresses mixed or unclear feelings.
- Negative: Customer expresses dissatisfaction or complaints.

Return ONLY valid JSON in this format:

{{
    "sentiment": "Positive",
    "reason": "Short explanation of the classification"
}}
"""

        payload = {
            "model": self.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0
            }
        }

        try:

            request = urllib.request.Request(
                self.OLLAMA_URL,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json"
                },
                method="POST"
            )

            with urllib.request.urlopen(
                request,
                timeout=60
            ) as response:

                result = json.loads(
                    response.read().decode("utf-8")
                )

            ai_response = json.loads(
                result.get("response", "{}")
            )

            sentiment = ai_response.get(
                "sentiment", ""
            ).capitalize()

            reason = ai_response.get(
                "reason", ""
            )

            if sentiment not in [
                "Positive",
                "Neutral",
                "Negative"
            ]:
                raise ValueError(
                    "Invalid sentiment returned by AI."
                )

            return {
                "sentiment": sentiment,
                "sentiment_reason": reason
            }

        except Exception as error:

            print(
                f"Sentiment analysis unavailable: {error}"
            )

            return {
                "sentiment": "Pending",
                "sentiment_reason": "AI analysis unavailable."
            }

    # --------------------------------
    # SUBMIT FEEDBACK
    # --------------------------------

    def submit_feedback(
        self,
        customer_name: str,
        order_id: str,
        support_rating: int,
        delivery_rating: int,
        feedback: str
    ):

        if not customer_name.strip():
            raise ValueError(
                "Customer name is required."
            )

        if not 1 <= support_rating <= 5:
            raise ValueError(
                "Support rating must be between 1 and 5."
            )

        if not 1 <= delivery_rating <= 5:
            raise ValueError(
                "Delivery rating must be between 1 and 5."
            )

        if not feedback.strip():
            raise ValueError(
                "Feedback cannot be empty."
            )

        feedback_id = (
            "FDB-" + uuid.uuid4().hex[:8].upper()
        )

        created_at = datetime.now().isoformat(
            timespec="seconds"
        )

        # Analyze feedback using Ollama
        sentiment_data = self.analyze_sentiment(
            feedback.strip()
        )

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute("""
                INSERT INTO feedback (
                    feedback_id,
                    customer_name,
                    order_id,
                    support_rating,
                    delivery_rating,
                    feedback,
                    created_at,
                    sentiment,
                    sentiment_reason
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                feedback_id,
                customer_name.strip(),
                order_id.strip() if order_id else None,
                support_rating,
                delivery_rating,
                feedback.strip(),
                created_at,
                sentiment_data["sentiment"],
                sentiment_data["sentiment_reason"]
            ))

            connection.commit()

        finally:
            connection.close()

        return {
            "success": True,
            "feedback_id": feedback_id,
            "customer_name": customer_name,
            "order_id": order_id,
            "support_rating": support_rating,
            "delivery_rating": delivery_rating,
            "feedback": feedback,
            "created_at": created_at,
            "sentiment": sentiment_data["sentiment"],
            "sentiment_reason": sentiment_data["sentiment_reason"],
            "message": "Feedback submitted successfully."
        }

    # --------------------------------
    # GET ALL FEEDBACK
    # --------------------------------

    def get_all_feedback(self):

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute("""
                SELECT *
                FROM feedback
                ORDER BY created_at DESC
            """)

            return [
                dict(row)
                for row in cursor.fetchall()
            ]

        finally:
            connection.close()

    # --------------------------------
    # FEEDBACK STATISTICS
    # --------------------------------

    def get_feedback_stats(self):

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute("""
                SELECT
                    COUNT(*) AS total_reviews,
                    AVG(support_rating) AS average_support_rating,
                    AVG(delivery_rating) AS average_delivery_rating
                FROM feedback
            """)

            row = cursor.fetchone()

            return {
                "total_reviews": row["total_reviews"],
                "average_support_rating": round(
                    row["average_support_rating"] or 0,
                    2
                ),
                "average_delivery_rating": round(
                    row["average_delivery_rating"] or 0,
                    2
                )
            }

        finally:
            connection.close()

    # --------------------------------
    # AI SENTIMENT STATISTICS
    # --------------------------------

    def get_sentiment_stats(self):

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute("""
                SELECT
                    COUNT(*) AS total_analyzed,

                    SUM(
                        CASE WHEN sentiment = 'Positive'
                        THEN 1 ELSE 0 END
                    ) AS positive,

                    SUM(
                        CASE WHEN sentiment = 'Neutral'
                        THEN 1 ELSE 0 END
                    ) AS neutral,

                    SUM(
                        CASE WHEN sentiment = 'Negative'
                        THEN 1 ELSE 0 END
                    ) AS negative,

                    SUM(
                        CASE WHEN sentiment = 'Pending'
                        THEN 1 ELSE 0 END
                    ) AS pending

                FROM feedback
            """)

            row = cursor.fetchone()

            return {
                "total_analyzed": (
                    (row["positive"] or 0)
                    + (row["neutral"] or 0)
                    + (row["negative"] or 0)
                ),
                "positive": row["positive"] or 0,
                "neutral": row["neutral"] or 0,
                "negative": row["negative"] or 0,
                "pending": row["pending"] or 0
            }

        finally:
            connection.close()
    
    # --------------------------------
    # ANALYZE PENDING HISTORICAL REVIEWS
    # --------------------------------

    def analyze_pending_feedback(self):

        connection = get_connection()

        try:
            cursor = connection.cursor()

            cursor.execute("""
                SELECT feedback_id, feedback
                FROM feedback
                WHERE sentiment = 'Pending'
                ORDER BY created_at ASC
            """)

            pending_reviews = [
                dict(row) for row in cursor.fetchall()
            ]

        finally:
            connection.close()

        analyzed = 0
        failed = 0

        for review in pending_reviews:

            result = self.analyze_sentiment(
                review["feedback"]
            )

            if result["sentiment"] == "Pending":
                failed += 1
                continue

            connection = get_connection()

            try:
                cursor = connection.cursor()

                cursor.execute("""
                    UPDATE feedback
                    SET sentiment = ?,
                        sentiment_reason = ?
                    WHERE feedback_id = ?
                """, (
                    result["sentiment"],
                    result["sentiment_reason"],
                    review["feedback_id"]
                ))

                connection.commit()
                analyzed += 1

            finally:
                connection.close()

        return {
            "success": True,
            "total_pending": len(pending_reviews),
            "analyzed": analyzed,
            "failed": failed,
            "message": "Historical feedback analysis completed."
        }



# Global feedback agent instance

feedback_agent = FeedbackAgent()
