"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchPublicItinerary, postPublicComment } from "../../../lib/api.js";
import { generateItineraryPdf, titleToFilename } from "../../../lib/pdfExport.js";
import "./page.css";

const ItineraryLiveMap = dynamic(
  () =>
    import(
      "../../../components/trip-dashboard/itinerary/ItineraryLiveMap.jsx"
    ),
  { ssr: false }
);

/* ── helpers ─────────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(start, end) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString("en-US", opts);
  if (!e) return startStr;
  const endStr = e.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${startStr} – ${endStr}`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function buildGoogleMapsUrl(placeSnapshot) {
  if (!placeSnapshot) return null;
  const { latitude, longitude, provider, providerPlaceId } = placeSnapshot;
  if (latitude == null || longitude == null) return null;

  let url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  if (provider === "GOOGLE_MAPS" && providerPlaceId) {
    url += `&query_place_id=${providerPlaceId}`;
  }
  return url;
}

function itemTypeIcon(type) {
  switch (type?.toUpperCase()) {
    case "FLIGHT":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case "HOTEL":
    case "ACCOMMODATION":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
          <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" />
          <path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
        </svg>
      );
    case "RESTAURANT":
    case "DINING":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
        </svg>
      );
    case "TRANSPORT":
    case "TRANSFER":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
  }
}

/* ── map-pin icon for Google Maps link ──────────────────────── */

function MapPinLink({ placeSnapshot }) {
  const url = buildGoogleMapsUrl(placeSnapshot);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="pv-map-link"
      title="Open in Google Maps"
      aria-label={`Open ${placeSnapshot.name || "location"} in Google Maps`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </a>
  );
}

/* ── chat bubble icon ────────────────────────────────────────── */

function ChatBubbleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ── name prompt banner ──────────────────────────────────────── */

function NamePromptBanner({ onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      inputRef.current?.focus();
      return;
    }
    onComplete(trimmed, email.trim() || null);
  }

  return (
    <div className="pv-name-banner">
      <div className="pv-name-banner-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="pv-name-banner-body">
        <p className="pv-name-banner-text">
          Want to leave comments on this itinerary? Let us know your name first.
        </p>
        <form className="pv-name-banner-form" onSubmit={handleSubmit}>
          <div className="pv-name-banner-fields">
            <div className="pv-name-field-wrap">
              <input
                ref={inputRef}
                type="text"
                className={`pv-name-input${nameError ? " pv-name-input--error" : ""}`}
                placeholder="Your name *"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(false); }}
                maxLength={80}
              />
              {nameError && <span className="pv-name-error">Please enter your name</span>}
            </div>
            <input
              type="email"
              className="pv-name-input pv-name-input--email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="pv-name-btn">Continue</button>
        </form>
      </div>
    </div>
  );
}

/* ── inline comment form ─────────────────────────────────────── */

