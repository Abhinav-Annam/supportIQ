
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Literal

from database.connection import get_connection
from agents.orchestrator import support_graph
from agents.ticket_agent import ticket_agent
from agents.feedback_agent import feedback_agent


app = FastAPI(
    title="SupportIQ AI",
    description="Multi-Agent Customer Support Platform",
    version="2.3.0"
)


# =====================================
# CORS CONFIGURATION
# =====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================
# CHAT MODELS
# =====================================

class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    customer_name: Optional[str] = None
    order_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    sentiment: dict


# =====================================
# TICKET MODELS
# =====================================

class TicketCreateRequest(BaseModel):
    customer_name: str = Field(min_length=1)
    order_id: str = Field(min_length=1)
    issue: str = Field(min_length=1)
    priority: Literal["Low", "Medium", "High"] = "Medium"


class TicketUpdateRequest(BaseModel):
    status: Optional[
        Literal["Open", "In Progress", "Resolved"]
    ] = None

    priority: Optional[
        Literal["Low", "Medium", "High"]
    ] = None


# =====================================
# FEEDBACK MODELS
# =====================================

class FeedbackCreateRequest(BaseModel):
    customer_name: str = Field(min_length=1)
    order_id: Optional[str] = None

    support_rating: int = Field(ge=1, le=5)
    delivery_rating: int = Field(ge=1, le=5)

    feedback: str = Field(min_length=1)


# =====================================
# GENERAL ENDPOINTS
# =====================================

@app.get("/")
def home():
    return {
        "message": "Welcome to SupportIQ AI",
        "status": "running",
        "version": "2.3.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# =====================================
# CHAT ENDPOINT
# =====================================

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    try:
        initial_state = {
            "message": request.message,
            "customer_name": request.customer_name,
            "order_id": request.order_id,
            "sentiment": {},
            "result": {},
            "response": ""
        }

        result = support_graph.invoke(initial_state)

        return {
            "response": result["response"],
            "intent": result["intent"],
            "sentiment": result["sentiment"]
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =====================================
# CREATE TICKET
# =====================================

@app.post("/tickets")
def create_ticket(request: TicketCreateRequest):

    try:
        return ticket_agent.create_ticket(
            customer_name=request.customer_name,
            order_id=request.order_id,
            issue=request.issue,
            priority=request.priority
        )

    except ValueError as error:
        raise HTTPException(400, detail=str(error))

    except Exception as error:
        raise HTTPException(500, detail=str(error))


# =====================================
# GET ALL TICKETS
# =====================================

@app.get("/tickets")
def get_all_tickets():

    try:
        tickets = ticket_agent.get_all_tickets()

        return {
            "success": True,
            "total_tickets": len(tickets),
            "tickets": tickets
        }

    except Exception as error:
        raise HTTPException(500, detail=str(error))


# =====================================
# GET INDIVIDUAL TICKET
# =====================================

@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str):

    result = ticket_agent.get_ticket(ticket_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return result


# =====================================
# UPDATE TICKET
# =====================================

@app.put("/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    request: TicketUpdateRequest
):

    updates = request.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide status or priority to update"
        )

    try:
        result = ticket_agent.update_ticket(
            ticket_id=ticket_id,
            **updates
        )

        if not result["success"]:
            raise HTTPException(
                status_code=404,
                detail="Ticket not found"
            )

        return result

    except ValueError as error:
        raise HTTPException(400, detail=str(error))

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(500, detail=str(error))


# =====================================
# GET ALL ORDERS
# =====================================

@app.get("/orders")
def get_all_orders():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                order_id,
                customer_name,
                product_name,
                status,
                order_date,
                estimated_delivery,
                tracking_number
            FROM orders
            ORDER BY order_date DESC
        """)

        orders = [
            dict(row) for row in cursor.fetchall()
        ]

        return {
            "success": True,
            "total_orders": len(orders),
            "orders": orders
        }

    finally:
        connection.close()


# =====================================
# GET INDIVIDUAL ORDER
# =====================================

@app.get("/orders/{order_id}")
def get_order_details(order_id: str):

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                order_id,
                customer_name,
                product_name,
                status,
                order_date,
                estimated_delivery,
                tracking_number
            FROM orders
            WHERE order_id = ?
        """, (order_id,))

        order = cursor.fetchone()

        if order is None:
            raise HTTPException(
                status_code=404,
                detail="Order not found."
            )

        return {
            "success": True,
            "order": dict(order)
        }

    finally:
        connection.close()


# =====================================
# SUBMIT CUSTOMER FEEDBACK
# =====================================

@app.post("/feedback")
def submit_feedback(request: FeedbackCreateRequest):

    try:
        result = feedback_agent.submit_feedback(
            customer_name=request.customer_name,
            order_id=request.order_id,
            support_rating=request.support_rating,
            delivery_rating=request.delivery_rating,
            feedback=request.feedback
        )

        return result

    except ValueError as error:
        raise HTTPException(400, detail=str(error))

    except Exception as error:
        raise HTTPException(500, detail=str(error))


# =====================================
# GET ALL CUSTOMER FEEDBACK
# =====================================

@app.get("/feedback")
def get_all_feedback():

    try:
        feedback_list = feedback_agent.get_all_feedback()

        return {
            "success": True,
            "total_reviews": len(feedback_list),
            "feedback": feedback_list
        }

    except Exception as error:
        raise HTTPException(500, detail=str(error))


# =====================================
# FEEDBACK RATING STATISTICS
# =====================================

@app.get("/feedback/stats")
def get_feedback_stats():

    try:
        stats = feedback_agent.get_feedback_stats()

        return {
            "success": True,
            "statistics": stats
        }

    except Exception as error:
        raise HTTPException(500, detail=str(error))


# =====================================
# AI SENTIMENT STATISTICS
# =====================================

@app.get("/feedback/sentiment/stats")
def get_sentiment_stats():

    try:
        stats = feedback_agent.get_sentiment_stats()

        return {
            "success": True,
            "sentiment_statistics": stats
        }

    except Exception as error:
        raise HTTPException(500, detail=str(error))

@app.post("/feedback/analyze-pending")
def analyze_pending_feedback():

    try:
        result = feedback_agent.analyze_pending_feedback()
        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
