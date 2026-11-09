
const API_URL = "http://127.0.0.1:8000";

// Get all customer feedback
export const getAllFeedback = async () => {
  const response = await fetch(`${API_URL}/feedback`);

  if (!response.ok) {
    throw new Error("Unable to fetch feedback.");
  }

  return response.json();
};

// Get feedback statistics
export const getFeedbackStats = async () => {
  const response = await fetch(`${API_URL}/feedback/stats`);

  if (!response.ok) {
    throw new Error("Unable to fetch feedback statistics.");
  }

  return response.json();
};

// Submit customer feedback
export const submitFeedback = async (feedbackData) => {
  const response = await fetch(`${API_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feedbackData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Unable to submit feedback.");
  }

  return response.json();
};
