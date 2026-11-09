
import React, { useEffect, useMemo, useState } from "react";

import {
  getAllOrders,
  getOrderById
} from "../services/orderService";

import "./OrderSupport.css";

function OrderSupport() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searching, setSearching] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  // Delivery stages
  const deliveryStages = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered"
  ];

  // Map backend status to timeline position
  const getDeliveryProgress = (status) => {
    const normalizedStatus = (status || "")
      .trim()
      .toLowerCase();

    const statusMap = {
      "pending": 0,
      "order placed": 0,
      "processing": 1,
      "shipped": 2,
      "out for delivery": 3,
      "delivered": 4
    };

    return statusMap[normalizedStatus] ?? -1;
  };

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllOrders();

      const orderList = Array.isArray(data)
        ? data
        : data?.orders || [];

      setOrders(orderList);

    } catch (err) {
      console.error("Order loading error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load orders."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Dashboard statistics
  const stats = useMemo(() => ({
    total: orders.length,

    shipped: orders.filter(
      o => o.status === "Shipped"
    ).length,

    delivered: orders.filter(
      o => o.status === "Delivered"
    ).length,

    pending: orders.filter(
      o => o.status === "Pending"
    ).length

  }), [orders]);

  // Search and filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        (order.order_id || "").toLowerCase().includes(query) ||
        (order.customer_name || "").toLowerCase().includes(query) ||
        (order.product_name || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Format dates
  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date + "T00:00:00");

    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString("en-IN");
  };

  // Search order by ID
  const handleSearchOrder = async () => {
    if (!search.trim()) return;

    try {
      setSearching(true);
      setError("");

      const data = await getOrderById(search.trim());

      if (!data?.order) {
        throw new Error("Order not found.");
      }

      setSelectedOrder(data.order);

    } catch (err) {
      setSelectedOrder(null);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to find order."
      );

    } finally {
      setSearching(false);
    }
  };

  // View order details
  const handleViewOrder = async (orderId) => {
    try {
      setViewingId(orderId);
      setError("");

      const data = await getOrderById(orderId);

      if (!data?.order) {
        throw new Error("Order details not found.");
      }

      setSelectedOrder(data.order);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load order details."
      );

    } finally {
      setViewingId(null);
    }
  };

  return (
    <div className="order-dashboard">

      {/* Page Heading */}
      <div className="order-heading">

        <div>
          <span className="order-eyebrow">
            CUSTOMER OPERATIONS
          </span>

          <h1>Order Support</h1>

          <p>
            Track customer orders and monitor delivery status.
          </p>
        </div>

        <button
          className="order-refresh"
          onClick={fetchOrders}
          disabled={loading}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {/* Error Message */}
      {error && (
        <div className="order-error">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="order-stats">

        <div className="order-stat-card">
          <span>Total Orders</span>
          <strong>{stats.total}</strong>
          <small>All customer orders</small>
        </div>

        <div className="order-stat-card">
          <span>Shipped</span>
          <strong>{stats.shipped}</strong>
          <small>On the way</small>
        </div>

        <div className="order-stat-card">
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
          <small>Successfully delivered</small>
        </div>

        <div className="order-stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
          <small>Awaiting shipment</small>
        </div>

      </div>

      {/* Order Search */}
      <div className="order-search-panel">

        <div>
          <h2>Find an Order</h2>
          <p>Search using a customer order ID.</p>
        </div>

        <div className="order-search-controls">

          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedOrder(null);
              setError("");
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                handleSearchOrder();
              }
            }}
            placeholder="Enter Order ID (e.g. SE1001)"
          />

          <button
            onClick={handleSearchOrder}
            disabled={searching || !search.trim()}
          >
            {searching ? "Searching..." : "Track Order"}
          </button>

        </div>

        {/* Selected Order Details */}
        {selectedOrder && (

          <div className="order-detail-card">

            <div className="order-detail-heading">
              <div>
                <span className="order-eyebrow">
                  ORDER INFORMATION
                </span>

                <h3>Order Details</h3>
              </div>

              <button
                className="close-order"
                onClick={() => setSelectedOrder(null)}
              >
                ✕ Close
              </button>
            </div>

            <div className="order-detail-grid">

              <div>
                <small>Order ID</small>
                <strong>{selectedOrder.order_id}</strong>
              </div>

              <div>
                <small>Customer</small>
                <strong>{selectedOrder.customer_name}</strong>
              </div>

              <div>
                <small>Product</small>
                <strong>{selectedOrder.product_name}</strong>
              </div>

              <div>
                <small>Status</small>
                <strong>{selectedOrder.status}</strong>
              </div>

              <div>
                <small>Order Date</small>
                <strong>
                  {formatDate(selectedOrder.order_date)}
                </strong>
              </div>

              <div>
                <small>Estimated Delivery</small>
                <strong>
                  {formatDate(selectedOrder.estimated_delivery)}
                </strong>
              </div>

              <div>
                <small>Tracking Number</small>
                <strong>
                  {selectedOrder.tracking_number || "Not available"}
                </strong>
              </div>

            </div>

            {/* Delivery Timeline */}
            <div className="delivery-timeline">

              <h3>Delivery Progress</h3>

              <div className="timeline-list">

                {deliveryStages.map((stage, index) => {

                  const currentStage = getDeliveryProgress(
                    selectedOrder.status
                  );

                  const completed = currentStage >= 0 &&
                    index <= currentStage;

                  const isCurrent = index === currentStage;

                  return (
                    <div
                      className={`timeline-step ${
                        completed ? "completed" : ""
                      } ${isCurrent ? "current" : ""}`}
                      key={stage}
                    >

                      <div className="timeline-marker">
                        {completed ? "✓" : index + 1}
                      </div>

                      <div className="timeline-info">

                        <strong>{stage}</strong>

                        <small>
                          {isCurrent
                            ? "Current status"
                            : completed
                            ? "Completed"
                            : "Awaiting"}
                        </small>

                      </div>

                    </div>
                  );
                })}

              </div>

              {getDeliveryProgress(selectedOrder.status) === -1 && (
                <p className="timeline-note">
                  Delivery progress is not available for this status.
                </p>
              )}

              <div className="tracking-information">
                <span>Tracking Number</span>

                <strong>
                  {selectedOrder.tracking_number || "Not available"}
                </strong>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* Recent Orders */}
      <div className="order-table-container">

        <div className="order-toolbar">

          <div>
            <h2>Recent Orders</h2>
            <p>{filteredOrders.length} orders found</p>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>

        </div>

        {loading ? (

          <div className="order-empty">
            Loading orders...
          </div>

        ) : (

          <div className="order-table-scroll">

            <table className="order-table">

              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Tracking</th>
                </tr>
              </thead>

              <tbody>

                {filteredOrders.map(order => (

                  <tr key={order.order_id}>

                    <td className="order-id">
                      {order.order_id}
                    </td>

                    <td>{order.customer_name}</td>

                    <td>{order.product_name}</td>

                    <td>
                      <span
                        className={`order-status ${
                          (order.status || "")
                            .toLowerCase()
                            .replaceAll(" ", "-")
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>{formatDate(order.order_date)}</td>

                    <td>
                      {formatDate(order.estimated_delivery)}
                    </td>

                    <td>
                      <button
                        className="view-order"
                        disabled={viewingId === order.order_id}
                        onClick={() => handleViewOrder(order.order_id)}
                      >
                        {viewingId === order.order_id
                          ? "Loading..."
                          : "View"}
                      </button>
                    </td>

                  </tr>

                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="order-empty">
                      No orders found.
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

export default OrderSupport;
