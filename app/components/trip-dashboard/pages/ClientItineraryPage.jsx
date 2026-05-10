import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import "./ClientItineraryPage.css";
import dynamic from "next/dynamic";
import {
  fetchItineraryDraft,
  getUnreadCommentCount,
  listTripShares,
  listShareComments,
  replyToShareComment,
} from "../../../lib/api.js";
import { getItineraryPlaceEntityId } from "../../../lib/trip-dashboard/placeEntities.js";
import {
  getSavedItineraryTrips,
  getSavedStatusLabel,
  getStableItineraryId,
  groupSavedTripsByClient,
  normalizeItineraryResponse,
  resolveSavedPortfolioSelection,
} from "../../../lib/trip-dashboard/savedItineraries.js";
import ShareDialog from "../itinerary/ShareDialog.jsx";
import { generateItineraryPdf, titleToFilename } from "../../../lib/pdfExport.js";

const ItineraryLiveMap = dynamic(
  () => import("../itinerary/ItineraryLiveMap.jsx"),
  { ssr: false }
);

function getSavedStatusClass(statusLabel) {
  const normalized = String(statusLabel ?? "").toLowerCase().trim();
  if (normalized.includes("approved")) return "approved";
  if (normalized.includes("saved")) return "saved";
  if (normalized.includes("awaiting") || normalized.includes("pending") || normalized.includes("needs")) return "pending";
  return "default";
}

function getItemTimeLabel(item) {
  if (typeof item?.time === "string" && item.time.trim()) return item.time;
  if (item?.startTime && item?.endTime) return `${item.startTime} - ${item.endTime}`;
  if (item?.startTime) return item.startTime;
  if (item?.endTime) return `Ends ${item.endTime}`;
  return "";
}

