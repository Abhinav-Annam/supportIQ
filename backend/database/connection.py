
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

DB_PATH = BASE_DIR / "shopease.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (

            order_id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            status TEXT NOT NULL,
            order_date TEXT,
            estimated_delivery TEXT,
            tracking_number TEXT

        )
    """)

    sample_orders = [
        (
            "SE1001",
            "Abhinav",
            "Laptop",
            "Shipped",
            "2026-11-02",
            "2026-11-09",
            "TRK123456"
        ),
        (
            "SE1002",
            "Rahul",
            "Smartphone",
            "Delivered",
            "2026-11-01",
            "2026-11-05",
            "TRK234567"
        ),
        (
            "SE1003",
            "Priya",
            "Headphones",
            "Processing",
            "2026-11-06",
            "2026-11-12",
            "TRK345678"
        ),
        (
            "SE1004",
            "Kiran",
            "Smartwatch",
            "Out for Delivery",
            "2026-11-04",
            "2026-11-07",
            "TRK456789"
        )
    ]

    cursor.executemany("""
        INSERT OR IGNORE INTO orders
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, sample_orders)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (

        ticket_id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        order_id TEXT,
        issue TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT DEFAULT 'Open',
        created_at TEXT NOT NULL

        )
    """)
    connection.commit()
    connection.close()


if __name__ == "__main__":
    initialize_database()
    print("ShopEase database initialized successfully!")
