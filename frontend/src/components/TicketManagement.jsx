
import React, { useEffect, useMemo, useState } from "react";

import {
  getAllTickets,
  updateTicket
} from "../services/ticketService";

import "./TicketManagement.css";

function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllTickets();
      const ticketList = Array.isArray(data)
        ? data
        : data?.tickets || [];

      setTickets(ticketList);

      // Refresh selected ticket if details are open
      if (selectedTicket) {
        const updated = ticketList.find(
          t => t.ticket_id === selectedTicket.ticket_id
        );
        if (updated) setSelectedTicket(updated);
      }

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load tickets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Statistics
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === "Open").length,
    progress: tickets.filter(t => t.status === "In Progress").length,
    resolved: tickets.filter(t => t.status === "Resolved").length
  }), [tickets]);

  // Search and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const text = search.toLowerCase();

      const matchesSearch = [
        ticket.ticket_id,
        ticket.customer_name,
        ticket.order_id,
        ticket.issue
      ].some(value =>
        (value || "").toLowerCase().includes(text)
      );

      return (
        matchesSearch &&
        (statusFilter === "All" || ticket.status === statusFilter) &&
        (priorityFilter === "All" || ticket.priority === priorityFilter)
      );
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  // Update status
  const handleStatusChange = async (ticketId, status) => {
    const previousTickets = tickets;

    try {
      setUpdatingId(ticketId);
      setError("");

      setTickets(previous =>
        previous.map(ticket =>
          ticket.ticket_id === ticketId
            ? { ...ticket, status }
            : ticket
        )
      );

      setSelectedTicket(previous =>
        previous?.ticket_id === ticketId
          ? { ...previous, status }
          : previous
      );

      await updateTicket(ticketId, { status });

    } catch (err) {
      console.error(err);

      setTickets(previousTickets);

      const previousSelected = previousTickets.find(
        t => t.ticket_id === ticketId
      );

      if (previousSelected) {
        setSelectedTicket(previous =>
          previous?.ticket_id === ticketId
            ? previousSelected
            : previous
        );
      }

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to update ticket."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Date formatting
  const formatDate = date => {
    if (!date) return "—";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleString();
  };

  // Ticket details page
  if (selectedTicket) {
    return (
      <div className="ticket-dashboard">

        <button
          className="back-button"
          onClick={() => {
            setSelectedTicket(null);
            setError("");
          }}
        >
          ← Back to Tickets
        </button>

        <div className="ticket-heading">
          <div>
            <span className="ticket-eyebrow">
              SUPPORT OPERATIONS / TICKET DETAILS
            </span>

            <h1>Ticket Details</h1>

            <p>
              Complete information about this support request.
            </p>
          </div>
        </div>

        {error && (
          <div className="ticket-error">{error}</div>
        )}

        <div className="ticket-detail-container">

          <div className="ticket-detail-header">
            <div>
              <span>Ticket ID</span>
              <h2>{selectedTicket.ticket_id}</h2>
            </div>

            <span
              className={`priority-badge ${(selectedTicket.priority || "").toLowerCase()}`}
            >
              {selectedTicket.priority || "Unassigned"} Priority
            </span>
          </div>

          <div className="ticket-detail-grid">

            <div className="detail-card">
              <span>Customer Name</span>
              <strong>{selectedTicket.customer_name || "—"}</strong>
            </div>

            <div className="detail-card">
              <span>Order ID</span>
              <strong>{selectedTicket.order_id || "—"}</strong>
            </div>

            <div className="detail-card">
              <span>Priority</span>
              <strong>{selectedTicket.priority || "—"}</strong>
            </div>

            <div className="detail-card">
              <span>Created At</span>
              <strong>
                {formatDate(selectedTicket.created_at)}
              </strong>
            </div>

          </div>

          <div className="ticket-issue-card">
            <h3>Reported Issue</h3>
            <p>{selectedTicket.issue || "No issue description available."}</p>
          </div>

          <div className="ticket-status-card">
            <div>
              <h3>Ticket Status</h3>
              <p>Update the current progress of this request.</p>
            </div>

            <select
              className={`status-select ${(selectedTicket.status || "").toLowerCase().replace(" ", "-")}`}
              value={selectedTicket.status || "Open"}
              disabled={updatingId === selectedTicket.ticket_id}
              onChange={e =>
                handleStatusChange(
                  selectedTicket.ticket_id,
                  e.target.value
                )
              }
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {updatingId === selectedTicket.ticket_id && (
            <p className="update-message">Updating ticket...</p>
          )}

        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="ticket-dashboard">

      <div className="ticket-heading">
        <div>
          <span className="ticket-eyebrow">
            SUPPORT OPERATIONS
          </span>

          <h1>Ticket Management</h1>

          <p>Manage and monitor customer support requests.</p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchTickets}
          disabled={loading}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="ticket-error">{error}</div>
      )}

      <div className="ticket-stats">

        <div className="stat-card">
          <span>Total Tickets</span>
          <strong>{stats.total}</strong>
          <small>All support requests</small>
        </div>

        <div className="stat-card">
          <span>Open Tickets</span>
          <strong>{stats.open}</strong>
          <small>Awaiting action</small>
        </div>

        <div className="stat-card">
          <span>In Progress</span>
          <strong>{stats.progress}</strong>
          <small>Currently being handled</small>
        </div>

        <div className="stat-card">
          <span>Resolved</span>
          <strong>{stats.resolved}</strong>
          <small>Successfully completed</small>
        </div>

      </div>

      <div className="ticket-table-container">

        <div className="ticket-toolbar">
          <div>
            <h2>Support Tickets</h2>
            <p>{filteredTickets.length} tickets found</p>
          </div>

          <div className="ticket-filters">

            <input
              type="text"
              placeholder="Search ticket, customer, order..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

          </div>
        </div>

        {loading ? (
          <div className="ticket-empty">Loading tickets...</div>
        ) : (
          <div className="ticket-table-scroll">

            <table className="ticket-table">

              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredTickets.map(ticket => (
                  <tr key={ticket.ticket_id}>

                    <td className="ticket-id">
                      <button
                        className="ticket-link"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        {ticket.ticket_id}
                      </button>
                    </td>

                    <td>{ticket.customer_name || "—"}</td>

                    <td>{ticket.order_id || "—"}</td>

                    <td className="ticket-issue">
                      {ticket.issue || "—"}
                    </td>

                    <td>
                      <span
                        className={`priority-badge ${(ticket.priority || "").toLowerCase()}`}
                      >
                        {ticket.priority || "—"}
                      </span>
                    </td>

                    <td>
                      <select
                        className={`status-select ${(ticket.status || "").toLowerCase().replace(" ", "-")}`}
                        value={ticket.status || "Open"}
                        disabled={updatingId === ticket.ticket_id}
                        onChange={e =>
                          handleStatusChange(
                            ticket.ticket_id,
                            e.target.value
                          )
                        }
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    <td>{formatDate(ticket.created_at)}</td>

                    <td>
                      <button
                        className="view-ticket-button"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View Details
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan="8" className="ticket-empty">
                      No tickets found.
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

export default TicketManagement;
