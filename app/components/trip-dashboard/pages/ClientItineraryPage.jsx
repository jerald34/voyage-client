import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import {
  fetchItineraryDraft,
  getUnreadCommentCount,
  listTripShares,
  listShareComments,
  replyToShareComment,
} from "../../../lib/api.js";
import { getItineraryPlaceEntityId } from "../../../lib/trip-dashboard/placeEntities.js";
import { getSnapshotPhotoUrl, getReadablePlaceType } from "../../../lib/trip-dashboard/richItinerary.js";
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
import MobileGlassSheet from "../mobile/MobileGlassSheet.jsx";
import CompactPlaceCard from "../mobile/CompactPlaceCard.jsx";
import useMobileViewport from "../mobile/useMobileViewport.js";

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

function formatDayCardDate(day, tripStart) {
  let start;
  if (day?.date) {
    start = new Date(day.date);
  } else if (tripStart && day?.dayNumber) {
    start = new Date(tripStart);
    start.setDate(start.getDate() + (day.dayNumber - 1));
  } else {
    return "";
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
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
    <div className="flex flex-col border border-border rounded-md bg-surface overflow-hidden flex-shrink-0 max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-border bg-surface-elevated flex-shrink-0">
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
                className="border border-border rounded-sm bg-surface-elevated px-4 py-3.5 flex flex-col gap-2.5 transition-shadow duration-200 hover:shadow-soft"
              >
                <div className="flex flex-col gap-2">
                  {/* Author row */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-[0.75rem] font-extrabold flex-shrink-0 shadow-sm">
                      {String(comment.authorName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-px flex-1 min-w-0">
                      <span className="text-[0.85rem] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                        {comment.authorName || "Client"}
                      </span>
                      <span className="text-[0.73rem] text-text-soft">{formatCommentTime(comment.createdAt)}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-[3px] rounded-[6px] text-[0.65rem] font-extrabold tracking-[0.04em] uppercase flex-shrink-0 ${comment.status === "ADDRESSED"
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
                          className="w-full px-3 py-2.5 rounded-[10px] border border-border bg-background text-[0.85rem] font-[inherit] text-text-primary resize-none leading-relaxed transition-all duration-200 box-border focus:outline-none focus:border-secondary focus:bg-surface focus:shadow-[0_0_0_3px_rgba(215,122,97,0.1)]"
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
                            className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-soft text-[0.8rem] font-bold cursor-pointer transition-all duration-150 hover:bg-background hover:text-text-primary"
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

export default function ClientItineraryPage({
  agencyTrips = [],
  agencyId,
  onDeleteTrip,
  onTourStateChange,
  tourMobilePaneOverride = null,
  onAddTripForClient,
}) {
  const { theme } = useTheme();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullItinerary, setFullItinerary] = useState(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showClientDeleteConfirm, setShowClientDeleteConfirm] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [internalMobilePane, setInternalMobilePane] = useState("list"); // "list" | "detail" — mobile only
  // When a tour is active, HomePage drives the pane via `tourMobilePaneOverride`
  // so the tour's spotlighted target (list pane vs detail pane) is always
  // visible. User-initiated pane changes still go through setInternalMobilePane.
  const mobilePane = tourMobilePaneOverride ?? internalMobilePane;
  const setMobilePane = setInternalMobilePane;
  const [mobileMapPadding, setMobileMapPadding] = useState(0);
  const isMobile = useMobileViewport();
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

  // Notify parent (HomePage) so the unified tour can filter out steps whose
  // targets are conditionally rendered (e.g. trip-selector when a client only
  // has one saved itinerary).
  const hasSelectedClient = Boolean(selectedClient);
  const hasMultipleTrips = Boolean(selectedClient && selectedClient.trips.length > 1);
  const hasItineraryDays = Boolean(
    fullItinerary && Array.isArray(fullItinerary.days) && fullItinerary.days.length > 0,
  );
  useEffect(() => {
    onTourStateChange?.({ hasSelectedClient, hasMultipleTrips, hasItineraryDays });
  }, [onTourStateChange, hasSelectedClient, hasMultipleTrips, hasItineraryDays]);

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

  // Reset per-trip UI state when trip changes
  useEffect(() => {
    setShowCommentsPanel(false);
    setSelectedDayIndex(0);
    setSelectedPlaceId("");
  }, [selectedTripId]);

  const safeDays = useMemo(
    () => (Array.isArray(fullItinerary?.days) ? fullItinerary.days : []),
    [fullItinerary]
  );

  const selectedDay = safeDays[selectedDayIndex] || null;

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

  const selectedDayMapItems = useMemo(
    () =>
      selectedDay
        ? mapItems.filter((m) => m.__dayNumber === selectedDay.dayNumber)
        : mapItems,
    [mapItems, selectedDay]
  );

  const selectedMobileMapItem = useMemo(() => {
    if (!Array.isArray(selectedDayMapItems) || selectedDayMapItems.length === 0) return null;
    const selectedById = selectedDayMapItems.find((item) => item.__placeEntityId === selectedPlaceId) || null;
    const clampedIndex = Math.max(0, Math.min(activeStopIndex, selectedDayMapItems.length - 1));
    const item = selectedById || selectedDayMapItems[clampedIndex];
    if (!item) return null;

    const snapshot = item?.placeSnapshot ?? null;
    const lat = Number(item?.lat ?? item?.latitude ?? snapshot?.latitude);
    const lng = Number(item?.lng ?? item?.longitude ?? snapshot?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const rating = snapshot?.rating ?? snapshot?.metadata?.rating ?? null;

    return {
      id: item.__placeEntityId || getItineraryPlaceEntityId(item, selectedDay, clampedIndex),
      lat,
      lng,
      name: snapshot?.name || item?.placeName || item?.title || "Untitled",
      description: item?.description || snapshot?.formattedAddress || item?.type || "",
      formattedAddress: snapshot?.formattedAddress || "",
      timeLabel: getItemTimeLabel(item),
      placeType: getReadablePlaceType(snapshot) || item?.type || "",
      rating: rating ? String(rating) : "",
    };
  }, [activeStopIndex, selectedDay, selectedDayMapItems, selectedPlaceId]);

  useEffect(() => {
    setActiveStopIndex(selectedDayMapItems.length > 0 ? 0 : -1);
    setSelectedPlaceId(selectedDayMapItems[0]?.__placeEntityId ?? "");
  }, [selectedDayMapItems]);

  const tripTitle = fullItinerary?.title || selectedTrip?.destination || "Itinerary";
  const tripSummary = fullItinerary?.summary || "";
  const tripStart = fullItinerary?.trip?.startDate || selectedTrip?.startDate;
  const tripEnd = fullItinerary?.trip?.endDate || selectedTrip?.endDate;
  const travelerCount = fullItinerary?.trip?.travelerCount || selectedTrip?.travelerCount;

  const tripDateRange = useMemo(() => {
    if (!tripStart) return "";
    const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return tripEnd ? `${fmt(tripStart)} - ${fmt(tripEnd)}` : fmt(tripStart);
  }, [tripStart, tripEnd]);

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
        title: tripTitle,
        summary: tripSummary,
        dateRange,
        travelerCount,
        days: safeDays,
        agencyName: "Voyage",
      });
      doc.save(titleToFilename(tripTitle));
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCipSnapChange = useCallback((snap) => {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    if (snap === "peek") setMobileMapPadding(120);
    else if (snap === "half") setMobileMapPadding(Math.round(vh * 0.55));
    else setMobileMapPadding(Math.round(vh * 0.9));
  }, []);

  // Status chip helper — shared between trip cards and itinerary header
  function StatusChip({ trip, size = "sm" }) {
    const label = getSavedStatusLabel(trip);
    const cls = getSavedStatusClass(label);
    const sizeClasses = size === "sm"
      ? "text-[0.65rem] px-2 py-1"
      : "text-[0.65rem] px-2 py-1";
    const colorClasses = cls === "approved"
      ? "bg-secondary/10 text-secondary border-secondary/20"
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
      const dayAccommodation = selectedDay ? getAccommodationLabel(selectedDay) : "";
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full bg-surface/20 backdrop-blur-sm">
          {/* Day content column */}
          <div className="flex flex-col overflow-y-auto border-r border-border/5 p-4 sm:p-6 gap-4">
            {showCommentsPanel && (
              <CommentsPanel
                agencyId={agencyId}
                tripId={selectedTripId}
                onClose={() => setShowCommentsPanel(false)}
              />
            )}
            {selectedDay && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-secondary/80 text-[0.85rem] font-extrabold uppercase tracking-wider">Day {selectedDay.dayNumber}</span>
                  <span className="text-[0.85rem] text-text-soft font-semibold">{formatDayDate(selectedDay, tripStart)}</span>
                </div>
                <h4 className="text-[1.5rem] font-extrabold m-0 text-text-primary tracking-tight">{selectedDay.title}</h4>
                {dayAccommodation && (
                  <div className="flex items-center gap-2 text-[0.85rem] text-text-soft font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01" />
                      <path d="M3 7l9-4 9 4" />
                    </svg>
                    {dayAccommodation}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {(selectedDay.items || []).map((item, iIdx) => {
                    const dayItemIdx = selectedDayMapItems.findIndex(
                      (m) => m.__dayNumber === selectedDay.dayNumber && m.__itemIndex === iIdx
                    );
                    const timeLabel = getItemTimeLabel(item);
                    const snapshot = item?.placeSnapshot ?? null;
                    const photoUrl = getSnapshotPhotoUrl(snapshot);
                    const placeType = getReadablePlaceType(snapshot);
                    const rating = snapshot?.rating ?? snapshot?.metadata?.rating ?? null;
                    const description = (item.description || snapshot?.formattedAddress || "").trim();
                    const highlights = Array.isArray(item.highlights)
                      ? item.highlights
                      : Array.isArray(item.metadata?.highlights) ? item.metadata.highlights : [];
                    const placeName = snapshot?.name || item.placeName || item.title || "Untitled";
                    const isActive = activeStopIndex === dayItemIdx;

                    return (
                      <div
                        key={`${selectedDay.dayNumber}-${iIdx}`}
                        className={`flex flex-col gap-3 border rounded-xl p-4 cursor-default transition-all duration-200 ${isActive
                          ? "border-secondary/40 bg-secondary/5 shadow-soft"
                          : "border-border/20 bg-surface-elevated hover:border-secondary/20 hover:shadow-soft"
                          }`}
                        onMouseEnter={() => setActiveStopIndex(dayItemIdx)}
                      >
                        {/* Time badge + type */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/5 pb-2">
                          <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[0.7rem] font-black tracking-tight">
                            {timeLabel || "Time pending"}
                          </span>
                          {placeType && (
                            <span className="text-[0.65rem] font-bold tracking-widest uppercase text-text-soft">
                              {placeType}
                            </span>
                          )}
                        </div>

                        {/* Image + title + rating */}
                        <div className="flex gap-4 items-start">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={placeName}
                              className="w-20 h-20 rounded-xl object-cover shadow-md flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center bg-background text-text-soft text-2xl font-serif font-bold border border-border/10 shadow-inner">
                              {placeName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h5 className="m-0 text-text-primary text-[1rem] font-serif leading-tight tracking-tight">
                              {item.title || placeName}
                            </h5>
                            {rating && (
                              <span className="text-[0.7rem] font-bold text-text-soft flex items-center gap-0.5">
                                ★ {rating}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description + highlights */}
                        {(description || highlights.length > 0) && (
                          <div className="flex flex-col gap-2">
                            {description && (
                              <p className="m-0 text-text-primary text-[0.85rem] leading-relaxed font-medium opacity-90">
                                {description}
                              </p>
                            )}
                            {highlights.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {highlights.map((h, hIdx) => (
                                  <span key={hIdx} className="px-2 py-0.5 rounded-md bg-background/50 border border-border/10 text-text-soft text-[0.65rem] font-bold">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Map column — hidden on mobile, full panel on lg+ */}
          <div className="hidden lg:relative lg:block min-h-0 p-4 bg-surface">
            <div className="relative w-full h-full rounded-md overflow-hidden border border-border/10 shadow-soft">
              <ItineraryLiveMap
                items={selectedDayMapItems}
                liveMarkers={[]}
                routeEstimates={[]}
                activeIndex={activeStopIndex}
                onHoverItem={setActiveStopIndex}
                selectedPlaceId=""
                selectedPlace={null}
                onSelectPlace={() => { }}
                theme={theme}
                sidebarWidth={0}
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

  // Mobile layout: map background + glass sheet
  if (isMobile) {
    return (
      <div className="relative flex-1 h-full min-h-0 overflow-hidden">
        {/* Map background */}
        <div className="absolute inset-0 z-0">
          <ItineraryLiveMap
            items={selectedDayMapItems}
            liveMarkers={[]}
            routeEstimates={[]}
            activeIndex={activeStopIndex}
            onHoverItem={setActiveStopIndex}
            selectedPlaceId={selectedMobileMapItem?.id ?? ""}
            selectedPlace={null}
            onSelectPlace={(placeId) => {
              const nextIndex = selectedDayMapItems.findIndex((item) => item.__placeEntityId === placeId);
              if (nextIndex >= 0) {
                setActiveStopIndex(nextIndex);
                setSelectedPlaceId(placeId);
              }
            }}
            theme={theme}
            sidebarWidth={0}
            mapBottomPadding={mobileMapPadding}
          />
        </div>

        {/* Glass sheet */}
        <MobileGlassSheet
          defaultSnap="half"
          onSnapChange={handleCipSnapChange}
        >
          {mobilePane === "list" ? (
            <div className="flex flex-col h-full" data-tour-target="cip-client-directory">
              <div className="px-4 py-3 border-b border-border/5">
                <h3 className="font-serif text-[1.3rem] text-text-primary m-0 tracking-tight mb-2">Client Directory</h3>
                <div className="relative flex items-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none z-[1]">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2.5 pr-3 pl-10 rounded-md border border-border/10 bg-white/5 text-[0.9rem] font-[inherit] text-text-primary transition-all duration-200 focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => {
                    const initials = c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    const isSelected = selectedClientId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 w-full text-left ${isSelected
                          ? "bg-secondary/20 border-secondary/30 shadow-soft"
                          : "bg-transparent border-transparent hover:bg-background"
                          }`}
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setSelectedTripId(c.trips[0]?.id || null);
                          setMobilePane("detail");
                        }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[0.8rem] flex-shrink-0 ${isSelected ? "bg-secondary text-white" : "bg-secondary/40 text-white"
                          }`}>
                          {initials}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <strong className={`text-[0.9rem] font-bold tracking-tight truncate ${isSelected ? "text-secondary" : "text-text-primary"}`}>
                            {c.name}
                          </strong>
                          <span className="text-[0.75rem] text-text-soft font-semibold">{c.trips.length} saved itineraries</span>
                        </div>
                      </button>
                    );
                  })
                ) : clients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-6 text-text-soft text-center gap-3 min-h-[200px]">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-secondary opacity-45">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <p className="text-[0.85rem] font-bold m-0">No client directory yet.</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full" data-tour-target="cip-workspace">
              <div className="sticky top-0 z-30 px-4 py-2.5 border-b border-white/10 bg-[rgba(17,24,39,0.15)] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setMobilePane("list")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted bg-transparent border-0 cursor-pointer hover:text-text-primary transition-colors min-h-[40px]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    All clients
                  </button>

                  {selectedClient && selectedItineraryId ? (
                    <div className="flex items-center gap-2">
                      {onAddTripForClient && (
                        <button
                          type="button"
                          onClick={() => onAddTripForClient(selectedClient.name)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-secondary/30 bg-secondary/10 text-secondary transition-all duration-200"
                          aria-label={`New trip for ${selectedClient.name}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      )}
                      <div className="flex items-center gap-2" data-tour-target="cip-actions">
                        <button
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 ${showCommentsPanel
                            ? "bg-secondary text-white border-secondary"
                            : "bg-surface-elevated text-text-primary border-border/20"
                            }`}
                          onClick={() => setShowCommentsPanel((v) => !v)}
                          aria-label="Comments"
                        >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                      <button
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border/20 bg-surface-elevated text-text-primary transition-all duration-200"
                        onClick={() => setShowShareDialog(true)}
                        aria-label="Share"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      </button>
                      <button
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full border border-border/20 bg-surface-elevated text-text-primary transition-all duration-200 ${pdfLoading ? "opacity-60" : ""}`}
                        onClick={handleDownloadPdf}
                        disabled={pdfLoading || !fullItinerary}
                        aria-label="Download PDF"
                      >
                        {pdfLoading ? (
                          <span className="inline-block w-4 h-4 border-2 border-border border-t-secondary rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                      </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {selectedClient ? (
                <div className="flex flex-col flex-1 overflow-hidden pt-2">
                  {/* Client name */}
                  <div className="px-4 py-2 border-b border-border/5">
                    <h2 className="font-serif text-[1.2rem] m-0 leading-tight truncate">{selectedClient.name}</h2>
                  </div>

                  {/* Trip selector */}
                  {selectedClient.trips.length > 1 && (
                    <div className="flex gap-2 px-4 py-2 border-b border-border/5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0" data-tour-target="cip-trip-selector">
                      {selectedClient.trips.map((t) => (
                        <button
                          key={t.id}
                          className={`px-3 py-1.5 rounded-md text-[0.75rem] font-bold whitespace-nowrap border transition-all duration-200 ${selectedTripId === t.id
                            ? "bg-secondary text-white border-secondary"
                            : "bg-surface border-border/30 text-text-soft"
                            }`}
                          onClick={() => setSelectedTripId(t.id)}
                        >
                          {t.destination || "Unnamed Trip"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Day strip */}
                  {fullItinerary && safeDays.length > 0 && (
                    <div className="flex gap-2 px-4 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 border-b border-border/5" data-tour-target="cip-day-strip">
                      {safeDays.map((day, dIdx) => (
                        <button
                          key={day.id || day.dayNumber || dIdx}
                          className={`px-3 py-2 rounded-md border cursor-pointer transition-all duration-200 flex-shrink-0 text-left ${selectedDayIndex === dIdx
                            ? "border-secondary/60 bg-secondary/10"
                            : "border-border/30 bg-surface"
                            }`}
                          onClick={() => setSelectedDayIndex(dIdx)}
                        >
                          <div className={`text-[0.7rem] font-extrabold tracking-wide leading-snug ${selectedDayIndex === dIdx ? "text-secondary" : "text-text-soft"}`}>
                            Day {day.dayNumber}
                          </div>
                          <div className="text-[0.65rem] text-text-soft font-semibold truncate max-w-[120px]">{day.title}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Comments panel */}
                  {showCommentsPanel && (
                    <div className="px-4 py-2 flex-shrink-0">
                      <CommentsPanel agencyId={agencyId} tripId={selectedTripId} onClose={() => setShowCommentsPanel(false)} />
                    </div>
                  )}

                  {/* Compact itinerary items */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {isLoadingItinerary ? (
                      <div className="flex items-center justify-center py-10 text-text-soft gap-2">
                        <div className="w-5 h-5 border-2 border-border border-t-secondary rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : selectedDay ? (
                      (selectedDay.items || []).map((item, iIdx) => {
                        return (
                          <CompactPlaceCard
                            key={`${selectedDay.dayNumber}-${iIdx}`}
                            item={item}
                            isSelected={activeStopIndex === iIdx}
                            onSelect={() => {
                              setActiveStopIndex(iIdx);
                              setSelectedPlaceId(item.__placeEntityId);
                            }}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center text-text-soft py-10 text-sm">Select a day to view stops.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-soft text-center p-6">
                  <p>Select a client to view their itineraries.</p>
                </div>
              )}
            </div>
          )}
        </MobileGlassSheet>

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

  // Desktop layout (unchanged)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-2 h-full min-h-0 items-stretch p-2">
      {/* Client sidebar — hidden on mobile when viewing detail */}
      <aside
        data-tour-target="cip-client-directory"
        className={`glass-panel backdrop-blur-lg flex-col overflow-hidden shadow-soft ${mobilePane === "detail" ? "hidden lg:flex" : "flex"}`}
      >
        {/* Pane header */}
        <div className="px-4 py-4 border-b border-border grid gap-2.5">
          <h3 className="font-serif text-[1.6rem] text-text-primary m-0 tracking-tight">Client Directory</h3>
          <div className="relative flex items-center">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none z-[1]"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pr-4 pl-12 rounded-md border border-border/10 bg-white/5 text-[0.95rem] font-[inherit] text-text-primary transition-all duration-200 focus:outline-none focus:border-secondary focus:bg-white/10 focus:shadow-[0_0_0_4px_rgba(215,122,97,0.1)]"
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
                  className={`flex items-center gap-2 p-1 rounded-md transition-all duration-300 relative mb-0.5 ${isSelected
                    ? "bg-secondary/20 shadow-soft border border-secondary/30"
                    : "hover:bg-background border border-transparent"
                    }`}
                >
                  <button
                    className="all-unset flex-1 flex items-center gap-3.5 px-3 py-2.5 cursor-pointer min-w-0 rounded-sm"
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setSelectedTripId(c.trips[0]?.id || null);
                      setMobilePane("detail");
                    }}
                    title={`View ${c.name}'s itineraries`}
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[0.85rem] flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-200 ${isSelected ? "bg-secondary text-white" : "bg-secondary/40 text-white"
                      }`}>
                      {initials}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <strong className={`block text-[0.95rem] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${isSelected ? "text-secondary font-black" : "text-text-primary"
                        }`}>
                        {c.name}
                      </strong>
                      {!isConfirming && (
                        <span className={`text-[0.75rem] font-semibold opacity-70 transition-colors duration-200 ${isSelected ? "text-text-primary" : "text-text-soft"
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
                        className="px-2 py-1.5 rounded-[6px] border border-border bg-surface text-[0.7rem] font-bold text-text-soft cursor-pointer transition-all duration-200 whitespace-nowrap hover:enabled:bg-background"
                        disabled={isDeletingClient}
                        onClick={() => setShowClientDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`border-none w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg transition-all duration-200 flex-shrink-0 mr-1 ${isSelected
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

      {/* Main workspace — hidden on mobile when viewing list */}
      <main
        data-tour-target="cip-workspace"
        className={`glass-panel backdrop-blur-lg flex-col overflow-hidden shadow-soft h-full ${mobilePane === "list" ? "hidden lg:flex" : "flex"}`}
      >
        {selectedClient ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Mobile back button */}
            <button
              type="button"
              onClick={() => setMobilePane("list")}
              className="lg:hidden flex items-center gap-2 px-4 py-3 text-sm font-semibold text-text-muted border-b border-border/10 bg-transparent cursor-pointer hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All clients
            </button>
            {/* Workspace header */}
            <header className="px-4 sm:px-6 py-3 sm:py-4 bg-transparent flex justify-between items-start sm:items-center gap-3 border-b border-border/10 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0">
                <h2 className="font-serif text-[1.4rem] sm:text-[1.8rem] m-0 leading-tight truncate">{selectedClient.name}</h2>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-[0.75rem] font-extrabold uppercase tracking-[0.05em]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                  Saved itineraries
                </div>
                <span className="text-[0.8rem] sm:text-[0.9rem] text-text-soft font-semibold">
                  {selectedClient.trips.length} saved
                </span>
              </div>
              {selectedClient && onAddTripForClient && (
                <button
                  type="button"
                  onClick={() => onAddTripForClient(selectedClient.name)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg border border-secondary/30 bg-secondary/10 text-secondary text-[0.85rem] font-bold cursor-pointer transition-all duration-200 hover:bg-secondary/20 hover:border-secondary/50"
                  title={`Start a new trip for ${selectedClient.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="truncate max-w-[12ch]">New trip for {selectedClient.name}</span>
                </button>
              )}
              <div data-tour-target="cip-actions" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {selectedTrip && <StatusChip trip={selectedTrip} />}
                {selectedItineraryId && (
                  <>
                    {/* Comments — icon-only on mobile, icon+label on sm+ */}
                    <button
                      className={`inline-flex items-center justify-center gap-2 min-w-[40px] min-h-[40px] px-2 sm:px-3.5 rounded-lg border text-[0.85rem] font-bold cursor-pointer transition-all duration-200 ${showCommentsPanel
                        ? "bg-secondary text-white border-secondary shadow-soft"
                        : "bg-surface-elevated text-text-primary border-border/20 hover:bg-surface hover:border-border/40"
                        }`}
                      onClick={() => setShowCommentsPanel((v) => !v)}
                      title="View client comments"
                      aria-label="Comments"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Comments</span>
                      {unreadCommentCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-pill bg-[#dc2626] text-white text-[0.65rem] font-extrabold leading-none flex-shrink-0">
                          {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
                        </span>
                      )}
                    </button>

                    {/* Share */}
                    <button
                      className="inline-flex items-center justify-center gap-2 min-w-[40px] min-h-[40px] px-2 sm:px-3.5 rounded-lg border border-border/20 bg-surface-elevated text-text-primary text-[0.85rem] font-bold cursor-pointer transition-all duration-200 hover:bg-surface hover:border-border/40"
                      onClick={() => setShowShareDialog(true)}
                      aria-label="Share"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      <span className="hidden sm:inline">Share</span>
                    </button>

                    {/* PDF */}
                    <button
                      className={`inline-flex items-center justify-center gap-2 min-w-[40px] min-h-[40px] px-2 sm:px-3.5 rounded-lg border border-border/20 bg-surface-elevated text-text-primary text-[0.85rem] font-bold cursor-pointer transition-all duration-200 hover:bg-surface hover:border-border/40 ${pdfLoading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading || !fullItinerary}
                      title="Download itinerary as PDF"
                      aria-label="Download PDF"
                    >
                      {pdfLoading ? (
                        <span className="inline-block w-[13px] h-[13px] border-2 border-border border-t-secondary rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                      <span className="hidden sm:inline">{pdfLoading ? "Generating..." : "PDF"}</span>
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Trip selector — only shown when client has multiple saved trips */}
              {selectedClient.trips.length > 1 && (
                <div
                  data-tour-target="cip-trip-selector"
                  className="flex gap-2 px-6 py-3 border-b border-border/10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0"
                >
                  {selectedClient.trips.map(t => (
                    <button
                      key={t.id}
                      className={`px-3.5 py-1.5 rounded-md text-[0.8rem] font-bold whitespace-nowrap border transition-all duration-200 relative ${selectedTripId === t.id
                        ? "bg-secondary text-white border-secondary"
                        : "bg-surface border-border/30 text-text-soft hover:text-text-primary hover:border-secondary/40"
                        }`}
                      onClick={() => setSelectedTripId(t.id)}
                    >
                      {t.destination || "Unnamed Trip"}
                      {selectedTripId === t.id && unreadCommentCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-pill bg-[#dc2626] text-white text-[0.6rem] font-extrabold flex items-center justify-center leading-none pointer-events-none">
                          {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Day strip */}
              {fullItinerary && safeDays.length > 0 && (
                <div
                  data-tour-target="cip-day-strip"
                  className="flex gap-3 px-6 py-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 border-b border-border/10"
                >
                  {safeDays.map((day, dIdx) => (
                    <div
                      key={day.id || day.dayNumber || dIdx}
                      className={`min-w-[200px] max-w-[260px] px-4 py-3 rounded-md border cursor-pointer transition-all duration-300 flex-shrink-0 ${selectedDayIndex === dIdx
                        ? "border-secondary/60 bg-secondary/10 shadow-soft"
                        : "border-border/30 bg-surface hover:border-secondary/40 hover:-translate-y-0.5 hover:shadow-soft"
                        }`}
                      onClick={() => setSelectedDayIndex(dIdx)}
                    >
                      <div className={`text-[0.8rem] font-extrabold tracking-wide mb-1 leading-snug ${selectedDayIndex === dIdx ? "text-secondary" : "text-text-soft"}`}>
                        DAY {day.dayNumber}: {day.title}
                      </div>
                      <div className="text-[0.73rem] text-text-soft font-semibold">
                        {formatDayCardDate(day, tripStart)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Itinerary preview area */}
              <div className="flex-1 min-h-0 bg-background border-t border-border flex flex-col overflow-hidden">
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
