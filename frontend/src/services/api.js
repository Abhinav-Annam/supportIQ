
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Chat API
export const sendMessage = async (
  message,
  customerName = null,
  orderId = null
) => {
  const response = await API.post("/chat", {
    message,
    customer_name: customerName,
    order_id: orderId,
  });

  return response.data;
};

// Feedback APIs
export const getFeedback = async () => {
  const response = await API.get("/feedback");
  return response.data;
};

export const getFeedbackStats = async () => {
  const response = await API.get("/feedback/stats");
  return response.data;
};

export const getSentimentStats = async () => {
  const response = await API.get("/feedback/sentiment/stats");
  return response.data;
};

export const submitFeedback = async (feedbackData) => {
  const response = await API.post("/feedback", feedbackData);
  return response.data;
};

export const analyzePendingFeedback = async () => {
  const response = await API.post("/feedback/analyze-pending");
  return response.data;
};

export default API;
