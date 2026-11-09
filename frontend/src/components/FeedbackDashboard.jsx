
import React, { useEffect, useMemo, useState } from "react";

import {
  getFeedback as getAllFeedback,
  getFeedbackStats,
  submitFeedback,
  getSentimentStats,
  analyzePendingFeedback,
} from "../services/api";

import {
  Star,
  MessageSquare,
  TrendingUp,
  Truck,
  RefreshCw,
  Send,
  Search,
  Brain,
  Smile,
  Meh,
  Frown,
  Clock,
} from "lucide-react";

import "./FeedbackDashboard.css";

function FeedbackDashboard() {
  const [feedbackList, setFeedbackList] = useState([]);

  const [stats, setStats] = useState({
    total_reviews: 0,
    average_support_rating: 0,
    average_delivery_rating: 0,
  });

  const [sentimentStats, setSentimentStats] = useState({
    total_analyzed: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    pending: 0,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    customer_name: "",
    order_id: "",
    support_rating: 5,
    delivery_rating: 5,
    feedback: "",
  });

  // Fetch feedback, rating statistics and sentiment statistics
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        feedbackData,
        statsData,
        sentimentData,
      ] = await Promise.all([
        getAllFeedback(),
        getFeedbackStats(),
        getSentimentStats(),
      ]);

      setFeedbackList(
        Array.isArray(feedbackData.feedback)
          ? feedbackData.feedback
          : []
      );

      setStats(
        statsData.statistics || {
          total_reviews: 0,
          average_support_rating: 0,
          average_delivery_rating: 0,
        }
      );

      setSentimentStats(
        sentimentData.sentiment_statistics || {
          total_analyzed: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          pending: 0,
        }
      );
    } catch (err) {
      console.error("Feedback loading error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Filter feedback using customer, order, ID or comment
  const filteredFeedback = useMemo(() => {
    const query = search.toLowerCase().trim();

    return feedbackList.filter((item) => {
      return (
        (item.customer_name || "").toLowerCase().includes(query) ||
        (item.order_id || "").toLowerCase().includes(query) ||
        (item.feedback || "").toLowerCase().includes(query) ||
        (item.feedback_id || "").toLowerCase().includes(query) ||
        (item.sentiment || "").toLowerCase().includes(query)
      );
    });
  }, [feedbackList, search]);

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name.includes("rating") ? Number(value) : value,
    }));
  };

  // Submit customer feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.customer_name.trim() ||
      !formData.order_id.trim() ||
      !formData.feedback.trim()
    ) {
      setError("Please complete all feedback fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await submitFeedback({
        ...formData,
        customer_name: formData.customer_name.trim(),
        order_id: formData.order_id.trim(),
        feedback: formData.feedback.trim(),
      });

      setSuccess("Customer feedback submitted successfully!");

      setFormData({
        customer_name: "",
        order_id: "",
        support_rating: 5,
        delivery_rating: 5,
        feedback: "",
      });

      await fetchFeedback();
    } catch (err) {
      console.error("Feedback submission error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to submit feedback."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Analyze historical pending feedback
  const handleAnalyzePending = async () => {
    try {
      setAnalyzing(true);
      setError("");
      setSuccess("");

      const result = await analyzePendingFeedback();

      setSuccess(
        `AI analysis completed. ${result.analyzed} reviews analyzed, ${result.failed} failed.`
      );

      await fetchFeedback();
    } catch (err) {
      console.error("Sentiment analysis error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to analyze pending feedback."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleString("en-IN");
  };

  // Display rating stars
  const renderStars = (rating) => {
    const value = Math.max(
      0,
      Math.min(5, Number(rating) || 0)
    );

    return (
      <span className="feedback-stars">
        {"★".repeat(value)}
        {"☆".repeat(5 - value)}
        <small>{value}/5</small>
      </span>
    );
  };

  // Calculate sentiment percentages
  const analyzedCount = Number(sentimentStats.total_analyzed) || 0;

  const getPercentage = (value) => {
    if (!analyzedCount) return 0;

    return Math.round(
      (Number(value || 0) / analyzedCount) * 100
    );
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment) => {
    switch ((sentiment || "Pending").toLowerCase()) {
      case "positive":
        return <Smile size={15} />;

      case "neutral":
        return <Meh size={15} />;

      case "negative":
        return <Frown size={15} />;

      default:
        return <Clock size={15} />;
    }
  };

  return (
    <div className="feedback-dashboard">

      {/* Page Heading */}
      <div className="feedback-heading">
        <div>
          <span className="feedback-eyebrow">
            CUSTOMER EXPERIENCE
          </span>

          <h1>Customer Feedback</h1>

          <p>
            Monitor customer satisfaction and AI-powered sentiment insights.
          </p>
        </div>

        <button
          className="feedback-refresh"
          onClick={fetchFeedback}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="feedback-error">
          {error}
        </div>
      )}

      {success && (
        <div className="feedback-success">
          {success}
        </div>
      )}

      {/* Overall Feedback Statistics */}
      <div className="feedback-stats">

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon blue">
            <MessageSquare size={22} />
          </div>

          <span>Total Reviews</span>

          <strong>{stats.total_reviews}</strong>

          <small>Customer submissions</small>
        </div>

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon yellow">
            <Star size={22} />
          </div>

          <span>Support Rating</span>

          <strong>
            {Number(stats.average_support_rating || 0).toFixed(1)}
            <small>/5</small>
          </strong>

          <div className="feedback-rating">
            {renderStars(
              Math.round(stats.average_support_rating || 0)
            )}
          </div>
        </div>

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon green">
            <Truck size={22} />
          </div>

          <span>Delivery Rating</span>

          <strong>
            {Number(stats.average_delivery_rating || 0).toFixed(1)}
            <small>/5</small>
          </strong>

          <div className="feedback-rating">
            {renderStars(
              Math.round(stats.average_delivery_rating || 0)
            )}
          </div>
        </div>

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon purple">
            <TrendingUp size={22} />
          </div>

          <span>Overall Satisfaction</span>

          <strong>
            {(
              (
                Number(stats.average_support_rating || 0) +
                Number(stats.average_delivery_rating || 0)
              ) / 2
            ).toFixed(1)}
            <small>/5</small>
          </strong>

          <small>Average of both ratings</small>
        </div>

      </div>

      {/* AI Sentiment Analysis */}
      <div className="feedback-form-container sentiment-container">

        <div className="feedback-section-heading sentiment-heading">
          <div>
            <h2>
              <Brain size={21} />
              AI Sentiment Analysis
            </h2>

            <p>
              Customer opinions classified using your local Llama 3.2 model.
            </p>
          </div>

          <button
            className="feedback-refresh sentiment-analyze-button"
            onClick={handleAnalyzePending}
            disabled={analyzing || sentimentStats.pending === 0}
          >
            <Brain size={17} />

            {analyzing
              ? "Analyzing..."
              : "Analyze Pending Feedback"}
          </button>
        </div>

        {/* Sentiment Cards */}
        <div className="sentiment-grid">

          <div className="sentiment-card analyzed">
            <div className="sentiment-card-icon">
              <Brain size={20} />
            </div>

            <span>Analyzed Reviews</span>
            <strong>{sentimentStats.total_analyzed}</strong>
          </div>

          <div className="sentiment-card positive">
            <div className="sentiment-card-icon">
              <Smile size={20} />
            </div>

            <span>Positive</span>
            <strong>{sentimentStats.positive}</strong>
          </div>

          <div className="sentiment-card neutral">
            <div className="sentiment-card-icon">
              <Meh size={20} />
            </div>

            <span>Neutral</span>
            <strong>{sentimentStats.neutral}</strong>
          </div>

          <div className="sentiment-card negative">
            <div className="sentiment-card-icon">
              <Frown size={20} />
            </div>

            <span>Negative</span>
            <strong>{sentimentStats.negative}</strong>
          </div>

          <div className="sentiment-card pending">
            <div className="sentiment-card-icon">
              <Clock size={20} />
            </div>

            <span>Pending</span>
            <strong>{sentimentStats.pending}</strong>
          </div>

        </div>

        {/* Sentiment Distribution */}
        <div className="sentiment-distribution">

          <div className="sentiment-distribution-heading">
            <h3>Sentiment Distribution</h3>

            <span>
              {analyzedCount} analyzed reviews
            </span>
          </div>

          {analyzedCount === 0 ? (
            <p className="sentiment-no-data">
              No analyzed feedback available yet.
            </p>
          ) : (
            <>
              <div className="sentiment-progress">
                <div
                  className="sentiment-progress-positive"
                  style={{
                    width: `${getPercentage(sentimentStats.positive)}%`,
                  }}
                />

                <div
                  className="sentiment-progress-neutral"
                  style={{
                    width: `${getPercentage(sentimentStats.neutral)}%`,
                  }}
                />

                <div
                  className="sentiment-progress-negative"
                  style={{
                    width: `${getPercentage(sentimentStats.negative)}%`,
                  }}
                />
              </div>

              <div className="sentiment-legend">

                <span>
                  <i className="legend-dot positive-dot" />
                  Positive {getPercentage(sentimentStats.positive)}%
                </span>

                <span>
                  <i className="legend-dot neutral-dot" />
                  Neutral {getPercentage(sentimentStats.neutral)}%
                </span>

                <span>
                  <i className="legend-dot negative-dot" />
                  Negative {getPercentage(sentimentStats.negative)}%
                </span>

              </div>
            </>
          )}

        </div>

      </div>

      {/* Submit Feedback */}
      <div className="feedback-form-container">

        <div className="feedback-section-heading">
          <div>
            <h2>Submit Customer Feedback</h2>

            <p>
              Record a customer's support experience.
              New submissions are analyzed by AI.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="feedback-form-grid">

            <div className="feedback-field">
              <label>Customer Name</label>

              <input
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="feedback-field">
              <label>Order ID</label>

              <input
                name="order_id"
                value={formData.order_id}
                onChange={handleChange}
                placeholder="e.g. SE1001"
                required
              />
            </div>

            <div className="feedback-field">
              <label>Support Rating</label>

              <select
                name="support_rating"
                value={formData.support_rating}
                onChange={handleChange}
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Stars
                  </option>
                ))}
              </select>
            </div>

            <div className="feedback-field">
              <label>Delivery Rating</label>

              <select
                name="delivery_rating"
                value={formData.delivery_rating}
                onChange={handleChange}
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Stars
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="feedback-field">
            <label>Customer Comments</label>

            <textarea
              name="feedback"
              value={formData.feedback}
              onChange={handleChange}
              placeholder="Write customer feedback..."
              rows={4}
              required
            />
          </div>

          <button
            className="feedback-submit"
            type="submit"
            disabled={submitting}
          >
            <Send size={17} />

            {submitting
              ? "Submitting..."
              : "Submit Feedback"}
          </button>

        </form>
      </div>

      {/* Customer Reviews Table */}
      <div className="feedback-table-container">

        <div className="feedback-toolbar">

          <div>
            <h2>Customer Reviews</h2>

            <p>
              {filteredFeedback.length} reviews found
            </p>
          </div>

          <div className="feedback-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, order or sentiment..."
            />
          </div>

        </div>

        {loading ? (
          <div className="feedback-empty">
            Loading customer feedback...
          </div>
        ) : (
          <div className="feedback-table-scroll">

            <table className="feedback-table">

              <thead>
                <tr>
                  <th>Feedback ID</th>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Support</th>
                  <th>Delivery</th>
                  <th>Comments</th>
                  <th>AI Sentiment</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>

                {filteredFeedback.map((item) => {
                  const sentiment = (
                    item.sentiment || "Pending"
                  ).toLowerCase();

                  return (
                    <tr key={item.feedback_id}>

                      <td className="feedback-id">
                        {item.feedback_id}
                      </td>

                      <td>{item.customer_name}</td>

                      <td>{item.order_id || "—"}</td>

                      <td>
                        {renderStars(item.support_rating)}
                      </td>

                      <td>
                        {renderStars(item.delivery_rating)}
                      </td>

                      <td className="feedback-comment">
                        {item.feedback}
                      </td>

                      <td className="sentiment-table-cell">

                        <div className={`sentiment-badge ${sentiment}`}>
                          {getSentimentIcon(item.sentiment)}

                          <span>
                            {item.sentiment || "Pending"}
                          </span>
                        </div>

                        {item.sentiment_reason && (
                          <small className="sentiment-reason">
                            {item.sentiment_reason}
                          </small>
                        )}

                      </td>

                      <td>
                        {formatDate(item.created_at)}
                      </td>

                    </tr>
                  );
                })}

                {filteredFeedback.length === 0 && (
                  <tr>
                    <td colSpan="8" className="feedback-empty">
                      No customer feedback found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default FeedbackDashboard;
