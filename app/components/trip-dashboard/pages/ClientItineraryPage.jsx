import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
    <div className="flex flex-col border border-border rounded-md bg-white overflow-hidden flex-shrink-0 max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Client Comments</span>
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill bg-secondary text-white text-[0.7rem] font-extrabold">
              {totalCount}
            </span>
          )}
        </div>
        <button
          className="w-7 h-7 rounded-lg border-none bg-transparent text-text-soft cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-border/[0.08] hover:text-text-primary flex-shrink-0"
          onClick={onClose}
          aria-label="Close comments"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {isLoading && (
          <div className="flex items-center gap-2.5 p-5 text-text-soft text-[0.9rem]">
            <div className="w-5 h-5 border-2 border-border border-t-secondary rounded-full animate-spin flex-shrink-0" />
            <span>Loading comments...</span>
          </div>
        )}
        {!isLoading && loadError && (
          <div className="p-5 text-center text-[#b91c1c] text-[0.85rem] font-semibold">
            Unable to load comments. Please try again.
          </div>
        )}
        {!isLoading && !loadError && grouped.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 px-5 text-text-soft text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-[0.9rem] m-0 leading-relaxed">No comments yet from this client.</p>
          </div>
        )}
        {!isLoading && !loadError && grouped.map(({ key, label, comments: groupComments }) => (
          <div key={key} className="flex flex-col gap-3">
            {/* Group label */}
            <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.06em] text-text-soft pb-1.5 border-b border-border">
              {label}
            </div>
            {groupComments.map((comment) => (
              <div
                key={comment.id}
                className="border border-border rounded-sm bg-white px-4 py-3.5 flex flex-col gap-2.5 transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(34,56,67,0.06)]"
              >
                <div className="flex flex-col gap-2">
                  {/* Author row */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[0.75rem] font-extrabold flex-shrink-0">
                      {String(comment.authorName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-px flex-1 min-w-0">
                      <span className="text-[0.85rem] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                        {comment.authorName || "Client"}
                      </span>
                      <span className="text-[0.73rem] text-text-soft">{formatCommentTime(comment.createdAt)}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-[3px] rounded-[6px] text-[0.65rem] font-extrabold tracking-[0.04em] uppercase flex-shrink-0 ${
                      comment.status === "ADDRESSED"
                        ? "bg-[#f0fdf4] text-[#166534] border border-[#dcfce7]"
                        : comment.status === "SEEN"
                        ? "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]"
                        : "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]"
                    }`}>
                      {comment.status === "ADDRESSED" ? "Addressed" : comment.status === "SEEN" ? "Seen" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[0.88rem] text-text-primary leading-[1.55] m-0">{comment.content}</p>
                </div>

                {comment.agencyReply && (
                  <div className="bg-background rounded-[10px] px-3.5 py-2.5 flex flex-col gap-1 border-l-[3px] border-secondary">
                    <div className="flex items-center gap-[5px] text-[0.72rem] font-extrabold uppercase tracking-[0.04em] text-secondary">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                      </svg>
                      Your reply
                    </div>
                    <p className="text-[0.85rem] text-text-primary leading-[1.5] m-0">{comment.agencyReply}</p>
                    {comment.agencyRepliedAt && (
                      <span className="text-[0.72rem] text-text-soft mt-0.5">{formatCommentTime(comment.agencyRepliedAt)}</span>
                    )}
                  </div>
                )}

                {!comment.agencyReply && (
                  <div className="flex flex-col">
                    {replyingTo !== comment.id ? (
                      <button
                        className="inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-lg border border-border bg-white text-text-soft text-[0.78rem] font-bold cursor-pointer transition-all duration-150 self-start hover:bg-background hover:text-text-primary hover:border-primary"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                        Reply
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full px-3 py-2.5 rounded-[10px] border border-border bg-background text-[0.85rem] font-[inherit] text-text-primary resize-none leading-relaxed transition-all duration-200 box-border focus:outline-none focus:border-secondary focus:bg-white focus:shadow-[0_0_0_3px_rgba(215,122,97,0.1)]"
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
                          <span className="text-[0.78rem] text-[#dc2626] font-semibold">{replyErrors[comment.id]}</span>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            className="px-3 py-1.5 rounded-lg border border-border bg-white text-text-soft text-[0.8rem] font-bold cursor-pointer transition-all duration-150 hover:bg-background hover:text-text-primary"
                            onClick={() => { setReplyingTo(null); setReplyErrors((p) => ({ ...p, [comment.id]: null })); }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-1.5 rounded-lg border-none bg-secondary text-white text-[0.8rem] font-bold cursor-pointer transition-all duration-150 hover:enabled:bg-[#c4674e] disabled:opacity-45 disabled:cursor-not-allowed"
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
  const [showClientDeleteConfirm, setShowClientDeleteConfirm] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
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

  const handleDeleteClient = async (client) => {
    if (!agencyId || !client || isDeletingClient) return;
    setIsDeletingClient(true);
    try {
      // Delete each trip sequentially to avoid overwhelming the server
      for (const trip of client.trips) {
        await onDeleteTrip?.(agencyId, trip.id);
      }
      setShowClientDeleteConfirm(null);
      // Auto-select next client if the deleted one was selected
      if (selectedClientId === client.id) {
        const remaining = filteredClients.filter(c => c.id !== client.id);
        if (remaining.length > 0) {
          setSelectedClientId(remaining[0].id);
          setSelectedTripId(remaining[0].trips[0]?.id || null);
        } else {
          setSelectedClientId(null);
          setSelectedTripId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete client trips:", err);
    } finally {
      setIsDeletingClient(false);
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

  // Status chip helper — shared between trip cards and itinerary header
  function StatusChip({ trip, size = "sm" }) {
    const label = getSavedStatusLabel(trip);
    const cls = getSavedStatusClass(label);
    const sizeClasses = size === "sm"
      ? "text-[0.65rem] px-2 py-1"
      : "text-[0.65rem] px-2 py-1";
    const colorClasses = cls === "approved"
      ? "bg-[#f0fdf4] text-[#166534] border-[#dcfce7]"
      : "bg-border/[0.06] text-text-primary border-border/[0.08]";
    return (
      <span className={`inline-flex items-center gap-1 w-fit rounded-[6px] font-extrabold tracking-[0.05em] uppercase border ${sizeClasses} ${colorClasses}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {label}
      </span>
    );
  }

  function renderItineraryContent() {
    if (isLoadingItinerary) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-text-soft gap-6 text-center px-10 py-[60px]">
          <div className="w-5 h-5 border-2 border-border border-t-secondary rounded-full animate-spin flex-shrink-0" />
          <p>Loading saved itinerary...</p>
        </div>
      );
    }
    if (itineraryError) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-text-soft gap-6 text-center px-10 py-[60px]">
          <p>Unable to load this saved itinerary.</p>
        </div>
      );
    }
    if (!selectedItineraryId) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-text-soft gap-6 text-center px-10 py-[60px]">
          <p>This saved trip is missing itinerary details.</p>
        </div>
      );
    }

    if (fullItinerary && safeDays.length > 0) {
      return (
        <div className="grid grid-cols-2 h-full bg-white">
          {/* Days column */}
          <div className={`flex flex-col overflow-y-auto border-r border-border p-6 ${showCommentsPanel ? "gap-4" : "gap-5"}`}>
            {/* Column header */}
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-2xl m-0 text-text-primary">{selectedTrip?.destination || tripTitle}</h3>
                <StatusChip trip={selectedTrip} />
              </div>
              <div className="flex items-center gap-2">
                {/* Comments button */}
                <button
                  className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border text-[0.85rem] font-bold cursor-pointer transition-all duration-200 relative ${
                    showCommentsPanel
                      ? "bg-primary text-white border-primary hover:bg-[#1a2d35] hover:border-[#1a2d35]"
                      : "bg-white text-text-primary border-border hover:bg-background"
                  }`}
                  onClick={() => setShowCommentsPanel((v) => !v)}
                  title="View client comments"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Comments
                  {unreadCommentCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-pill bg-[#dc2626] text-white text-[0.65rem] font-extrabold leading-none tracking-normal flex-shrink-0">
                      {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
                    </span>
                  )}
                </button>
                {/* Share button */}
                <button
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-white text-text-primary text-[0.85rem] font-bold cursor-pointer transition-all duration-200 hover:bg-background"
                  onClick={() => setShowShareDialog(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </button>
                {/* PDF button */}
                <button
                  className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-white text-text-primary text-[0.85rem] font-bold cursor-pointer transition-all duration-200 hover:bg-background ${pdfLoading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading || !fullItinerary}
                  title="Download itinerary as PDF"
                >
                  {pdfLoading ? (
                    <>
                      <span className="inline-block w-[13px] h-[13px] border-2 border-border border-t-secondary rounded-full animate-spin flex-shrink-0" />
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
                {/* More button */}
                <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-white text-text-primary cursor-pointer transition-all duration-200 hover:bg-background">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Meta row */}
            <div className="flex flex-wrap gap-6 -mt-2">
              {tripDateRange && (
                <span className="inline-flex items-center gap-2 text-[0.9rem] text-text-soft font-semibold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {tripDateRange}{durationLabel ? ` (${durationLabel})` : ""}
                </span>
              )}
              {travelerCount && (
                <span className="inline-flex items-center gap-2 text-[0.9rem] text-text-soft font-semibold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
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

            {/* Day timeline */}
            <div className="flex flex-col gap-4">
              {safeDays.map((day, dIdx) => {
                const accommodation = getAccommodationLabel(day);
                return (
                  <div key={day.id || day.dayNumber || dIdx} className="bg-transparent border-none p-0 rounded-none">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[#b91c1c] text-[0.85rem] font-extrabold">Day {day.dayNumber}</span>
                      <span className="text-[0.85rem] text-text-soft font-semibold">{formatDayDate(day, tripStart)}</span>
                    </div>
                    <h4 className="text-[1.2rem] font-extrabold m-0 mb-3 text-text-primary tracking-tight">{day.title}</h4>
                    {accommodation && (
                      <div className="flex items-center gap-2 text-[0.85rem] text-text-soft font-semibold mb-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01" />
                          <path d="M3 7l9-4 9 4" />
                        </svg>
                        {accommodation}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 pl-3 border-l-2 border-border">
                      {(day.items || []).map((item, iIdx) => {
                        const gIdx = mapItems.findIndex(m => m.__dayNumber === day.dayNumber && m.__itemIndex === iIdx);
                        const timeLabel = getItemTimeLabel(item);
                        return (
                          <div
                            key={`${day.dayNumber}-${iIdx}`}
                            className={`flex items-center gap-3 px-3 py-2 rounded-sm text-[0.9rem] transition-all duration-200 cursor-default ${activeStopIndex === gIdx ? "bg-background" : "hover:bg-background"}`}
                            onMouseEnter={() => setActiveStopIndex(gIdx)}
                          >
                            {timeLabel && (
                              <span className="text-[0.8rem] text-text-soft font-bold min-w-[50px]">{timeLabel}</span>
                            )}
                            <span className="font-bold text-text-primary">{item.title || "Untitled"}</span>
                            {item.description && (
                              <span className="text-[0.85rem] text-text-soft whitespace-nowrap overflow-hidden text-ellipsis max-w-[260px]">
                                {item.description}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map column */}
          <div className="relative min-h-0 p-4 bg-background">
            <div className="relative w-full h-full rounded-md overflow-hidden border border-border shadow-soft">
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

    return (
      <div className="flex flex-col items-center justify-center flex-1 text-text-soft gap-6 text-center px-10 py-[60px]">
        <p>This saved trip is missing itinerary details.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-2 h-full min-h-0 items-stretch p-2">
      {/* Client sidebar */}
      <aside className="bg-surface border border-border rounded-md flex flex-col overflow-hidden shadow-soft backdrop-blur-[8px]">
        {/* Pane header */}
        <div className="px-4 py-4 border-b border-border grid gap-2.5">
          <h3 className="font-serif text-[1.6rem] text-text-primary m-0 tracking-tight">Client Directory</h3>
          <div className="relative flex items-center">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3.5 text-text-soft pointer-events-none z-[1]"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pr-4 pl-12 rounded-md border border-border bg-background text-[0.95rem] font-[inherit] text-text-primary transition-all duration-200 focus:outline-none focus:border-secondary focus:bg-white focus:shadow-[0_0_0_4px_rgba(215,122,97,0.1)]"
            />
          </div>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {filteredClients.length > 0 ? (
            filteredClients.map(c => {
              const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const isConfirming = showClientDeleteConfirm === c.id;
              const isSelected = selectedClientId === c.id;

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 p-1 rounded-md transition-all duration-300 relative mb-0.5 ${
                    isSelected
                      ? "bg-primary shadow-[0_8px_24px_rgba(34,56,67,0.15)]"
                      : "hover:bg-background"
                  }`}
                >
                  <button
                    className="all-unset flex-1 flex items-center gap-3.5 px-3 py-2.5 cursor-pointer min-w-0 rounded-sm"
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setSelectedTripId(c.trips[0]?.id || null);
                    }}
                    title={`View ${c.name}'s itineraries`}
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[0.85rem] flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-200 ${
                      isSelected ? "bg-accent text-primary" : "bg-secondary text-white"
                    }`}>
                      {initials}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <strong className={`block text-[0.95rem] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${
                        isSelected ? "text-white" : "text-text-primary"
                      }`}>
                        {c.name}
                      </strong>
                      {!isConfirming && (
                        <span className={`text-[0.75rem] font-semibold opacity-70 transition-colors duration-200 ${
                          isSelected ? "text-white/80" : "text-text-soft"
                        }`}>
                          {c.trips.length} saved itineraries
                        </span>
                      )}
                    </div>
                  </button>

                  {isConfirming ? (
                    <div className="flex gap-1 pr-2 flex-shrink-0" style={{ animation: "cip-slide-in 0.2s ease-out" }}>
                      <button
                        className="px-2.5 py-1.5 rounded-[6px] border-none bg-[#dc2626] text-white text-[0.7rem] font-extrabold cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(220,38,38,0.25)] whitespace-nowrap hover:enabled:bg-[#b91c1c] hover:enabled:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeletingClient}
                        onClick={() => handleDeleteClient(c)}
                      >
                        {isDeletingClient ? "..." : "Delete"}
                      </button>
                      <button
                        className="px-2 py-1.5 rounded-[6px] border border-border bg-white text-[0.7rem] font-bold text-text-soft cursor-pointer transition-all duration-200 whitespace-nowrap hover:enabled:bg-background"
                        disabled={isDeletingClient}
                        onClick={() => setShowClientDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`border-none w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg transition-all duration-200 flex-shrink-0 mr-1 ${
                        isSelected
                          ? "bg-transparent text-white/60 hover:bg-white/15 hover:text-white"
                          : "bg-transparent text-text-soft hover:bg-[#fef2f2] hover:text-[#dc2626] hover:scale-110"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowClientDeleteConfirm(c.id);
                      }}
                      title="Delete client record"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 m-3 p-6 border-2 border-dashed border-border rounded-md bg-[rgba(34,56,67,0.02)] text-text-soft text-center gap-3.5 min-h-[240px]">
                <div className="text-secondary opacity-45 transition-opacity duration-300 hover:opacity-70">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-[0.85rem] font-bold tracking-[0.02em] m-0">No client directory yet.</p>
              </div>
            ) : searchQuery.trim() ? (
              <div className="px-3.5 py-[22px] text-center text-text-soft italic text-[0.9rem] leading-relaxed">
                No saved clients match your search.
              </div>
            ) : null
          )}
        </div>
      </aside>

      {/* Main workspace */}
      <main className="bg-surface border border-border rounded-md flex flex-col overflow-hidden shadow-soft h-full backdrop-blur-[8px]">
        {selectedClient ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Workspace header */}
            <header className="px-6 py-4 bg-transparent flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-[1.8rem] m-0 leading-none">{selectedClient.name}</h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2] text-[#b91c1c] text-[0.75rem] font-extrabold uppercase tracking-[0.05em]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                    Saved itineraries
                  </div>
                  <span className="text-[0.9rem] text-text-soft font-semibold">
                    {selectedClient.trips.length} saved
                  </span>
                </div>
              </div>
            </header>

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Trip strip */}
              <div className="flex gap-4 px-6 pb-5 bg-transparent overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {selectedClient.trips.map(t => (
                  <div
                    key={t.id}
                    className={`min-w-[240px] max-w-[280px] h-auto px-5 py-4 rounded-md border bg-white flex flex-col gap-2.5 text-left cursor-pointer transition-all duration-300 relative ${
                      selectedTripId === t.id
                        ? "border-secondary bg-[#fffcfb] shadow-[0_12px_30px_rgba(215,122,97,0.12)] outline outline-1 outline-secondary"
                        : "border-border hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.06)] hover:border-secondary"
                    }`}
                  >
                    <button
                      className="all-unset flex flex-col gap-1 cursor-pointer w-full"
                      aria-pressed={selectedTripId === t.id}
                      onClick={() => setSelectedTripId(t.id)}
                    >
                      <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
                        <strong className="block text-[1.05rem] text-text-primary m-0 leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis">
                          {t.destination || "Unnamed Trip"}
                        </strong>
                        <span className="text-[0.8rem] text-text-soft font-semibold mb-1">
                          {t.travelWindow || t.dates || "TBD"}
                        </span>
                        <StatusChip trip={t} />
                      </div>
                    </button>
                    {selectedTripId === t.id && unreadCommentCount > 0 && (
                      <div
                        className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-[5px] rounded-pill bg-[#dc2626] text-white text-[0.65rem] font-extrabold flex items-center justify-center leading-none shadow-[0_2px_6px_rgba(220,38,38,0.35)] pointer-events-none z-[2]"
                        title={`${unreadCommentCount} unread comment${unreadCommentCount !== 1 ? "s" : ""}`}
                      >
                        {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
                      </div>
                    )}
                    {showDeleteConfirm === t.id ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-border text-[0.75rem] font-semibold text-text-soft">
                        <span>Delete this trip?</span>
                        <button
                          className="px-2.5 py-1 rounded-[6px] border-none bg-[#dc2626] text-white text-[0.72rem] font-bold cursor-pointer transition-colors duration-150 hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={deletingTripId === t.id}
                          onClick={() => handleDeleteTrip(t.id)}
                        >
                          {deletingTripId === t.id ? "..." : "Yes"}
                        </button>
                        <button
                          className="px-2.5 py-1 rounded-[6px] border border-border bg-white text-[0.72rem] font-bold cursor-pointer text-text-soft transition-colors duration-150 hover:bg-background"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg border-none bg-transparent text-text-soft cursor-pointer flex items-center justify-center opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[#fef2f2] hover:text-[#dc2626] [.trip-card:hover_&]:opacity-100"
                        title="Delete trip"
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(t.id); }}
                        style={{ opacity: showDeleteConfirm !== null ? undefined : undefined }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => { if (showDeleteConfirm !== t.id) e.currentTarget.style.opacity = "0"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Itinerary preview area */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-background border-t border-border flex flex-col">
                {renderItineraryContent()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-text-soft gap-6 text-center px-10 py-[60px]">
            <div className="text-secondary opacity-45">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="font-serif text-[2.2rem] text-text-primary m-0 tracking-tight">No saved itineraries yet.</h3>
            <p className="max-w-[320px] mx-auto leading-relaxed text-[0.95rem] m-0">
              Saved itineraries will appear here after approval from Command Center.
            </p>
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

      <style>{`
        @keyframes cip-slide-in {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
