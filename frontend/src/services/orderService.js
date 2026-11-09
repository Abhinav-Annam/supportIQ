
const API_URL = "http://127.0.0.1:8000";

export const getAllOrders = async () => {
  const response = await fetch(`${API_URL}/orders`);

  if (!response.ok) {
    throw new Error("Unable to fetch orders.");
  }

  return await response.json();
};

export const getOrderById = async (orderId) => {
  const response = await fetch(
    `${API_URL}/orders/${encodeURIComponent(orderId)}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Order not found.");
    }

    throw new Error("Unable to fetch order details.");
  }

  return await response.json();
};
