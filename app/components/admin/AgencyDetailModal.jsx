"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  fetchAgencyDetail,
  adminApproveAgency,
  adminRejectAgency,
  adminSuspendAgency,
  adminUnsuspendAgency,
} from "../../lib/api/index.js";
import { CloseIcon } from "../icons/index.js";

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

export default function AgencyDetailModal({ agencyId, onClose, onAction }) {
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
            <CloseIcon width={20} height={20} />
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
