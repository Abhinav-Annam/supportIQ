
from database.connection import get_connection


class OrderAgent:

    def get_order(self, order_id: str):

        connection = get_connection()

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

        connection.close()

        if order is None:

            return {
                "found": False,
                "message": (
                    "No order was found with this order ID. "
                    "Please verify your order number."
                )
            }

        return {
            "found": True,
            "order": dict(order)
        }


order_agent = OrderAgent()
