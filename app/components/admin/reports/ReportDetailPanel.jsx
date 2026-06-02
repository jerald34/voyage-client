"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchReportDetail, updateReport } from "../../../lib/api/admin.js";
import { buildGithubIssueUrl } from "../../../lib/githubIssue.js";

const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];
const REPO = process.env.NEXT_PUBLIC_GITHUB_ISSUES_REPO || "";

export default function ReportDetailPanel({ reportId, onClose, onUpdated }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("NEW");
  const [adminNotes, setAdminNotes] = useState("");
  const [issueUrl, setIssueUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchReportDetail(reportId);
      setReport(data.report);
      setStatus(data.report.status);
      setAdminNotes(data.report.adminNotes || "");
      setIssueUrl(data.report.githubIssueUrl || "");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [reportId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async (patch) => {
    setSaving(true); setError(null);
    try { await updateReport(reportId, patch); await load(); onUpdated?.(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const githubUrl = report
    ? buildGithubIssueUrl(REPO, {
        category: report.category, subject: report.subject, message: report.message,
        reporterEmail: report.reporterUser?.email, appContext: report.appContext,
      })
    : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Report details"
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-surface-elevated border-l border-border/20 shadow-strong overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-elevated/80 backdrop-blur-md border-b border-border/10">
          <h2 className="font-serif text-xl text-text-primary truncate pr-4">{loading ? "Loading…" : (report?.subject || "Report")}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-surface text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {error && <div className="rounded-sm bg-status-danger/8 text-status-danger text-sm p-3">{error}</div>}
          {report && (
            <>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{report.message}</p>
              <p className="text-xs text-text-soft">{report.category} · {report.reporterUser?.email || "—"}{report.appContext ? ` · ${report.appContext}` : ""}</p>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text-primary">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Admin notes</span>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text-primary" />
              </label>

              <button type="button" disabled={saving} onClick={() => save({ status, adminNotes })}
                className="min-h-11 rounded-pill bg-secondary px-5 text-sm font-semibold text-white transition active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none">
                {saving ? "Saving…" : "Save"}
              </button>

              <div className="border-t border-border/10 pt-4 flex flex-col gap-2">
                {report.githubIssueUrl ? (
                  <a href={report.githubIssueUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-secondary underline">View GitHub issue →</a>
                ) : (
                  <>
                    <a href={githubUrl || undefined} target="_blank" rel="noreferrer"
                      className={`min-h-11 inline-flex items-center justify-center rounded-pill border border-border px-4 text-sm font-semibold transition ${githubUrl ? "text-text-primary hover:border-secondary active:scale-[0.97]" : "pointer-events-none opacity-50"}`}>
                      Create GitHub issue
                    </a>
                    {!githubUrl && <span className="text-xs text-text-soft">Set NEXT_PUBLIC_GITHUB_ISSUES_REPO to enable.</span>}
                    <div className="flex gap-2">
                      <input value={issueUrl} onChange={(e) => setIssueUrl(e.target.value)} placeholder="Paste created issue URL" className="flex-1 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text-primary" />
                      <button type="button" disabled={saving || !issueUrl} onClick={() => save({ githubIssueUrl: issueUrl })} className="min-h-11 rounded-pill border border-border px-3 text-sm font-semibold disabled:opacity-50">Save URL</button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
