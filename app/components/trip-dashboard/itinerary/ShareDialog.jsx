"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { createItineraryShare, listTripShares, revokeShare } from "../../../lib/api.js";

function formatShareDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getShareStatus(share) {
  if (share.revokedAt) return "Revoked";
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return "Expired";
  return "Active";
}

/* ── Spinner component ─────────────────────────────────────── */
function Spinner({ size = "md" }) {
  const sizeClasses = {
    lg: "w-[15px] h-[15px] border-2 border-white/40 border-t-white",
    md: "w-[13px] h-[13px] border-2 border-primary/20 border-t-primary",
    sm: "w-[11px] h-[11px] border border-primary/20 border-t-primary",
  };
  return (
    <span
      className={`inline-block rounded-full animate-spin shrink-0 ${sizeClasses[size]}`}
      style={{ borderTopColor: "currentColor" }}
    />
  );
}

export default function ShareDialog({
  isOpen,
  onClose,
  agencyId,
  itineraryId,
  tripId,
  tripTitle,
}) {
  // Create / Result state
  const [dialogState, setDialogState] = useState("create"); // "create" | "result"
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [generatedShare, setGeneratedShare] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Existing shares
  const [existingShares, setExistingShares] = useState([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [sharesError, setSharesError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(null);

  // QR canvas ref for download
  const qrCanvasRef = useRef(null);

  const shareUrl = generatedShare?.token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/itinerary/view/${generatedShare.token}`
    : "";

  const fetchShares = useCallback(async () => {
    if (!agencyId || !tripId) return;
    setIsLoadingShares(true);
    setSharesError(null);
    try {
      const data = await listTripShares(agencyId, tripId);
      setExistingShares(Array.isArray(data?.shares) ? data.shares : []);
    } catch (err) {
      console.error("Failed to load shares:", err);
      setSharesError("Could not load existing share links.");
    } finally {
      setIsLoadingShares(false);
    }
  }, [agencyId, tripId]);

  // Reset dialog and fetch shares when opening
  useEffect(() => {
    if (!isOpen) return;
    setDialogState("create");
    setClientName("");
    setClientEmail("");
    setExpiresAt("");
    setGenerateError(null);
    setGeneratedShare(null);
    setCopySuccess(false);
    setConfirmRevokeId(null);
    fetchShares();
  }, [isOpen, fetchShares]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleGenerate = async () => {
    if (!agencyId || !itineraryId) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const payload = {};
      if (clientName.trim()) payload.clientName = clientName.trim();
      if (clientEmail.trim()) payload.clientEmail = clientEmail.trim();
      if (expiresAt) payload.expiresAt = new Date(expiresAt + "T23:59:59").toISOString();
      const data = await createItineraryShare(agencyId, itineraryId, payload);
      setGeneratedShare(data?.share ?? null);
      setDialogState("result");
      fetchShares();
    } catch (err) {
      console.error("Failed to create share:", err);
      setGenerateError("Failed to generate share link. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(tripTitle || "itinerary").replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRevoke = async (shareId) => {
    if (!agencyId || revokingId) return;
    setRevokingId(shareId);
    try {
      await revokeShare(agencyId, shareId);
      setConfirmRevokeId(null);
      await fetchShares();
    } catch (err) {
      console.error("Failed to revoke share:", err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRegenerate = async (shareId) => {
    if (!agencyId || !itineraryId || regeneratingId) return;
    setRegeneratingId(shareId);
    try {
      // Create new share with same settings
      await createItineraryShare(agencyId, itineraryId, {});
      // Then revoke the old one
      await revokeShare(agencyId, shareId);
      // Refresh the list
      await fetchShares();
    } catch (err) {
      console.error("Failed to regenerate share:", err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCopyShareLink = async (token) => {
    if (!token) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/itinerary/view/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyLinkSuccess(token);
      setTimeout(() => setCopyLinkSuccess(null), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopyLinkSuccess(token);
      setTimeout(() => setCopyLinkSuccess(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    /* ── Backdrop ──────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 grid place-items-center p-5 bg-black/40 backdrop-blur-sm sm:items-center items-end"
      role="presentation"
      onMouseDown={onClose}
    >
      {/* ── Modal shell ─────────────────────────────────────── */}
      <div
        className="
          w-full max-w-[520px] max-h-[min(90vh,780px)]
          flex flex-col
          bg-surface-elevated
          border border-border/20
          rounded-lg shadow-strong
          overflow-hidden
          sm:rounded-lg rounded-t-lg rounded-b-none
          sm:max-h-[min(90vh,780px)] max-h-[92vh]
        "
        role="dialog"
        aria-modal="true"
        aria-label={`Share itinerary: ${tripTitle}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/12 shrink-0">
          <div className="min-w-0">
            <p className="m-0 mb-1 text-[11px] font-extrabold tracking-[0.08em] uppercase text-secondary">
              Share Itinerary
            </p>
            <h2 className="m-0 font-serif text-xl leading-snug text-text-primary truncate max-w-[360px] sm:max-w-[360px] max-w-[240px]">
              {tripTitle || "Itinerary"}
            </h2>
          </div>
          <button
            type="button"
            className="
              shrink-0 w-[34px] h-[34px] grid place-items-center
              rounded-[10px] border border-border/20
              bg-surface text-text-muted
              cursor-pointer
              hover:bg-surface-elevated hover:border-border/30
              transition-colors duration-150
            "
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* ── Scrollable body ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-0">

          {/* ── Create / Result panel ───────────────────── */}
          {dialogState === "create" ? (
            <section className="mb-1">
              <h3 className="m-0 mb-3.5 text-[13px] font-bold tracking-[0.01em] text-text-primary">
                Generate Share Link
              </h3>

              {/* Fields */}
              <div className="flex flex-col gap-3 mb-4">
                {/* Client Name */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="share-client-name"
                    className="text-[12px] font-bold text-text-primary flex items-center gap-1.5"
                  >
                    Client Name
                    <span className="text-[10px] font-semibold text-text-muted lowercase tracking-normal">
                      optional
                    </span>
                  </label>
                  <input
                    id="share-client-name"
                    type="text"
                    placeholder="e.g. Smith Family"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="
                      w-full px-3.5 py-2.5
                      rounded-md border border-border/40
                      bg-surface text-[14px] text-text-primary
                      placeholder:text-text-soft/60
                      focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/14 focus:bg-surface-elevated
                      transition-[border-color,box-shadow] duration-150
                      box-border
                    "
                  />
                </div>

                {/* Client Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="share-client-email"
                    className="text-[12px] font-bold text-text-primary flex items-center gap-1.5"
                  >
                    Client Email
                    <span className="text-[10px] font-semibold text-text-muted lowercase tracking-normal">
                      optional
                    </span>
                  </label>
                  <input
                    id="share-client-email"
                    type="email"
                    placeholder="e.g. client@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="
                      w-full px-3.5 py-2.5
                      rounded-md border border-border/40
                      bg-surface text-[14px] text-text-primary
                      placeholder:text-text-soft/60
                      focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/14 focus:bg-surface-elevated
                      transition-[border-color,box-shadow] duration-150
                      box-border
                    "
                  />
                </div>

                {/* Expiration Date */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="share-expires"
                    className="text-[12px] font-bold text-text-primary flex items-center gap-1.5"
                  >
                    Expiration Date
                    <span className="text-[10px] font-semibold text-text-muted lowercase tracking-normal">
                      optional
                    </span>
                  </label>
                  <input
                    id="share-expires"
                    type="date"
                    value={expiresAt}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="
                      w-full px-3.5 py-2.5
                      rounded-md border border-border/40
                      bg-surface text-[14px] text-text-primary
                      placeholder:text-text-soft/60
                      focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/14 focus:bg-surface-elevated
                      transition-[border-color,box-shadow] duration-150
                      box-border
                    "
                  />
                </div>
              </div>

              {/* Error */}
              {generateError && (
                <p className="m-0 mb-3 px-3.5 py-2.5 rounded-sm bg-status-danger/8 border border-status-danger/30 text-status-danger text-[13px] leading-relaxed">
                  {generateError}
                </p>
              )}

              {/* Generate button */}
              <button
                type="button"
                className="
                  w-full inline-flex items-center justify-center gap-2
                  px-5 py-3
                  border-0 rounded-md
                  bg-secondary text-white text-[14px] font-bold
                  shadow-strong
                  cursor-pointer
                  hover:not-disabled:-translate-y-px hover:not-disabled:shadow-lg
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-[transform,box-shadow,background] duration-150
                "
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Spinner size="lg" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Generate Share Link
                  </>
                )}
              </button>
            </section>
          ) : (
            <section className="mb-1">
              <h3 className="m-0 mb-3.5 text-[13px] font-bold tracking-[0.01em] text-text-primary">
                Share Link Ready
              </h3>

              {/* URL row */}
              <div className="
                flex items-center gap-2.5
                px-3.5 py-2.5 mb-[18px]
                rounded-md bg-background border border-border/30
                sm:flex-row flex-col sm:items-center items-stretch
              ">
                <span
                  className="flex-1 min-w-0 text-[12.5px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis font-mono"
                  title={shareUrl}
                >
                  {shareUrl}
                </span>
                <button
                  type="button"
                  className={`
                    shrink-0 inline-flex items-center gap-1.5
                    px-3 py-1.5
                    rounded-[10px] border text-[12px] font-bold
                    cursor-pointer whitespace-nowrap
                    transition-[background,border-color,color] duration-150
                    sm:justify-start justify-center
                    ${copySuccess
                      ? "bg-status-success/10 border-status-success/40 text-status-success"
                      : "bg-surface-elevated border-border/30 text-text-muted hover:bg-surface hover:border-border/50"
                    }
                  `}
                  onClick={handleCopyUrl}
                  aria-label="Copy link"
                >
                  {copySuccess ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* QR Code area */}
              <div className="flex flex-col items-center gap-3.5 mb-4">
                {/* Visible SVG QR */}
                <div className="p-4 rounded-md bg-white border border-border/20 shadow-soft inline-block leading-none">
                  <QRCodeSVG
                    value={shareUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#223843"
                    level="M"
                  />
                </div>

                {/* Hidden canvas for PNG download */}
                <div
                  ref={qrCanvasRef}
                  className="absolute opacity-0 pointer-events-none -left-[9999px] -top-[9999px]"
                >
                  <QRCodeCanvas
                    value={shareUrl}
                    size={400}
                    bgColor="#ffffff"
                    fgColor="#223843"
                    level="M"
                  />
                </div>

                {/* Download button */}
                <button
                  type="button"
                  className="
                    inline-flex items-center gap-2
                    px-[18px] py-2.5
                    rounded-md border border-border/30
                    bg-surface-elevated text-primary text-[13px] font-bold
                    cursor-pointer
                    hover:bg-background hover:border-border/50 hover:-translate-y-px
                    transition-[background,border-color,transform] duration-150
                  "
                  onClick={handleDownloadQR}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download QR as PNG
                </button>
              </div>

              {/* Back button */}
              <button
                type="button"
                className="
                  block mx-auto px-3 py-1.5
                  border-0 bg-transparent
                  text-text-soft text-[13px] font-semibold
                  underline underline-offset-[3px]
                  cursor-pointer
                  hover:text-primary
                  transition-colors duration-150
                "
                onClick={() => {
                  setDialogState("create");
                  setGeneratedShare(null);
                  setClientName("");
                  setClientEmail("");
                  setExpiresAt("");
                }}
              >
                Generate another link
              </button>
            </section>
          )}

          {/* ── Divider ─────────────────────────────────── */}
          <div className="h-px bg-border/12 my-5 shrink-0" />

          {/* ── Existing shares ──────────────────────────── */}
          <section>
            <h3 className="m-0 mb-3.5 text-[13px] font-bold tracking-[0.01em] text-text-primary">
              Existing Share Links
            </h3>

            {isLoadingShares ? (
              <div className="flex items-center gap-2 text-[13px] text-text-soft py-2">
                <Spinner size="md" />
                Loading…
              </div>
            ) : sharesError ? (
              <p className="m-0 mb-3 px-3.5 py-2.5 rounded-sm bg-status-danger/8 border border-status-danger/30 text-status-danger text-[13px] leading-relaxed">
                {sharesError}
              </p>
            ) : existingShares.length === 0 ? (
              <p className="m-0 text-[13px] text-text-soft py-1">
                No share links created yet.
              </p>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {existingShares.map((share) => {
                  const status = getShareStatus(share);
                  const isActive = status === "Active";
                  const isConfirming = confirmRevokeId === share.id;
                  const isRevoking = revokingId === share.id;
                  const truncatedToken = share.token
                    ? `…${share.token.slice(-12)}`
                    : share.id?.slice(0, 12) ?? "—";

                  return (
                    <li
                      key={share.id}
                      className="
                        flex items-start justify-between gap-3
                        px-3.5 py-3
                        rounded-[14px]
                        bg-surface border border-border/20
                        hover:bg-surface-elevated
                        transition-colors duration-150
                        sm:flex-row flex-col sm:gap-3 gap-2.5
                      "
                    >
                      {/* Meta */}
                      <div className="flex flex-col gap-[3px] min-w-0">
                        <span
                          className="font-mono text-[12px] font-semibold text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                          title={share.token}
                        >
                          {truncatedToken}
                        </span>
                        <span className="text-[11.5px] text-text-soft">
                          Created {formatShareDate(share.createdAt)}
                        </span>
                        {share.expiresAt && (
                          <span className="text-[11.5px] text-text-soft">
                            Expires {formatShareDate(share.expiresAt)}
                          </span>
                        )}
                        {typeof share.viewCount === "number" && (
                          <span className="inline-flex items-center gap-1 text-[11.5px] text-text-soft">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            {share.viewCount} view{share.viewCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 shrink-0 sm:flex-wrap flex-wrap">
                        {/* Status chip */}
                        {status === "Active" && (
                          <span className="inline-flex items-center px-2.5 py-[3px] rounded-pill text-[11px] font-extrabold tracking-[0.04em] uppercase bg-status-success/10 text-status-success border border-status-success/30">
                            Active
                          </span>
                        )}
                        {status === "Expired" && (
                          <span className="inline-flex items-center px-2.5 py-[3px] rounded-pill text-[11px] font-extrabold tracking-[0.04em] uppercase bg-status-warning/10 text-status-warning border border-status-warning/30">
                            Expired
                          </span>
                        )}
                        {status === "Revoked" && (
                          <span className="inline-flex items-center px-2.5 py-[3px] rounded-pill text-[11px] font-extrabold tracking-[0.04em] uppercase bg-status-danger/8 text-status-danger border border-status-danger/30">
                            Revoked
                          </span>
                        )}

                        {isActive && (
                          <>
                            {/* Copy link icon button */}
                            <button
                              type="button"
                              className={`
                                shrink-0 w-8 h-8 flex items-center justify-center
                                rounded-[8px] border cursor-pointer
                                transition-[background,border-color,color] duration-150
                                sm:w-8 sm:h-8 w-full h-auto py-1.5
                                ${copyLinkSuccess === share.token
                                  ? "bg-status-success/10 border-status-success/40 text-status-success"
                                  : "bg-surface-elevated border-border/30 text-primary hover:bg-surface hover:border-border/50"
                                }
                              `}
                              onClick={() => handleCopyShareLink(share.token)}
                              aria-label="Copy share link"
                              title="Copy share link"
                            >
                              {copyLinkSuccess === share.token ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>

                            {/* Regenerate button */}
                            <button
                              type="button"
                              className="
                                shrink-0 inline-flex items-center gap-1.5
                                px-3 py-[5px]
                                rounded-[8px] border border-border/30
                                bg-surface-elevated text-primary text-[11.5px] font-bold
                                cursor-pointer
                                hover:not-disabled:bg-surface hover:not-disabled:border-border/50
                                disabled:opacity-60 disabled:cursor-not-allowed
                                transition-[background,border-color] duration-150
                                sm:w-auto w-full justify-center
                              "
                              disabled={regeneratingId === share.id}
                              onClick={() => handleRegenerate(share.id)}
                              title="Generate a new share link and revoke this one"
                            >
                              {regeneratingId === share.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                  </svg>
                                  Regenerate
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Revoke / Confirm */}
                        {isActive && (
                          isConfirming ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-semibold text-text-muted whitespace-nowrap">
                                Revoke?
                              </span>
                              <button
                                type="button"
                                className="
                                  px-2.5 py-1
                                  rounded-[7px] border-0
                                  bg-status-danger text-white text-[11.5px] font-bold
                                  cursor-pointer
                                  disabled:opacity-60 disabled:cursor-not-allowed
                                  transition-opacity duration-150
                                "
                                disabled={isRevoking}
                                onClick={() => handleRevoke(share.id)}
                              >
                                {isRevoking ? "…" : "Yes"}
                              </button>
                              <button
                                type="button"
                                className="
                                  px-2.5 py-1
                                  rounded-[7px] border border-border/30
                                  bg-surface-elevated text-text-muted text-[11.5px] font-bold
                                  cursor-pointer
                                  hover:bg-surface
                                  transition-colors duration-150
                                "
                                onClick={() => setConfirmRevokeId(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="
                                px-3 py-[5px]
                                rounded-[8px] border border-status-danger/40
                                bg-surface-elevated text-status-danger text-[11.5px] font-bold
                                cursor-pointer
                                hover:bg-status-danger/8 hover:border-status-danger/60
                                transition-[background,border-color] duration-150
                                sm:w-auto w-full
                              "
                              onClick={() => setConfirmRevokeId(share.id)}
                            >
                              Revoke
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
