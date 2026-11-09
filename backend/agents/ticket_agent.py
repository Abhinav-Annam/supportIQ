
import uuid
from datetime import datetime

from database.connection import get_connection


class TicketAgent:

    def create_ticket(
        self,
        customer_name: str,
        order_id: str,
        issue: str,
        priority: str
    ):

        allowed_priorities = [
            "Low", "Medium", "High"
        ]

        if priority not in allowed_priorities:
            raise ValueError("Invalid ticket priority")

        ticket_id = "TKT-" + uuid.uuid4().hex[:8].upper()

        created_at = datetime.now().isoformat(
            timespec="seconds"
        )

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO tickets (
                ticket_id,
                customer_name,
                order_id,
                issue,
                priority,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id,
            customer_name,
            order_id,
            issue,
            priority,
            "Open",
            created_at
        ))

        connection.commit()
        connection.close()

        return {
            "success": True,
            "ticket_id": ticket_id,
            "customer_name": customer_name,
            "order_id": order_id,
            "priority": priority,
            "status": "Open",
            "created_at": created_at,
            "message": "Support ticket created successfully."
        }

    def get_ticket(self, ticket_id: str):

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute("""
            SELECT * FROM tickets
            WHERE ticket_id = ?
        """, (ticket_id,))

        ticket = cursor.fetchone()

        connection.close()

        if ticket is None:
            return {
                "success": False,
                "message": "Ticket not found."
            }

        return {
            "success": True,
            "ticket": dict(ticket)
        }

    def get_all_tickets(self):

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute("""
            SELECT * FROM tickets
            ORDER BY created_at DESC
        """)

        tickets = [
            dict(row) for row in cursor.fetchall()
        ]

        connection.close()

        return tickets
    
    def update_ticket(
        self,
        ticket_id: str,
        status: str = None,
        priority: str = None
    ):

        allowed_statuses = [
            "Open", "In Progress", "Resolved"
        ]

        allowed_priorities = [
            "Low", "Medium", "High"
        ]

        if status is None and priority is None:
            raise ValueError("Provide status or priority to update")

        if status is not None and status not in allowed_statuses:
            raise ValueError("Invalid ticket status")

        if priority is not None and priority not in allowed_priorities:
            raise ValueError("Invalid ticket priority")

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT ticket_id FROM tickets WHERE ticket_id = ?",
            (ticket_id,)
        )

        if cursor.fetchone() is None:
            connection.close()
            return {
                "success": False,
                "message": "Ticket not found."
            }

        updates = []
        values = []

        if status is not None:
            updates.append("status = ?")
            values.append(status)

        if priority is not None:
            updates.append("priority = ?")
            values.append(priority)

        values.append(ticket_id)

        query = f"""
            UPDATE tickets
            SET {", ".join(updates)}
            WHERE ticket_id = ?
        """

        cursor.execute(query, tuple(values))
        connection.commit()
        connection.close()

        return {
            "success": True,
            "ticket_id": ticket_id,
            "message": "Ticket updated successfully."
        }


ticket_agent = TicketAgent()
