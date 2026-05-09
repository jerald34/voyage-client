"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchPendingAgencies,
  fetchAllAgencies,
  fetchAgencyDetail,
  adminApproveAgency,
  adminRejectAgency,
  adminSuspendAgency,
  adminUnsuspendAgency,
} from "../../lib/api";
import "./AdminAgenciesPage.css";

const STATUS_OPTIONS = ["ALL", "PENDING_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"];

const statusLabel = (s) => {
  if (s === "PENDING_REVIEW") return "Pending";
  if (s === "VERIFIED") return "Verified";
  if (s === "REJECTED") return "Rejected";
  if (s === "SUSPENDED") return "Suspended";
  return s;
};

const statusBadgeClass = (s) => {
  if (s === "PENDING_REVIEW") return "badge-pending";
  if (s === "VERIFIED") return "badge-verified";
  if (s === "REJECTED") return "badge-rejected";
  if (s === "SUSPENDED") return "badge-suspended";
  return "";
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Review Queue ───

function ReviewQueue({ onAction }) {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingAgencies();
      setAgencies(data.agencies || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    setError(null);
    try {
      await adminApproveAgency(id);
      await load();
      onAction?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    setError(null);
    try {
      await adminRejectAgency(id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
      await load();
      onAction?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="admin-loading">Loading pending agencies...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (agencies.length === 0) return <div className="admin-empty">No pending applications</div>;

  return (
    <div className="admin-review-list">
      {agencies.map((agency) => (
        <div key={agency.id} className="admin-review-card">
          <div className="admin-review-card-header">
            <h3 className="admin-review-card-name">{agency.name}</h3>
            <span className="admin-review-card-date">Submitted {formatDate(agency.submittedAt)}</span>
          </div>
          <div className="admin-review-card-details">
            {agency.businessPhone && <span>Phone: {agency.businessPhone}</span>}
            {agency.country && agency.city && <span>{agency.city}, {agency.country}</span>}
            {agency.businessEmail && <span>{agency.businessEmail}</span>}
          </div>

          {rejectingId === agency.id ? (
            <div className="admin-reject-form">
              <textarea
                className="admin-reject-textarea"
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <div className="admin-reject-actions">
                <button className="button button-secondary admin-btn-sm" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</button>
                <button className="button admin-btn-sm admin-btn-reject" onClick={() => handleReject(agency.id)} disabled={actionLoading === agency.id || !rejectReason.trim()}>
                  {actionLoading === agency.id ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-review-card-actions">
              <button className="button admin-btn-sm admin-btn-approve" onClick={() => handleApprove(agency.id)} disabled={actionLoading === agency.id}>
                {actionLoading === agency.id ? "Approving..." : "Approve"}
              </button>
              <button className="button button-secondary admin-btn-sm" onClick={() => setRejectingId(agency.id)}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── All Agencies ───

function AllAgencies({ onSelectAgency }) {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filter = statusFilter === "ALL" ? undefined : statusFilter;
    fetchAllAgencies(filter)
      .then((data) => setAgencies(data.agencies || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="admin-all-agencies">
      <div className="admin-filter-bar">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            className={`admin-filter-btn ${statusFilter === s ? "active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "ALL" ? "All" : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading && <div className="admin-loading">Loading agencies...</div>}
      {error && <div className="admin-error">{error}</div>}
      {!loading && !error && agencies.length === 0 && <div className="admin-empty">No agencies found</div>}

      {!loading && !error && agencies.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Agency</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Country</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr key={a.id} className="admin-table-row" onClick={() => onSelectAgency(a.id)}>
                <td className="admin-table-name">{a.name}</td>
                <td>{a.ownerUser?.displayName || a.ownerUser?.email || "—"}</td>
                <td><span className={`admin-status-badge ${statusBadgeClass(a.status)}`}>{statusLabel(a.status)}</span></td>
                <td>{a.country || "—"}</td>
                <td>{formatDate(a.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Agency Detail ───

function AgencyDetail({ agencyId, onBack, onAction }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const [showReasonFor, setShowReasonFor] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAgencyDetail(agencyId);
      setAgency(data.agency);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (fn) => {
    setActionLoading(true);
    setError(null);
    try {
      await fn();
      await load();
      onAction?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
      setShowReasonFor(null);
      setReasonInput("");
    }
  };

  if (loading) return <div className="admin-loading">Loading agency details...</div>;
  if (error && !agency) return <div className="admin-error">{error}</div>;
  if (!agency) return null;

  const auditEvents = agency.auditEvents || [];

  return (
    <div className="admin-detail">
      <button className="admin-detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to list
      </button>

      <div className="admin-detail-card">
        <div className="admin-detail-header">
          <h2>{agency.name}</h2>
          <span className={`admin-status-badge ${statusBadgeClass(agency.status)}`}>{statusLabel(agency.status)}</span>
        </div>

        <div className="admin-detail-grid">
          <div className="admin-detail-field"><span className="admin-detail-label">Owner</span><span>{agency.ownerUser?.displayName || "—"}</span></div>
          <div className="admin-detail-field"><span className="admin-detail-label">Email</span><span>{agency.ownerUser?.email || "—"}</span></div>
          <div className="admin-detail-field"><span className="admin-detail-label">Phone</span><span>{agency.businessPhone || "—"}</span></div>
          <div className="admin-detail-field"><span className="admin-detail-label">Business Email</span><span>{agency.businessEmail || "—"}</span></div>
          <div className="admin-detail-field"><span className="admin-detail-label">Location</span><span>{[agency.city, agency.country].filter(Boolean).join(", ") || "—"}</span></div>
          <div className="admin-detail-field"><span className="admin-detail-label">Submitted</span><span>{formatDate(agency.submittedAt)}</span></div>
        </div>

        {agency.rejectionReason && (
          <div className="admin-detail-reason"><strong>Rejection reason:</strong> {agency.rejectionReason}</div>
        )}
        {agency.suspensionReason && (
          <div className="admin-detail-reason"><strong>Suspension reason:</strong> {agency.suspensionReason}</div>
        )}

        {error && <div className="admin-error" style={{ marginTop: 12 }}>{error}</div>}

        {/* Actions based on status */}
        <div className="admin-detail-actions">
          {agency.status === "PENDING_REVIEW" && (
            <>
              <button className="button admin-btn-sm admin-btn-approve" disabled={actionLoading} onClick={() => doAction(() => adminApproveAgency(agency.id))}>Approve</button>
              {showReasonFor === "reject" ? (
                <div className="admin-reason-inline">
                  <textarea className="admin-reject-textarea" placeholder="Rejection reason..." value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} rows={2} />
                  <div className="admin-reject-actions">
                    <button className="button button-secondary admin-btn-sm" onClick={() => setShowReasonFor(null)}>Cancel</button>
                    <button className="button admin-btn-sm admin-btn-reject" disabled={actionLoading || !reasonInput.trim()} onClick={() => doAction(() => adminRejectAgency(agency.id, reasonInput.trim()))}>Confirm</button>
                  </div>
                </div>
              ) : (
                <button className="button button-secondary admin-btn-sm" onClick={() => setShowReasonFor("reject")}>Reject</button>
              )}
            </>
          )}
          {agency.status === "VERIFIED" && (
            showReasonFor === "suspend" ? (
              <div className="admin-reason-inline">
                <textarea className="admin-reject-textarea" placeholder="Suspension reason..." value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} rows={2} />
                <div className="admin-reject-actions">
                  <button className="button button-secondary admin-btn-sm" onClick={() => setShowReasonFor(null)}>Cancel</button>
                  <button className="button admin-btn-sm admin-btn-reject" disabled={actionLoading || !reasonInput.trim()} onClick={() => doAction(() => adminSuspendAgency(agency.id, reasonInput.trim()))}>Confirm Suspend</button>
                </div>
              </div>
            ) : (
              <button className="button button-secondary admin-btn-sm" onClick={() => setShowReasonFor("suspend")}>Suspend</button>
            )
          )}
          {agency.status === "SUSPENDED" && (
            <button className="button admin-btn-sm admin-btn-approve" disabled={actionLoading} onClick={() => doAction(() => adminUnsuspendAgency(agency.id))}>Unsuspend</button>
          )}
          {agency.status === "REJECTED" && (
            <button className="button admin-btn-sm admin-btn-approve" disabled={actionLoading} onClick={() => doAction(() => adminApproveAgency(agency.id))}>Approve</button>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      {auditEvents.length > 0 && (
        <div className="admin-audit-trail">
          <h3 className="admin-audit-title">Audit Trail</h3>
          {auditEvents.map((event) => (
            <div key={event.id} className="admin-audit-event">
              <span className="admin-audit-action">{event.action.replace(/_/g, " ")}</span>
              <span className="admin-audit-meta">
                by {event.adminUser?.displayName || "Admin"} on {formatDate(event.createdAt)}
              </span>
              {event.reason && <span className="admin-audit-reason">{event.reason}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ───

export default function AdminAgenciesPage({ onPendingCountChange }) {
  const [view, setView] = useState("queue"); // "queue" | "all" | "detail"
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);

  const handleSelectAgency = (id) => {
    setSelectedAgencyId(id);
    setView("detail");
  };

  return (
    <div className="admin-agencies-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Agency Management</h1>
        <div className="admin-view-toggle">
          <button className={`admin-view-btn ${view === "queue" ? "active" : ""}`} onClick={() => setView("queue")}>Review Queue</button>
          <button className={`admin-view-btn ${view === "all" || view === "detail" ? "active" : ""}`} onClick={() => setView("all")}>All Agencies</button>
        </div>
      </div>

      {view === "queue" && <ReviewQueue onAction={onPendingCountChange} />}
      {view === "all" && <AllAgencies onSelectAgency={handleSelectAgency} />}
      {view === "detail" && selectedAgencyId && (
        <AgencyDetail agencyId={selectedAgencyId} onBack={() => setView("all")} onAction={onPendingCountChange} />
      )}
    </div>
  );
}
