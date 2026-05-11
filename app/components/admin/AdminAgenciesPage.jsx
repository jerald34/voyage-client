"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  fetchAllAgencies,
  fetchAgencyDetail,
  adminApproveAgency,
  adminRejectAgency,
  adminSuspendAgency,
  adminUnsuspendAgency,
} from "../../lib/api";

const statusLabel = (s) => {
  if (s === "PENDING_REVIEW") return "Pending";
  if (s === "VERIFIED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  if (s === "SUSPENDED") return "Suspended";
  return s;
};

const statusPillClasses = (s) => {
  if (s === "PENDING_REVIEW") return "bg-accent/10 text-accent";
  if (s === "VERIFIED") return "bg-status-success/10 text-status-success";
  if (s === "REJECTED") return "bg-status-danger/10 text-status-danger";
  if (s === "SUSPENDED") return "bg-status-warning/10 text-status-warning";
  return "bg-surface text-text-muted";
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Search Icon ───

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// ─── Close Icon ───

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Sort Icon ───

function SortIcon({ active, direction }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ml-1 inline-block transition-transform ${
        active ? "opacity-100" : "opacity-30"
      } ${active && direction === "desc" ? "rotate-180" : ""}`}
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

// ─── Slide-over Detail Panel ───

function SlideOverPanel({ agencyId, onClose, onAction }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const [showReasonFor, setShowReasonFor] = useState(null);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgencyDetail(agencyId);
      setAgency(data.agency);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

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

  const auditEvents = agency?.auditEvents || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-surface-elevated backdrop-blur-md border-l border-border/20 shadow-strong overflow-y-auto transition-transform animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-elevated/80 backdrop-blur-md border-b border-border/10">
          <h2 className="font-serif text-xl text-text-primary truncate pr-4">
            {loading ? "Loading..." : agency?.name || "Agency Details"}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-full hover:bg-surface transition-colors text-text-muted hover:text-text-primary"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              Loading agency details...
            </div>
          )}

          {error && !agency && (
            <div className="rounded-sm bg-status-danger/8 text-status-danger text-sm p-4">
              {error}
            </div>
          )}

          {agency && (
            <>
              {/* Status */}
              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 rounded-pill text-xs font-semibold tracking-wide ${statusPillClasses(
                    agency.status
                  )}`}
                >
                  {statusLabel(agency.status)}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <DetailField label="Owner" value={agency.ownerUser?.displayName || "—"} />
                <DetailField label="Email" value={agency.ownerUser?.email || "—"} />
                <DetailField label="Phone" value={agency.businessPhone || "—"} />
                <DetailField label="Business Email" value={agency.businessEmail || "—"} />
                <DetailField
                  label="Location"
                  value={
                    [agency.city, agency.country].filter(Boolean).join(", ") || "—"
                  }
                />
                <DetailField label="Registration Date" value={formatDate(agency.submittedAt)} />
              </div>

              {/* Documents */}
              {agency.documents && agency.documents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft mb-3">
                    Submitted Documents
                  </h3>
                  <div className="space-y-2">
                    {agency.documents.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-sm bg-surface border border-border/10 text-sm text-text-primary"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-text-soft flex-shrink-0"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="truncate">{doc.name || doc.fileName || `Document ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection / Suspension reason */}
              {agency.rejectionReason && (
                <div className="mb-4 p-4 rounded-sm bg-status-danger/6 border border-status-danger/15 text-sm text-text-primary leading-relaxed">
                  <strong className="text-status-danger">Rejection reason:</strong>{" "}
                  {agency.rejectionReason}
                </div>
              )}
              {agency.suspensionReason && (
                <div className="mb-4 p-4 rounded-sm bg-status-warning/6 border border-status-warning/15 text-sm text-text-primary leading-relaxed">
                  <strong className="text-status-warning">Suspension reason:</strong>{" "}
                  {agency.suspensionReason}
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-sm bg-status-danger/8 text-status-danger text-sm p-4">
                  {error}
                </div>
              )}

              {/* Audit Trail */}
              {auditEvents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft mb-3">
                    Audit Trail
                  </h3>
                  <div className="space-y-0 divide-y divide-border/10">
                    {auditEvents.map((event) => (
                      <div key={event.id} className="py-3">
                        <span className="block text-sm font-semibold text-text-primary capitalize">
                          {event.action.replace(/_/g, " ")}
                        </span>
                        <span className="block text-xs text-text-soft mt-0.5">
                          by {event.adminUser?.displayName || "Admin"} on{" "}
                          {formatDate(event.createdAt)}
                        </span>
                        {event.reason && (
                          <span className="block text-sm text-text-muted italic mt-1">
                            {event.reason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason textarea (for reject / suspend) */}
              {showReasonFor && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-soft mb-2">
                    {showReasonFor === "reject"
                      ? "Rejection Reason"
                      : "Suspension Reason"}
                  </label>
                  <textarea
                    className="w-full p-3 rounded-sm bg-background border border-border/20 text-sm text-text-primary font-sans resize-vertical focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-text-soft"
                    placeholder={
                      showReasonFor === "reject"
                        ? "Enter reason for rejection..."
                        : "Enter reason for suspension..."
                    }
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      className="px-4 py-2 text-sm font-medium rounded-sm bg-surface border border-border/20 text-text-muted hover:bg-surface/80 transition-colors"
                      onClick={() => {
                        setShowReasonFor(null);
                        setReasonInput("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium rounded-sm bg-status-danger text-white hover:bg-status-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading || !reasonInput.trim()}
                      onClick={() =>
                        doAction(() =>
                          showReasonFor === "reject"
                            ? adminRejectAgency(agency.id, reasonInput.trim())
                            : adminSuspendAgency(agency.id, reasonInput.trim())
                        )
                      }
                    >
                      {actionLoading
                        ? "Processing..."
                        : showReasonFor === "reject"
                        ? "Confirm Reject"
                        : "Confirm Suspend"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="sticky bottom-0 pt-4 pb-2 bg-surface-elevated/80 backdrop-blur-md border-t border-border/10 -mx-6 px-6 mt-4 flex gap-3 flex-wrap">
                {agency.status === "PENDING_REVIEW" && (
                  <>
                    <button
                      className="flex-1 min-w-[120px] px-5 py-2.5 text-sm font-semibold rounded-sm bg-status-success text-white hover:bg-status-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading}
                      onClick={() =>
                        doAction(() => adminApproveAgency(agency.id))
                      }
                    >
                      {actionLoading && !showReasonFor ? "Approving..." : "Approve"}
                    </button>
                    {!showReasonFor && (
                      <button
                        className="flex-1 min-w-[120px] px-5 py-2.5 text-sm font-semibold rounded-sm bg-status-danger text-white hover:bg-status-danger/90 transition-colors"
                        onClick={() => setShowReasonFor("reject")}
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
                {agency.status === "VERIFIED" && !showReasonFor && (
                  <button
                    className="px-5 py-2.5 text-sm font-semibold rounded-sm bg-status-warning text-white hover:bg-status-warning/90 transition-colors"
                    onClick={() => setShowReasonFor("suspend")}
                  >
                    Suspend
                  </button>
                )}
                {agency.status === "SUSPENDED" && (
                  <button
                    className="px-5 py-2.5 text-sm font-semibold rounded-sm bg-status-success text-white hover:bg-status-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={actionLoading}
                    onClick={() =>
                      doAction(() => adminUnsuspendAgency(agency.id))
                    }
                  >
                    {actionLoading ? "Processing..." : "Unsuspend"}
                  </button>
                )}
                {agency.status === "REJECTED" && (
                  <button
                    className="px-5 py-2.5 text-sm font-semibold rounded-sm bg-status-success text-white hover:bg-status-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={actionLoading}
                    onClick={() =>
                      doAction(() => adminApproveAgency(agency.id))
                    }
                  >
                    {actionLoading ? "Approving..." : "Approve"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Detail Field ───

function DetailField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">
        {label}
      </span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

// ─── Main Admin Page ───

export default function AdminAgenciesPage({ onPendingCountChange }) {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);

  // Fetch agencies
  const loadAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await fetchAllAgencies(filter);
      setAgencies(data.agencies || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  // Filter by search
  const filtered = agencies.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.ownerUser?.email && a.ownerUser.email.toLowerCase().includes(q)) ||
      (a.ownerUser?.displayName &&
        a.ownerUser.displayName.toLowerCase().includes(q)) ||
      (a.businessEmail && a.businessEmail.toLowerCase().includes(q))
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    if (sortField === "name") {
      aVal = (a.name || "").toLowerCase();
      bVal = (b.name || "").toLowerCase();
    } else if (sortField === "contact") {
      aVal = (a.ownerUser?.displayName || a.ownerUser?.email || "").toLowerCase();
      bVal = (b.ownerUser?.displayName || b.ownerUser?.email || "").toLowerCase();
    } else if (sortField === "status") {
      aVal = (a.status || "").toLowerCase();
      bVal = (b.status || "").toLowerCase();
    } else if (sortField === "submittedAt") {
      aVal = a.submittedAt || "";
      bVal = b.submittedAt || "";
    } else {
      return 0;
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleAction = () => {
    loadAgencies();
    onPendingCountChange?.();
  };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-[1100px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-text-primary">
          Agency Management
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-pill bg-surface border border-border/12 text-sm text-text-primary placeholder:text-text-soft focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-pill bg-surface border border-border/12 text-sm text-text-primary focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending</option>
            <option value="VERIFIED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <svg
            className="animate-spin mr-3 h-5 w-5 text-primary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading agencies...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-sm bg-status-danger/8 text-status-danger text-sm p-4 text-center">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm">
          {searchQuery.trim()
            ? "No agencies match your search."
            : "No agencies found."}
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && sorted.length > 0 && (
        <div className="rounded-md overflow-hidden border border-border/12 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface">
                  <SortableHeader
                    label="Agency Name"
                    field="name"
                    currentField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Contact"
                    field="contact"
                    currentField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Status"
                    field="status"
                    currentField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Submitted"
                    field="submittedAt"
                    currentField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-soft">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/8">
                {sorted.map((a, index) => (
                  <tr
                    key={a.id}
                    className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                      index % 2 === 0 ? "" : "bg-surface/50"
                    } ${selectedAgencyId === a.id ? "bg-primary/8" : ""}`}
                    onClick={() => setSelectedAgencyId(a.id)}
                  >
                    <td className="px-4 py-3.5 font-semibold text-text-primary whitespace-nowrap">
                      {a.name}
                    </td>
                    <td className="px-4 py-3.5 text-text-muted whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-text-primary text-sm">
                          {a.ownerUser?.displayName || "—"}
                        </span>
                        {a.ownerUser?.email && (
                          <span className="text-xs text-text-soft">
                            {a.ownerUser.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-pill text-xs font-semibold tracking-wide ${statusPillClasses(
                          a.status
                        )}`}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-text-muted whitespace-nowrap">
                      {formatDate(a.submittedAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        className="px-3 py-1.5 text-xs font-medium rounded-sm bg-surface border border-border/15 text-text-muted hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgencyId(a.id);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 bg-surface border-t border-border/10 text-xs text-text-soft">
            Showing {sorted.length} of {agencies.length} agencies
          </div>
        </div>
      )}

      {/* Slide-over Detail Panel */}
      {selectedAgencyId && (
        <SlideOverPanel
          agencyId={selectedAgencyId}
          onClose={() => setSelectedAgencyId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

// ─── Sortable Table Header ───

function SortableHeader({ label, field, currentField, direction, onSort }) {
  const active = currentField === field;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-soft cursor-pointer select-none hover:text-text-primary transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon active={active} direction={active ? direction : "asc"} />
    </th>
  );
}
