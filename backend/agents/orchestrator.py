
import re
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, START, END

from agents.sentiment_agent import sentiment_agent
from agents.knowledge_agent import knowledge_agent
from agents.order_agent import order_agent
from agents.ticket_agent import ticket_agent
from agents.customer_support_agent import support_agent


# 1. Define workflow state
class SupportState(TypedDict, total=False):
    message: str
    customer_name: Optional[str]
    order_id: Optional[str]
    intent: str
    sentiment: dict
    result: dict
    response: str


# 2. Classify customer intent
def classify_intent(state: SupportState):

    message = state["message"].lower()

    order_match = re.search(
        r"\bSE\d{4,}\b",
        state["message"],
        re.IGNORECASE
    )

    order_id = (
        order_match.group(0).upper()
        if order_match else state.get("order_id")
    )

    # Ticket intent gets highest priority
    ticket_keywords = [
        "create a support ticket",
        "create support ticket",
        "create ticket",
        "raise a ticket",
        "raise ticket",
        "open a ticket",
        "open ticket",
        "register complaint",
        "file a complaint",
        "submit a complaint"
    ]

    if any(word in message for word in ticket_keywords):
        intent = "ticket"

    # Order tracking
    elif any(word in message for word in [
        "track order",
        "order status",
        "where is my order",
        "delivery status",
        "tracking"
    ]) or (order_id and "order" in message):
        intent = "order"

    # Company policies
    elif any(word in message for word in [
        "return",
        "refund",
        "warranty",
        "shipping",
        "delivery policy",
        "return policy"
    ]):
        intent = "knowledge"

    else:
        intent = "general"

    return {
        "intent": intent,
        "order_id": order_id
    }


# 3. Sentiment Agent
def analyze_sentiment(state: SupportState):

    result = sentiment_agent.analyze(
        state["message"]
    )

    return {"sentiment": result}


# 4. Knowledge Agent
def knowledge_node(state: SupportState):

    result = knowledge_agent.answer(
        state["message"]
    )

    return {
        "result": result,
        "response": result["answer"]
    }


# 5. Order Agent
def order_node(state: SupportState):

    order_id = state.get("order_id")

    if not order_id:
        return {
            "response": "Please provide your ShopEase order ID."
        }

    result = order_agent.get_order(order_id)

    if result["found"]:

        order = result["order"]

        response = (
            f"Your order {order_id} was found.\n"
            f"Product: {order['product_name']}\n"
            f"Status: {order['status']}\n"
            f"Estimated delivery: {order['estimated_delivery']}\n"
            f"Tracking number: {order['tracking_number']}"
        )

    else:
        response = result["message"]

    return {
        "result": result,
        "response": response
    }


# 6. Ticket Agent
def ticket_node(state: SupportState):

    customer_name = state.get("customer_name")
    order_id = state.get("order_id")

    if not customer_name or not order_id:

        return {
            "response": (
                "Please provide your customer name "
                "and ShopEase order ID to create a ticket."
            )
        }

    urgency = state.get(
        "sentiment", {}
    ).get("urgency", "medium")

    priority_map = {
        "low": "Low",
        "medium": "Medium",
        "high": "High"
    }

    result = ticket_agent.create_ticket(
        customer_name=customer_name,
        order_id=order_id,
        issue=state["message"],
        priority=priority_map.get(urgency, "Medium")
    )

    response = (
        "Your support ticket has been created successfully.\n"
        f"Ticket ID: {result['ticket_id']}\n"
        f"Priority: {result['priority']}\n"
        f"Status: {result['status']}"
    )

    return {
        "result": result,
        "response": response
    }


# 7. General Support Agent
def general_node(state: SupportState):

    response = support_agent.get_response(
        state["message"]
    )

    return {"response": response}


# 8. Routing
def route_agent(state: SupportState):

    return state["intent"]


# 9. Build LangGraph workflow
workflow = StateGraph(SupportState)

workflow.add_node("classify", classify_intent)
workflow.add_node("sentiment", analyze_sentiment)
workflow.add_node("knowledge", knowledge_node)
workflow.add_node("order", order_node)
workflow.add_node("ticket", ticket_node)
workflow.add_node("general", general_node)

workflow.add_edge(START, "classify")

workflow.add_edge("classify", "sentiment")

workflow.add_conditional_edges(
    "sentiment",
    route_agent,
    {
        "knowledge": "knowledge",
        "order": "order",
        "ticket": "ticket",
        "general": "general"
    }
)

workflow.add_edge("knowledge", END)
workflow.add_edge("order", END)
workflow.add_edge("ticket", END)
workflow.add_edge("general", END)

support_graph = workflow.compile()
