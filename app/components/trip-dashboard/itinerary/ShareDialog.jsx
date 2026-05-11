"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { createItineraryShare, listTripShares, revokeShare } from "../../../lib/api.js";
import "./ShareDialog.css";

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
    <div
      className="share-dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="share-dialog-shell"
        role="dialog"
        aria-modal="true"
        aria-label={`Share itinerary: ${tripTitle}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="share-dialog-header">
          <div className="share-dialog-header-text">
            <p className="share-eyebrow">Share Itinerary</p>
            <h2 className="share-dialog-title">{tripTitle || "Itinerary"}</h2>
          </div>
          <button
            type="button"
            className="share-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="share-dialog-body">
          {/* Create / Result Panel */}
          {dialogState === "create" ? (
            <section className="share-create-section">
              <h3 className="share-section-label">Generate Share Link</h3>
              <div className="share-fields">
                <div className="share-field">
                  <label htmlFor="share-client-name">Client Name <span className="optional-tag">optional</span></label>
                  <input
                    id="share-client-name"
                    type="text"
                    placeholder="e.g. Smith Family"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="share-field">
                  <label htmlFor="share-client-email">Client Email <span className="optional-tag">optional</span></label>
                  <input
                    id="share-client-email"
                    type="email"
                    placeholder="e.g. client@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="share-field">
                  <label htmlFor="share-expires">Expiration Date <span className="optional-tag">optional</span></label>
                  <input
                    id="share-expires"
                    type="date"
                    value={expiresAt}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              {generateError && (
                <p className="share-error-msg">{generateError}</p>
              )}

              <button
                type="button"
                className="share-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="share-spinner" />
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
            <section className="share-result-section">
              <h3 className="share-section-label">Share Link Ready</h3>

              {/* URL row */}
              <div className="share-url-row">
                <span className="share-url-text" title={shareUrl}>{shareUrl}</span>
                <button
                  type="button"
                  className={`share-copy-btn ${copySuccess ? "copied" : ""}`}
                  onClick={handleCopyUrl}
                  aria-label="Copy link"
                >
                  {copySuccess ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
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

              {/* QR Code */}
              <div className="share-qr-area">
                <div className="share-qr-code">
                  <QRCodeSVG
                    value={shareUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#223843"
                    level="M"
                  />
                </div>
                {/* Hidden canvas for PNG download */}
                <div ref={qrCanvasRef} className="share-qr-canvas-hidden">
                  <QRCodeCanvas
                    value={shareUrl}
                    size={400}
                    bgColor="#ffffff"
                    fgColor="#223843"
                    level="M"
                  />
                </div>
                <button
                  type="button"
                  className="share-download-qr-btn"
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

              <button
                type="button"
                className="share-back-btn"
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

          {/* Divider */}
          <div className="share-divider" />

          {/* Existing shares */}
          <section className="share-existing-section">
            <h3 className="share-section-label">Existing Share Links</h3>

            {isLoadingShares ? (
              <div className="share-shares-loading">
                <span className="share-spinner share-spinner--sm" />
                Loading…
              </div>
            ) : sharesError ? (
              <p className="share-error-msg">{sharesError}</p>
            ) : existingShares.length === 0 ? (
              <p className="share-no-shares">No share links created yet.</p>
            ) : (
              <ul className="share-list">
                {existingShares.map((share) => {
                  const status = getShareStatus(share);
                  const isActive = status === "Active";
                  const isConfirming = confirmRevokeId === share.id;
                  const isRevoking = revokingId === share.id;
                  const truncatedToken = share.token
                    ? `…${share.token.slice(-12)}`
                    : share.id?.slice(0, 12) ?? "—";

                  return (
                    <li key={share.id} className="share-list-item">
                      <div className="share-item-meta">
                        <span className="share-token-label" title={share.token}>
                          {truncatedToken}
                        </span>
                        <span className="share-item-date">
                          Created {formatShareDate(share.createdAt)}
                        </span>
                        {share.expiresAt && (
                          <span className="share-item-date">
                            Expires {formatShareDate(share.expiresAt)}
                          </span>
                        )}
                        {typeof share.viewCount === "number" && (
                          <span className="share-view-count">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            {share.viewCount} view{share.viewCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="share-item-right">
                        <span className={`share-status-chip share-status-chip--${status.toLowerCase()}`}>
                          {status}
                        </span>
                        {isActive && (
                          <>
                            <button
                              type="button"
                              className={`share-copy-link-btn ${copyLinkSuccess === share.token ? "copied" : ""}`}
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
                            <button
                              type="button"
                              className="share-regenerate-btn"
                              disabled={regeneratingId === share.id}
                              onClick={() => handleRegenerate(share.id)}
                              title="Generate a new share link and revoke this one"
                            >
                              {regeneratingId === share.id ? (
                                <>
                                  <span className="share-spinner share-spinner--xs" />
                                </>
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
                        {isActive && (
                          isConfirming ? (
                            <div className="share-revoke-confirm">
                              <span>Revoke?</span>
                              <button
                                type="button"
                                className="share-revoke-yes"
                                disabled={isRevoking}
                                onClick={() => handleRevoke(share.id)}
                              >
                                {isRevoking ? "…" : "Yes"}
                              </button>
                              <button
                                type="button"
                                className="share-revoke-no"
                                onClick={() => setConfirmRevokeId(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="share-revoke-btn"
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
