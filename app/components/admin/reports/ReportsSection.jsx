"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchReports } from "../../../lib/api/admin.js";
import ReportDetailPanel from "./ReportDetailPanel.jsx";

const STATUSES = ["ALL", "NEW", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];
const statusPill = (s) => ({
  NEW: "bg-accent/10 text-accent",
  IN_PROGRESS: "bg-status-warning/10 text-status-warning",
  RESOLVED: "bg-status-success/10 text-status-success",
  WONT_FIX: "bg-surface text-text-muted",
}[s] || "bg-surface text-text-muted");

export default function ReportsSection({ onBadgeChange }) {
  const [status, setStatus] = useState("ALL");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchReports(status);
      const list = data.reports || [];
      setReports(list);
      onBadgeChange?.(list.filter((r) => r.status === "NEW").length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [status, onBadgeChange]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-pill bg-surface border border-border/12 px-4 py-2 text-sm text-text-primary">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "ALL" ? "All" : s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading && <div className="py-16 text-center text-sm text-text-muted">Loading reports…</div>}
      {error && <div className="rounded-sm bg-status-danger/8 text-status-danger text-sm p-4 text-center">{error}</div>}
      {!loading && !error && reports.length === 0 && (
        <div className="py-16 text-center text-sm text-text-muted">No reports yet.</div>
      )}
      {!loading && !error && reports.length > 0 && (
        <div className="grid gap-3">
          {reports.map((r) => (
            <button key={r.id} type="button" onClick={() => setSelectedId(r.id)}
              className="flex w-full flex-col gap-1 rounded-md border border-border/12 bg-surface p-4 text-left shadow-soft transition active:scale-[0.99] motion-reduce:transition-none">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-text-primary">{r.subject}</span>
                <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${statusPill(r.status)}`}>{r.status.replace(/_/g, " ")}</span>
              </div>
              <span className="text-xs text-text-soft">{r.category} · {r.reporterUser?.email || "—"}</span>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <ReportDetailPanel reportId={selectedId} onClose={() => setSelectedId(null)} onUpdated={load} />
      )}
    </div>
  );
}
