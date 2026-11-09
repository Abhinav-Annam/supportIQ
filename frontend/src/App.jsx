
import React, { useState } from "react";

import {
  MessageCircle,
  Headphones,
  Send,
  Bot,
  User,
  Package,
  Ticket,
  Sparkles,
  Plus,
  Menu,
  PanelLeftClose,
  Star,
} from "lucide-react";

import { sendMessage } from "./services/api";

import TicketManagement from "./components/TicketManagement";
import OrderSupport from "./components/OrderSupport";
import FeedbackDashboard from "./components/FeedbackDashboard";

import "./App.css";

function App() {
  const [activeView, setActiveView] = useState("chat");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm SupportIQ, your AI customer support assistant. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("Abhinav");
  const [orderId, setOrderId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Send chat message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((previous) => [
      ...previous,
      { role: "user", text: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const data = await sendMessage(
        userMessage,
        customerName,
        orderId || null
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.response,
          intent: data.intent,
          sentiment: data.sentiment,
        },
      ]);

    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            error.response?.data?.detail ||
            error.message ||
            "Unable to connect to SupportIQ. Please check whether the backend server is running.",
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  // Suggested messages
  const suggestions = [
    {
      icon: Package,
      label: "Track my order",
      query: "Where is my order SE1001?",
    },
    {
      icon: MessageCircle,
      label: "Return policy",
      query: "What is your return policy?",
    },
    {
      icon: Ticket,
      label: "Create support ticket",
      query:
        "Please create a support ticket for my damaged laptop, order SE1001.",
    },
  ];

  // Start new conversation
  const startNewChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hello! I'm SupportIQ. How can I help you today?",
      },
    ]);

    setInput("");
    setActiveView("chat");
  };

  // Page titles
  const pageTitles = {
    chat: "AI Customer Support",
    tickets: "Ticket Management",
    orders: "Order Support",
    feedback: "Customer Feedback",
  };

  return (
    <div className="app-container">

      {/* SIDEBAR */}

      {sidebarOpen && (
        <aside className="sidebar">

          {/* BRAND */}

          <div className="brand">
            <div className="brand-icon">
              <Headphones size={23} />
            </div>

            <div>
              <h2>SupportIQ</h2>
              <span>AI CUSTOMER SUPPORT</span>
            </div>
          </div>

          {/* NEW CHAT */}

          <button
            className="new-chat"
            onClick={startNewChat}
          >
            <Plus size={18} />
            New conversation
          </button>

          {/* NAVIGATION */}

          <div className="sidebar-section">

            <p>WORKSPACE</p>

            {/* AI CHAT */}

            <button
              className={`nav-item ${
                activeView === "chat" ? "active" : ""
              }`}
              onClick={() => setActiveView("chat")}
            >
              <MessageCircle size={18} />
              AI Support Chat
            </button>

            {/* TICKET MANAGEMENT */}

            <button
              className={`nav-item ${
                activeView === "tickets" ? "active" : ""
              }`}
              onClick={() => setActiveView("tickets")}
            >
              <Ticket size={18} />
              Ticket Management
            </button>

            {/* ORDER SUPPORT */}

            <button
              className={`nav-item ${
                activeView === "orders" ? "active" : ""
              }`}
              onClick={() => setActiveView("orders")}
            >
              <Package size={18} />
              Order Support
            </button>

            {/* CUSTOMER FEEDBACK */}

            <button
              className={`nav-item ${
                activeView === "feedback" ? "active" : ""
              }`}
              onClick={() => setActiveView("feedback")}
            >
              <Star size={18} />
              Customer Feedback
            </button>

          </div>

          {/* SIDEBAR FOOTER */}

          <div className="sidebar-footer">

            <div className="avatar">A</div>

            <div>
              <strong>{customerName}</strong>
              <span>Customer</span>
            </div>

          </div>

        </aside>
      )}

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* HEADER */}

        <header className="topbar">

          <button
            className="icon-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

          <div className="header-title">

            <h3>{pageTitles[activeView]}</h3>

            <span>
              <span className="online-dot"></span>
              SupportIQ is ready
            </span>

          </div>

          <div className="model-badge">
            <Sparkles size={15} />
            Llama 3.2
          </div>

        </header>

        {/* AI CHAT */}

        {activeView === "chat" && (
          <>

            <section className="chat-area">

              {messages.length === 1 && (
                <div className="welcome-section">

                  <div className="welcome-icon">
                    <Bot size={32} />
                  </div>

                  <h1>How can we help you today?</h1>

                  <p>
                    Ask anything about orders, returns,
                    refunds or product support.
                  </p>

                  <div className="suggestion-grid">

                    {suggestions.map((item) => (
                      <button
                        className="suggestion-card"
                        key={item.label}
                        onClick={() => setInput(item.query)}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </button>
                    ))}

                  </div>

                </div>
              )}

              <div className="messages">

                {messages.map((message, index) => (
                  <div
                    className={`message-row ${message.role}`}
                    key={index}
                  >

                    <div className="message-avatar">
                      {message.role === "assistant" ? (
                        <Bot size={19} />
                      ) : (
                        <User size={19} />
                      )}
                    </div>

                    <div className="message-content">

                      <span className="message-name">
                        {message.role === "assistant"
                          ? "SupportIQ"
                          : "You"}
                      </span>

                      <div className="message-bubble">
                        {message.text}
                      </div>

                      {message.intent && (
                        <div className="message-meta">
                          Agent: {message.intent}
                        </div>
                      )}

                    </div>

                  </div>
                ))}

                {loading && (
                  <div className="typing">
                    <Bot size={19} />
                    SupportIQ is thinking...
                  </div>
                )}

              </div>

            </section>

            {/* CHAT INPUT */}

            <footer className="chat-footer">

              <div className="customer-fields">

                <input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                />

                <input
                  placeholder="Order ID (optional)"
                  value={orderId}
                  onChange={(e) =>
                    setOrderId(e.target.value)
                  }
                />

              </div>

              <div className="input-container">

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask SupportIQ anything..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />

                <button
                  className="send-button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  <Send size={19} />
                </button>

              </div>

              <p className="footer-note">
                SupportIQ AI can make mistakes. Verify important
                order and refund information.
              </p>

            </footer>

          </>
        )}

        {/* TICKET MANAGEMENT */}

        {activeView === "tickets" && (
          <TicketManagement />
        )}

        {/* ORDER SUPPORT */}

        {activeView === "orders" && (
          <OrderSupport />
        )}

        {/* CUSTOMER FEEDBACK */}

        {activeView === "feedback" && (
          <FeedbackDashboard />
        )}

      </main>

    </div>
  );
}

export default App;