function formatDayDate(day, tripStart) {
  if (day?.date) {
    const d = new Date(day.date);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  if (!tripStart || !day?.dayNumber) return "";
  const d = new Date(tripStart);
  d.setDate(d.getDate() + (day.dayNumber - 1));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getAccommodationLabel(day) {
  const items = Array.isArray(day?.items) ? day.items : [];
  const hotel = items.find(
    (i) => i?.type === "accommodation" || i?.type === "hotel" || /hotel|resort|inn|lodge|airbnb/i.test(i?.title ?? "")
  );
  return hotel?.title || hotel?.placeName || "";
}

function formatCommentTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Comment Panel Sub-component ──────────────────────────────────────────────

function CommentsPanel({ agencyId, tripId, onClose }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [replyTexts, setReplyTexts] = useState({});   // { [commentId]: string }
  const [submitting, setSubmitting] = useState(null);  // commentId being submitted
  const [replyErrors, setReplyErrors] = useState({});  // { [commentId]: string }

  useEffect(() => {
    if (!agencyId || !tripId) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setComments([]);

    (async () => {
      try {
        const sharesRes = await listTripShares(agencyId, tripId);
        const shares = Array.isArray(sharesRes?.shares) ? sharesRes.shares : [];
        if (cancelled) return;

        const commentArrays = await Promise.all(
          shares.map((share) =>
            listShareComments(agencyId, share.id)
              .then((r) => (Array.isArray(r?.comments) ? r.comments : []))
              .catch(() => [])
          )
        );
        if (cancelled) return;

        const all = commentArrays.flat();
        setComments(all);
      } catch (err) {
        if (!cancelled) setLoadError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [agencyId, tripId]);

  // Group by dayNumber; null/undefined => "General"
  const grouped = useMemo(() => {
    const map = new Map();
    map.set("general", []);
    comments.forEach((c) => {
      if (c.dayNumber != null) {
        const key = String(c.dayNumber);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(c);
      } else {
        map.get("general").push(c);
      }
    });
    // Sort day keys numerically, put "general" last
    const dayKeys = [...map.keys()]
      .filter((k) => k !== "general")
      .sort((a, b) => Number(a) - Number(b));
    const ordered = [];
    dayKeys.forEach((k) => {
      if (map.get(k).length > 0) ordered.push({ key: k, label: `Day ${k}`, comments: map.get(k) });
    });
    if (map.get("general").length > 0) {
      ordered.push({ key: "general", label: "General", comments: map.get("general") });
    }
    return ordered;
  }, [comments]);

  const handleReplyChange = (commentId, value) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: value }));
  };

  const handleReplySubmit = async (commentId) => {
    const content = (replyTexts[commentId] || "").trim();
    if (!content) return;
    setSubmitting(commentId);
    setReplyErrors((prev) => ({ ...prev, [commentId]: null }));
    try {
      const res = await replyToShareComment(agencyId, commentId, content);
      const updated = res?.comment;
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                agencyReply: updated?.agencyReply ?? content,
                agencyRepliedAt: updated?.agencyRepliedAt ?? new Date().toISOString(),
                status: "ADDRESSED",
              }
            : c
        )
      );
      setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
      setReplyingTo(null);
    } catch (err) {
      setReplyErrors((prev) => ({ ...prev, [commentId]: "Failed to send reply. Please try again." }));
    } finally {
      setSubmitting(null);
    }
  };

  const totalCount = comments.length;

  return (
    <div className="comments-panel">
      <div className="comments-panel-header">
        <div className="comments-panel-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Client Comments</span>
          {totalCount > 0 && <span className="comments-count-chip">{totalCount}</span>}
        </div>
        <button className="comments-panel-close" onClick={onClose} aria-label="Close comments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="comments-panel-body">
        {isLoading && (
          <div className="comments-loading">
            <div className="loading-spinner" />
            <span>Loading comments...</span>
          </div>
        )}
        {!isLoading && loadError && (
          <div className="comments-error">Unable to load comments. Please try again.</div>
        )}
        {!isLoading && !loadError && grouped.length === 0 && (
          <div className="comments-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No comments yet from this client.</p>
          </div>
        )}
        {!isLoading && !loadError && grouped.map(({ key, label, comments: groupComments }) => (
          <div key={key} className="comment-group">
            <div className="comment-group-label">{label}</div>
            {groupComments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <div className="comment-card-top">
                  <div className="comment-author-row">
                    <div className="comment-author-avatar">
                      {String(comment.authorName || "?")[0].toUpperCase()}
                    </div>
                    <div className="comment-author-info">
                      <span className="comment-author-name">{comment.authorName || "Client"}</span>
                      <span className="comment-timestamp">{formatCommentTime(comment.createdAt)}</span>
                    </div>
                    <span className={`comment-status-badge ${comment.status === "ADDRESSED" ? "addressed" : comment.status === "SEEN" ? "seen" : "pending"}`}>
                      {comment.status === "ADDRESSED" ? "Addressed" : comment.status === "SEEN" ? "Seen" : "Pending"}
                    </span>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                </div>

                {comment.agencyReply && (
                  <div className="comment-reply-bubble">
                    <div className="comment-reply-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                      </svg>
                      Your reply
                    </div>
                    <p className="comment-reply-text">{comment.agencyReply}</p>
                    {comment.agencyRepliedAt && (
                      <span className="comment-reply-time">{formatCommentTime(comment.agencyRepliedAt)}</span>
                    )}
                  </div>
                )}

                {!comment.agencyReply && (
                  <div className="comment-actions">
                    {replyingTo !== comment.id ? (
                      <button
                        className="reply-toggle-btn"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                        Reply
                      </button>
                    ) : (
                      <div className="reply-input-area">
                        <textarea
                          className="reply-textarea"
                          placeholder="Write a reply..."
                          value={replyTexts[comment.id] || ""}
                          onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                          rows={2}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleReplySubmit(comment.id);
                            }
                          }}
                        />
                        {replyErrors[comment.id] && (
                          <span className="reply-error">{replyErrors[comment.id]}</span>
                        )}
                        <div className="reply-input-actions">
                          <button
                            className="reply-cancel-btn"
                            onClick={() => { setReplyingTo(null); setReplyErrors((p) => ({ ...p, [comment.id]: null })); }}
                          >
                            Cancel
                          </button>
                          <button
                            className="reply-submit-btn"
                            disabled={submitting === comment.id || !(replyTexts[comment.id] || "").trim()}
                            onClick={() => handleReplySubmit(comment.id)}
                          >
                            {submitting === comment.id ? "Sending..." : "Send Reply"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ClientItineraryPage({ agencyTrips = [], agencyId, onDeleteTrip }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullItinerary, setFullItinerary] = useState(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [deletingTripId, setDeletingTripId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const requestSequenceRef = useRef(0);

  const savedTrips = useMemo(() => getSavedItineraryTrips(agencyTrips), [agencyTrips]);
  const clients = useMemo(() => {
    const clientOrder = new Map();
    const tripOrder = new Map();
    savedTrips.forEach((trip, index) => {
      if (!tripOrder.has(trip.id)) tripOrder.set(trip.id, index);
      const clientName = String(trip?.clientName ?? "").trim().replace(/\s+/g, " ");
      const clientId = clientName.toLowerCase();
      if (clientId && !clientOrder.has(clientId)) clientOrder.set(clientId, index);
    });
    return groupSavedTripsByClient(savedTrips)
      .map((client) => ({
        ...client,
        trips: [...client.trips].sort((a, b) => (tripOrder.get(a.id) ?? 0) - (tripOrder.get(b.id) ?? 0)),
      }))
      .sort((a, b) => (clientOrder.get(a.id) ?? 0) - (clientOrder.get(b.id) ?? 0));
  }, [savedTrips]);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedClient = clients.find(c => c.id === selectedClientId) || null;
  const selectedTrip = selectedClient?.trips.find(t => t.id === selectedTripId) || null;
  const selectedItineraryId = getStableItineraryId(selectedTrip);

  useEffect(() => {
    const nextSelection = resolveSavedPortfolioSelection({ clients, selectedClientId, selectedTripId });
    if (nextSelection.clientId !== selectedClientId) setSelectedClientId(nextSelection.clientId);
    if (nextSelection.tripId !== selectedTripId) setSelectedTripId(nextSelection.tripId);
  }, [clients, selectedClientId, selectedTripId]);

  useEffect(() => {
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    let cancelled = false;

    if (!agencyId || !selectedTrip || !selectedItineraryId) {
      setFullItinerary(null);
      setIsLoadingItinerary(false);
      setItineraryError(null);
      return () => { cancelled = true; };
    }

    setIsLoadingItinerary(true);
    setItineraryError(null);

    fetchItineraryDraft(agencyId, selectedItineraryId)
      .then((res) => {
        if (cancelled || requestSequenceRef.current !== requestId) return;
        setFullItinerary(normalizeItineraryResponse(res));
      })
      .catch((err) => {
        if (cancelled || requestSequenceRef.current !== requestId) return;
        console.error(err);
        setFullItinerary(null);
        setItineraryError(err);
      })
      .finally(() => {
        if (cancelled || requestSequenceRef.current !== requestId) return;
        setIsLoadingItinerary(false);
      });

    return () => { cancelled = true; };
  }, [agencyId, selectedTrip, selectedItineraryId]);

  // Fetch unread comment count when a trip with a valid agencyId is selected
  useEffect(() => {
    if (!agencyId || !selectedTripId) {
      setUnreadCommentCount(0);
      return;
    }
    let cancelled = false;
    getUnreadCommentCount(agencyId)
      .then((res) => {
        if (!cancelled) setUnreadCommentCount(res?.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setUnreadCommentCount(0);
      });
    return () => { cancelled = true; };
  }, [agencyId, selectedTripId]);

  // Close comments panel when trip changes
  useEffect(() => {
    setShowCommentsPanel(false);
  }, [selectedTripId]);

  const safeDays = useMemo(
    () => (Array.isArray(fullItinerary?.days) ? fullItinerary.days : []),
    [fullItinerary]
  );

  const mapItems = useMemo(
    () =>
      safeDays.reduce((acc, day) => {
        (day?.items || []).forEach((item, idx) =>
          acc.push({
            ...item,
            __dayNumber: day?.dayNumber,
            __dayTitle: day?.title,
            __itemIndex: idx,
            __placeEntityId: getItineraryPlaceEntityId(item, day, idx),
          })
        );
        return acc;
      }, []),
    [safeDays]
  );

  useEffect(() => {
    setActiveStopIndex(mapItems.length > 0 ? 0 : -1);
  }, [mapItems.length]);

  const tripTitle = fullItinerary?.title || selectedTrip?.destination || "Itinerary";
  const tripSummary = fullItinerary?.summary || "";
  const tripStart = fullItinerary?.trip?.startDate || selectedTrip?.startDate;
  const tripEnd = fullItinerary?.trip?.endDate || selectedTrip?.endDate;
  const travelerCount = fullItinerary?.trip?.travelerCount || selectedTrip?.travelerCount;

  const nightCount = useMemo(() => {
    if (!tripStart || !tripEnd) return null;
    const diff = Math.round((new Date(tripEnd) - new Date(tripStart)) / 86400000);
    return diff > 0 ? diff : null;
  }, [tripStart, tripEnd]);

  const tripDateRange = useMemo(() => {
    if (!tripStart) return "";
    const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return tripEnd ? `${fmt(tripStart)} - ${fmt(tripEnd)}` : fmt(tripStart);
  }, [tripStart, tripEnd]);

  const durationLabel = useMemo(() => {
    const parts = [];
    if (safeDays.length > 0) parts.push(`${safeDays.length} day${safeDays.length > 1 ? "s" : ""}`);
    if (nightCount) parts.push(`${nightCount} night${nightCount > 1 ? "s" : ""}`);
    return parts.join(" / ");
  }, [safeDays.length, nightCount]);

  const handleDeleteTrip = async (tripId) => {
    if (!agencyId || !tripId || deletingTripId) return;
    setDeletingTripId(tripId);
    try {
      await onDeleteTrip?.(agencyId, tripId);
      setShowDeleteConfirm(null);
      if (selectedTripId === tripId) {
        const remaining = selectedClient?.trips.filter(t => t.id !== tripId) || [];
        setSelectedTripId(remaining[0]?.id || null);
      }
    } catch (e) {
      console.error("Failed to delete trip:", e);
    } finally {
      setDeletingTripId(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!fullItinerary || pdfLoading) return;
    setPdfLoading(true);
    try {
      const dateRange = tripDateRange;
      const doc = await generateItineraryPdf({
        title:         tripTitle,
        summary:       tripSummary,
        dateRange,
        travelerCount,
        days:          safeDays,
        agencyName:    "Voyage",
      });
      doc.save(titleToFilename(tripTitle));
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  function renderItineraryContent() {
    if (isLoadingItinerary) {
      return (
        <div className="empty-workspace">
          <div className="loading-spinner" />
          <p>Loading saved itinerary...</p>
        </div>
      );
    }
    if (itineraryError) {
      return <div className="empty-workspace"><p>Unable to load this saved itinerary.</p></div>;
    }
    if (!selectedItineraryId) {
      return <div className="empty-workspace"><p>This saved trip is missing itinerary details.</p></div>;
    }

    if (fullItinerary && safeDays.length > 0) {
      return (
        <div className="itinerary-split-view">
          <div className={`itinerary-days-column${showCommentsPanel ? " comments-open" : ""}`}>
            <header className="itinerary-days-header">
              <div className="itinerary-title-group">
                <h3>{selectedTrip?.destination || tripTitle}</h3>
                <span className={`trip-status-chip ${getSavedStatusClass(getSavedStatusLabel(selectedTrip))}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  {getSavedStatusLabel(selectedTrip)}
                </span>
              </div>
              <div className="itinerary-actions">
                <button
                  className={`action-btn comments-btn${showCommentsPanel ? " active" : ""}`}
                  onClick={() => setShowCommentsPanel((v) => !v)}
                  title="View client comments"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Comments
                  {unreadCommentCount > 0 && (
                    <span className="comment-notification-badge">
                      {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
                    </span>
                  )}
                </button>
                <button className="action-btn share-btn" onClick={() => setShowShareDialog(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  Share
                </button>
                <button
                  className={`action-btn share-btn pdf-btn${pdfLoading ? " pdf-btn--loading" : ""}`}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading || !fullItinerary}
                  title="Download itinerary as PDF"
                >
                  {pdfLoading ? (
                    <>
                      <span className="pdf-spinner" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      PDF
                    </>
                  )}
                </button>
                <button className="action-btn more-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                </button>
              </div>
            </header>

            <div className="itinerary-meta-row">
              {tripDateRange && (
                <span className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  {tripDateRange}{durationLabel ? ` (${durationLabel})` : ""}
                </span>
              )}
              {travelerCount && (
                <span className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  {travelerCount} traveler{travelerCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {showCommentsPanel && (
              <CommentsPanel
                agencyId={agencyId}
                tripId={selectedTripId}
                onClose={() => setShowCommentsPanel(false)}
              />
            )}

            <div className="day-timeline-list">
              {safeDays.map((day, dIdx) => {
                const accommodation = getAccommodationLabel(day);
                return (
                  <div key={day.id || day.dayNumber || dIdx} className="day-section">
                    <div className="day-section-header">
                      <span className="day-number-badge">Day {day.dayNumber}</span>
                      <span className="day-date-label">{formatDayDate(day, tripStart)}</span>
                    </div>
                    <h4 className="day-section-title">{day.title}</h4>
                    {accommodation && (
                      <div className="day-accommodation">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01" /><path d="M3 7l9-4 9 4" /></svg>
                        {accommodation}
                      </div>
                    )}
                    <div className="day-items-summary">
                      {(day.items || []).map((item, iIdx) => {
                        const gIdx = mapItems.findIndex(m => m.__dayNumber === day.dayNumber && m.__itemIndex === iIdx);
                        const timeLabel = getItemTimeLabel(item);
                        return (
                          <div
                            key={`${day.dayNumber}-${iIdx}`}
                            className={`day-item-row ${activeStopIndex === gIdx ? "active" : ""}`}
                            onMouseEnter={() => setActiveStopIndex(gIdx)}
                          >
                            {timeLabel && <span className="item-time">{timeLabel}</span>}
                            <span className="item-title">{item.title || "Untitled"}</span>
                            {item.description && <span className="item-desc">{item.description}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="itinerary-map-column">
            <div className="map-container">
              <ItineraryLiveMap
                items={mapItems}
                liveMarkers={[]}
                routeEstimates={[]}
                activeIndex={activeStopIndex}
                onHoverItem={setActiveStopIndex}
                selectedPlaceId=""
                selectedPlace={null}
                onSelectPlace={() => {}}
              />
            </div>
          </div>
        </div>
      );
    }

    return <div className="empty-workspace"><p>This saved trip is missing itinerary details.</p></div>;
  }

  return (
    <div className="client-itinerary-surface">
      <aside className="client-sidebar-pane">
        <div className="pane-header">
          <h3 className="section-title">Client Directory</h3>
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="text" placeholder="Search clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
          </div>
        </div>
        <div className="client-list">
          {filteredClients.length > 0 ? (
            filteredClients.map(c => {
              const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <button key={c.id} className={`client-card ${selectedClientId === c.id ? 'active' : ''}`} aria-pressed={selectedClientId === c.id} onClick={() => { setSelectedClientId(c.id); setSelectedTripId(c.trips[0]?.id || null); }}>
                  <div className="client-avatar">{initials}</div>
                  <div className="client-info"><strong>{c.name}</strong><span>{c.trips.length} saved itineraries</span></div>
                </button>
              );
            })
          ) : (
            clients.length === 0 ? (
              <div className="sidebar-empty-state">
                <div className="empty-state-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p>No client directory yet.</p>
              </div>
            ) : searchQuery.trim() ? (
              <div className="empty-results">No saved clients match your search.</div>
            ) : null
          )}
        </div>
      </aside>

      <main className="workspace-pane">
        {selectedClient ? (
          <div className="workspace-content">
            <header className="workspace-header">
              <div className="client-meta-row">
                <div className="client-meta-copy">
                  <h2>{selectedClient.name}</h2>
                  <div className="saved-itineraries-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    Saved itineraries
                  </div>
                  <span className="saved-count-label">{selectedClient.trips.length} saved</span>
                </div>
              </div>
            </header>
            <div className="workspace-layout">
              <div className="trip-strip">
                {selectedClient.trips.map(t => (
                  <div key={t.id} className={`trip-card ${selectedTripId === t.id ? 'active' : ''}`}>
                    <button className="trip-card-select" aria-pressed={selectedTripId === t.id} onClick={() => setSelectedTripId(t.id)}>
                      <div className="trip-card-body">
                        <strong>{t.destination || "Unnamed Trip"}</strong>
                        <span className="trip-dates">{t.travelWindow || t.dates || "TBD"}</span>
                        <span className={`trip-status-chip ${getSavedStatusClass(getSavedStatusLabel(t))}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          {getSavedStatusLabel(t)}
                        </span>
                      </div>
                    </button>
                    {selectedTripId === t.id && unreadCommentCount > 0 && (
                      <div className="trip-card-comment-badge" title={`${unreadCommentCount} unread comment${unreadCommentCount !== 1 ? "s" : ""}`}>
                        {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
                      </div>
                    )}
                    {showDeleteConfirm === t.id ? (
                      <div className="delete-confirm-bar">
                        <span>Delete this trip?</span>
                        <button className="confirm-yes" disabled={deletingTripId === t.id} onClick={() => handleDeleteTrip(t.id)}>
                          {deletingTripId === t.id ? "..." : "Yes"}
                        </button>
                        <button className="confirm-no" onClick={() => setShowDeleteConfirm(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        className="trip-delete-btn"
                        title="Delete trip"
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(t.id); }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="itinerary-preview-area">
                {renderItineraryContent()}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-workspace">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>No saved itineraries yet.</h3>
            <p>Saved itineraries will appear here after approval from Command Center.</p>
          </div>
        )}
      </main>

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        agencyId={agencyId}
        itineraryId={selectedItineraryId}
        tripId={selectedTripId}
        tripTitle={tripTitle}
      />
    </div>
  );
}
