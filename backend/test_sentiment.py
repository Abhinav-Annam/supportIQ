
from agents.sentiment_agent import sentiment_agent

messages = [
    "Thank you! My order arrived safely.",
    "Where is my laptop?",
    "My laptop arrived damaged and I am very angry!",
    "I have contacted support five times and nobody helped."
]

for message in messages:

    print("\nCustomer:", message)

    try:
        result = sentiment_agent.analyze(message)
        print("Result:", result)

    except Exception as error:
        print("Error:", error)