function CommentForm({ token, dayNumber, itemId, commenterName, commenterEmail, onCancel, onPosted }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setStatus("submitting");

    const payload = { authorName: commenterName, content: trimmed };
    if (commenterEmail) payload.authorEmail = commenterEmail;
    if (dayNumber != null) payload.dayNumber = dayNumber;
    if (itemId != null) payload.itemId = itemId;

    try {
      await postPublicComment(token, payload);
      setStatus("success");
      onPosted({ content: trimmed, dayNumber, itemId, authorName: commenterName });
      setTimeout(() => onCancel(), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="pv-comment-form" onSubmit={handleSubmit}>
      {status === "success" ? (
        <div className="pv-comment-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Comment sent!
        </div>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className="pv-comment-textarea"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1000}
            disabled={status === "submitting"}
          />
          {status === "error" && (
            <p className="pv-comment-error">Something went wrong. Please try again.</p>
          )}
          <div className="pv-comment-actions">
            <button
              type="button"
              className="pv-comment-cancel"
              onClick={onCancel}
              disabled={status === "submitting"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pv-comment-send"
              disabled={!text.trim() || status === "submitting"}
            >
              {status === "submitting" ? "Sending…" : "Send"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

/* ── submitted comment chip ──────────────────────────────────── */

function PendingCommentChip({ comment }) {
  return (
    <div className="pv-pending-comment">
      <div className="pv-pending-comment-header">
        <span className="pv-pending-comment-author">{comment.authorName}</span>
        <span className="pv-pending-badge">Pending</span>
      </div>
      <p className="pv-pending-comment-text">{comment.content}</p>
    </div>
  );
}

/* ── comment trigger button ──────────────────────────────────── */

function CommentTriggerBtn({ label, compact, onClick }) {
  return (
    <button
      type="button"
      className={`pv-comment-trigger${compact ? " pv-comment-trigger--compact" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <ChatBubbleIcon size={12} />
      {!compact && <span>Comment</span>}
    </button>
  );
}

/* ── main page component ────────────────────────────────────── */

export default function PublicItineraryPage() {
  const { token } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  /* mobile tab toggle */
  const [mobileTab, setMobileTab] = useState("itinerary");

  /* map interaction */
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);

  /* commenter identity */
  const [commenterName, setCommenterName] = useState(null);
  const [commenterEmail, setCommenterEmail] = useState(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  /* active comment form: null | { type, dayNumber?, itemId? } */
  const [activeForm, setActiveForm] = useState(null);

  /* session comments */
  const [sessionComments, setSessionComments] = useState([]);

  /* ── load commenter identity from localStorage ── */
  useEffect(() => {
    const storedName = localStorage.getItem("voyage_commenter_name");
    const storedEmail = localStorage.getItem("voyage_commenter_email");
    if (storedName) {
      setCommenterName(storedName);
      setCommenterEmail(storedEmail || null);
    }
  }, []);

  /* ── fetch ── */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchPublicItinerary(token)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          const storedName = localStorage.getItem("voyage_commenter_name");
          if (!storedName) setShowNamePrompt(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.status === 404) {
            setError({ type: "not_found", message: "This itinerary link is not valid." });
          } else if (err.status === 410) {
            setError({ type: "expired", message: "This share link has expired or been revoked." });
          } else {
            setError({ type: "generic", message: "Unable to load itinerary. Please try again later." });
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ── transform items for map ── */
  const mapItems = useMemo(() => {
    if (!data?.itinerary?.days) return [];
    return data.itinerary.days.flatMap((day) =>
      day.items.map((item, idx) => ({
        ...item,
        __dayNumber: day.dayNumber,
        __dayTitle: day.title,
        __itemIndex: idx,
        __placeEntityId: `place-${day.dayNumber}-${idx}`,
      }))
    );
  }, [data]);

  /* ── map callbacks ── */
  const handleHoverItem = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  const handleSelectPlace = useCallback(
    (placeId) => {
      setSelectedPlaceId(placeId || "");
      if (!placeId) {
        setSelectedPlace(null);
        return;
      }
      const item = mapItems.find((i) => i.__placeEntityId === placeId);
      if (item?.placeSnapshot) {
        setSelectedPlace({
          id: placeId,
          lat: Number(item.placeSnapshot.latitude),
          lng: Number(item.placeSnapshot.longitude),
          name: item.placeSnapshot.name,
          formattedAddress: item.placeSnapshot.formattedAddress,
          description: item.description,
          dayLabel: `Day ${item.__dayNumber}`,
          timeLabel:
            item.startTime && item.endTime
              ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
              : item.startTime
                ? formatTime(item.startTime)
                : "",
        });
      }
    },
    [mapItems]
  );

  /* ── name prompt handler ── */
  function handleNameComplete(name, email) {
    localStorage.setItem("voyage_commenter_name", name);
    if (email) localStorage.setItem("voyage_commenter_email", email);
    setCommenterName(name);
    setCommenterEmail(email);
    setShowNamePrompt(false);
  }

  /* ── comment form helpers ── */
  function openForm(descriptor) {
    if (!commenterName) {
      setShowNamePrompt(true);
      return;
    }
    setActiveForm(descriptor);
  }

  function closeForm() {
    setActiveForm(null);
  }

  function handlePosted(comment) {
    setSessionComments((prev) => [...prev, comment]);
  }

  function getItemComments(dayNumber, itemId) {
    return sessionComments.filter(
      (c) => c.dayNumber === dayNumber && c.itemId === itemId
    );
  }

  function getDayComments(dayNumber) {
    return sessionComments.filter(
      (c) => c.dayNumber === dayNumber && c.itemId == null
    );
  }

  function getGeneralComments() {
    return sessionComments.filter(
      (c) => c.dayNumber == null && c.itemId == null
    );
  }

  function isFormActive(descriptor) {
    if (!activeForm) return false;
    return (
      activeForm.type === descriptor.type &&
      activeForm.dayNumber === descriptor.dayNumber &&
      activeForm.itemId === descriptor.itemId
    );
  }

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="pv-loading-screen">
        <div className="pv-loading-spinner" />
        <p className="pv-loading-text">Loading your itinerary...</p>
      </div>
    );
  }

  /* ── error state ── */
  if (error) {
    return (
      <div className="pv-error-screen">
        <div className="pv-error-card">
          <div className="pv-error-icon">
            {error.type === "expired" ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--voyage-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--voyage-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </div>
          <h1 className="pv-error-title">
            {error.type === "not_found" && "Link Not Found"}
            {error.type === "expired" && "Link Expired"}
            {error.type === "generic" && "Something Went Wrong"}
          </h1>
          <p className="pv-error-message">{error.message}</p>
          <p className="pv-error-hint">
            If you believe this is a mistake, please contact your travel agent.
          </p>
        </div>
        <footer className="pv-branding-footer">
          <span className="pv-powered-by">Powered by Voyage</span>
        </footer>
      </div>
    );
  }

  /* ── PDF export ── */
  async function handleDownloadPdf() {
    if (!data || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { trip, itinerary } = data;
      const dateRange = formatDateRange(trip.startDate, trip.endDate);
      const doc = await generateItineraryPdf({
        title:         trip.title || itinerary.title,
        summary:       itinerary.summary,
        dateRange,
        travelerCount: trip.travelerCount,
        days:          itinerary.days,
        agencyName:    "Voyage",
      });
      doc.save(titleToFilename(trip.title || itinerary.title));
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  /* ── success ── */
  const { trip, itinerary } = data;

  return (
    <div className="pv-page">
      {/* ── top branding bar ── */}
      <header className="pv-header">
        <span className="pv-logo">Voyage</span>
        <span className="pv-header-label">Shared Itinerary</span>
      </header>

      {/* ── mobile tab toggle ── */}
      <div className="pv-mobile-tabs">
        <button
          className={`pv-tab-btn ${mobileTab === "itinerary" ? "active" : ""}`}
          onClick={() => setMobileTab("itinerary")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Itinerary
        </button>
        <button
          className={`pv-tab-btn ${mobileTab === "map" ? "active" : ""}`}
          onClick={() => setMobileTab("map")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Map
        </button>
      </div>

      {/* ── main split layout ── */}
      <div className="pv-layout">
        {/* ── left: timeline panel ── */}
        <div
          className={`pv-timeline-panel ${mobileTab === "itinerary" ? "pv-mobile-visible" : "pv-mobile-hidden"}`}
        >
          {/* name prompt banner */}
          {showNamePrompt && (
            <NamePromptBanner onComplete={handleNameComplete} />
          )}

          {/* trip header */}
          <div className="pv-trip-header">
            <h1 className="pv-trip-title">{trip.title || itinerary.title}</h1>
            {trip.destinationSummary && (
              <p className="pv-trip-destination">{trip.destinationSummary}</p>
            )}
            <div className="pv-trip-meta">
              {(trip.startDate || trip.endDate) && (
                <span className="pv-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>
              )}
              {trip.travelerCount > 0 && (
                <span className="pv-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {trip.travelerCount} {trip.travelerCount === 1 ? "traveler" : "travelers"}
                </span>
              )}
            </div>
            <button
              className={`pv-pdf-btn${pdfLoading ? " pv-pdf-btn--loading" : ""}`}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              aria-label="Download itinerary as PDF"
            >
              {pdfLoading ? (
                <>
                  <span className="pv-pdf-spinner" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            {itinerary.summary && (
              <p className="pv-trip-summary">{itinerary.summary}</p>
            )}
          </div>

          {/* days */}
          <div className="pv-days">
            {itinerary.days?.map((day) => (
              <section key={day.id} className="pv-day">
                <div className="pv-day-header">
                  <span className="pv-day-badge">Day {day.dayNumber}</span>
                  <div className="pv-day-header-text">
                    <h2 className="pv-day-title">{day.title}</h2>
                    {day.date && (
                      <span className="pv-day-date">{formatDate(day.date)}</span>
                    )}
                  </div>
                  <CommentTriggerBtn
                    label={`Comment on Day ${day.dayNumber}`}
                    compact
                    onClick={() => openForm({ type: "day", dayNumber: day.dayNumber, itemId: undefined })}
                  />
                </div>

                {/* inline day-level comment form */}
                {isFormActive({ type: "day", dayNumber: day.dayNumber, itemId: undefined }) && (
                  <div className="pv-day-comment-area">
                    <CommentForm
                      token={token}
                      dayNumber={day.dayNumber}
                      itemId={undefined}
                      commenterName={commenterName}
                      commenterEmail={commenterEmail}
                      onCancel={closeForm}
                      onPosted={handlePosted}
                    />
                  </div>
                )}

                {/* pending day-level comments */}
                {getDayComments(day.dayNumber).map((c, i) => (
                  <div key={i} className="pv-day-comment-area">
                    <PendingCommentChip comment={c} />
                  </div>
                ))}

                {day.summary && (
                  <p className="pv-day-summary">{day.summary}</p>
                )}

                <div className="pv-items">
                  {day.items.map((item, idx) => {
                    const globalIdx = mapItems.findIndex(
                      (mi) =>
                        mi.__dayNumber === day.dayNumber &&
                        mi.__itemIndex === idx
                    );
                    const isActive = activeIndex === globalIdx;

                    const itemFormDescriptor = { type: "item", dayNumber: day.dayNumber, itemId: item.id };

                    return (
                      <div
                        key={item.id}
                        className={`pv-item ${isActive ? "pv-item--active" : ""}`}
                        onMouseEnter={() => handleHoverItem(globalIdx)}
                        onMouseLeave={() => handleHoverItem(-1)}
                      >
                        <div className="pv-item-connector">
                          <span className="pv-item-dot" />
                          {idx < day.items.length - 1 && (
                            <span className="pv-item-line" />
                          )}
                        </div>

                        <div className="pv-item-content">
                          <div className="pv-item-header">
                            <div className="pv-item-type-icon">
                              {itemTypeIcon(item.type)}
                            </div>
                            <div className="pv-item-title-block">
                              <h3 className="pv-item-title">{item.title}</h3>
                              {(item.startTime || item.endTime) && (
                                <span className="pv-item-time">
                                  {item.startTime && formatTime(item.startTime)}
                                  {item.startTime && item.endTime && " – "}
                                  {item.endTime && formatTime(item.endTime)}
                                </span>
                              )}
                            </div>
                            <MapPinLink placeSnapshot={item.placeSnapshot} />
                            <CommentTriggerBtn
                              label={`Comment on ${item.title}`}
                              compact
                              onClick={() => openForm(itemFormDescriptor)}
                            />
                          </div>

                          {item.description && (
                            <p className="pv-item-desc">{item.description}</p>
                          )}

                          {item.placeSnapshot?.name && (
                            <div className="pv-item-place">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{item.placeSnapshot.name}</span>
                              {item.placeSnapshot.formattedAddress && (
                                <span className="pv-item-address">
                                  {item.placeSnapshot.formattedAddress}
                                </span>
                              )}
                            </div>
                          )}

                          {item.clientNotes && (
                            <div className="pv-item-notes">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <span>{item.clientNotes}</span>
                            </div>
                          )}

                          {/* inline item comment form */}
                          {isFormActive(itemFormDescriptor) && (
                            <CommentForm
                              token={token}
                              dayNumber={day.dayNumber}
                              itemId={item.id}
                              commenterName={commenterName}
                              commenterEmail={commenterEmail}
                              onCancel={closeForm}
                              onPosted={handlePosted}
                            />
                          )}

                          {/* pending item-level comments */}
                          {getItemComments(day.dayNumber, item.id).map((c, i) => (
                            <PendingCommentChip key={i} comment={c} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* ── general feedback section ── */}
          <div className="pv-general-feedback">
            <div className="pv-general-feedback-header">
              <ChatBubbleIcon size={16} />
              <h3 className="pv-general-feedback-title">General Feedback</h3>
            </div>
            <p className="pv-general-feedback-desc">
              Have overall thoughts about this itinerary? Share them here.
            </p>

            {isFormActive({ type: "general", dayNumber: undefined, itemId: undefined }) ? (
              <CommentForm
                token={token}
                dayNumber={undefined}
                itemId={undefined}
                commenterName={commenterName}
                commenterEmail={commenterEmail}
                onCancel={closeForm}
                onPosted={handlePosted}
              />
            ) : (
              <CommentTriggerBtn
                label="Add general feedback"
                onClick={() => openForm({ type: "general", dayNumber: undefined, itemId: undefined })}
              />
            )}

            {getGeneralComments().map((c, i) => (
              <PendingCommentChip key={i} comment={c} />
            ))}
          </div>

          {/* bottom branding */}
          <footer className="pv-timeline-footer">
            <span className="pv-powered-by">Powered by Voyage</span>
          </footer>
        </div>

        {/* ── right: map panel ── */}
        <div
          className={`pv-map-panel ${mobileTab === "map" ? "pv-mobile-visible" : "pv-mobile-hidden"}`}
        >
          <ItineraryLiveMap
            items={mapItems}
            liveMarkers={[]}
            routeEstimates={[]}
            activeIndex={activeIndex}
            onHoverItem={handleHoverItem}
            selectedPlaceId={selectedPlaceId}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
          />
        </div>
      </div>
    </div>
  );
}
