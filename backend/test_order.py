
from agents.order_agent import order_agent


test_order_ids = [
    "SE1001",
    "SE1002",
    "SE1003",
    "SE9999"
]

for order_id in test_order_ids:

    print("\nChecking order:", order_id)

    result = order_agent.get_order(order_id)

    if result["found"]:

        print("Order found!")

        for key, value in result["order"].items():
            print(f"{key}: {value}")

    else:

        print(result["message"])
