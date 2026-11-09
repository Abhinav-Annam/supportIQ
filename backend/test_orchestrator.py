
from agents.orchestrator import support_graph

result = support_graph.invoke({
    "message": "My laptop arrived damaged!",
    "sentiment": {},
    "response": ""
})

print("Sentiment:", result["sentiment"])
print("Response:", result["response"])
