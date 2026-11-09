
from agents.orchestrator import support_graph


test_cases = [

    {
        "name": "Knowledge Agent Test",
        "message": "What is the ShopEase refund policy?",
    },

    {
        "name": "Order Agent Test",
        "message": "Where is my order SE1001?",
    },

    {
        "name": "Ticket Agent Test",
        "message": "Please create a support ticket for my damaged laptop, order SE1001.",
        "customer_name": "Abhinav"
    },

    {
        "name": "General Support Test",
        "message": "Hello, how can you help me?"
    }
]


for test in test_cases:

    print("\n" + "=" * 50)
    print(test["name"])
    print("=" * 50)

    initial_state = {
        "message": test["message"],
        "sentiment": {},
        "result": {},
        "response": ""
    }

    if "customer_name" in test:
        initial_state["customer_name"] = test["customer_name"]

    result = support_graph.invoke(initial_state)

    print("Selected Agent:", result["intent"])
    print("Sentiment:", result["sentiment"])
    print("\nResponse:")
    print(result["response"])
