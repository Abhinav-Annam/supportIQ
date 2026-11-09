from agents.knowledge_agent import knowledge_agent

questions = [
    "Can I return a damaged laptop?",
    "How long does a refund take?",
    "How many days does standard shipping take?",
    "What is the warranty period for eligible electronics?"
]

for question in questions:

    print("\nCustomer:", question)

    try:

        result = knowledge_agent.answer(question)

        print("\nAI Answer:")
        print(result["answer"])

        print("\nSources:")
        print(result["sources"])

    except Exception as error:

        print("Error:", error)