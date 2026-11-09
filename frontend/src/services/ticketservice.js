
const API_URL = "http://127.0.0.1:8000";

// Get all tickets
export const getAllTickets = async () => {
  const response = await fetch(`${API_URL}/tickets`);

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return response.json();
};

// Get individual ticket
export const getTicket = async (ticketId) => {
  const response = await fetch(
    `${API_URL}/tickets/${ticketId}`
  );

  if (!response.ok) {
    throw new Error("Ticket not found");
  }

  return response.json();
};

// Update ticket
export const updateTicket = async (ticketId, data) => {
  const response = await fetch(
    `${API_URL}/tickets/${ticketId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update ticket");
  }

  return response.json();
};

// Create ticket
export const createTicket = async (ticketData) => {
  const response = await fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(ticketData)
  });

  if (!response.ok) {
    throw new Error("Failed to create ticket");
  }

  return response.json();
};
