
from agents.ticket_agent import ticket_agent


print("Creating ShopEase support ticket...")

result = ticket_agent.create_ticket(
    customer_name="Abhinav",
    order_id="SE1001",
    issue="Laptop received in damaged condition.",
    priority="High"
)

print("\nTicket Creation Result:")
print(result)


print("\nChecking Ticket Details:")

ticket = ticket_agent.get_ticket(
    result["ticket_id"]
)

print(ticket)


print("\nAll Support Tickets:")

all_tickets = ticket_agent.get_all_tickets()

for item in all_tickets:
    print(item)
