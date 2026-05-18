/**
 * CommentsPanel — displays and manages client comments for a trip.
 * Extracted from ClientItineraryPage.jsx.
 */

import { useState, useMemo, useEffect } from "react";
import { listTripShares, listShareComments, replyToShareComment } from "../../../lib/api/index.js";
import { formatCommentTime } from "../../../lib/formatters.js";
import { Spinner } from "../../ui/index.js";
import { CloseIcon, ChatIcon, ReplyIcon } from "../../icons/index.js";

export default function CommentsPanel({ agencyId, tripId, onClose }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [replyErrors, setReplyErrors] = useState({});

  useEffect(() => {
    if (!agencyId || !tripId) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setComments([]);

    (async () => {
      try {
        const sharesRes = await listTripShares(agencyId, tripId);
        const shares = Array.isArray(sharesRes?.shares)
          ? sharesRes.shares
          : [];
        if (cancelled) return;

        const commentArrays = await Promise.all(
          shares.map((share) =>
            listShareComments(agencyId, share.id)
              .then((r) =>
                Array.isArray(r?.comments) ? r.comments : [],
              )
              .catch(() => []),
          ),
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

    return () => {
      cancelled = true;
    };
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
    const dayKeys = [...map.keys()]
      .filter((k) => k !== "general")
      .sort((a, b) => Number(a) - Number(b));
    const ordered = [];
    dayKeys.forEach((k) => {
      if (map.get(k).length > 0)
        ordered.push({
          key: k,
          label: `Day ${k}`,
          comments: map.get(k),
        });
    });
    if (map.get("general").length > 0) {
      ordered.push({
        key: "general",
        label: "General",
        comments: map.get("general"),
      });
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
                agencyRepliedAt:
                  updated?.agencyRepliedAt ?? new Date().toISOString(),
                status: "ADDRESSED",
              }
            : c,
        ),
      );
      setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
      setReplyingTo(null);
    } catch (err) {
      setReplyErrors((prev) => ({
        ...prev,
        [commentId]: "Failed to send reply. Please try again.",
      }));
    } finally {
      setSubmitting(null);
    }
  };

  const totalCount = comments.length;

  function getStatusClasses(status) {
    if (status === "ADDRESSED")
      return "bg-[#f0fdf4] text-[#166534] border border-[#dcfce7]";
    if (status === "SEEN")
      return "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]";
    return "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]";
  }

  function getStatusLabel(status) {
    if (status === "ADDRESSED") return "Addressed";
    if (status === "SEEN") return "Seen";
    return "Pending";
  }

  return (
    <div className="flex flex-col border border-border rounded-md bg-surface overflow-hidden flex-shrink-0 max-h-[480px]">
      {/* Header */}
      <div
        className={
          "flex items-center justify-between px-[18px] py-3.5 " +
          "border-b border-border bg-surface-elevated flex-shrink-0"
        }
      >
        <div className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
          <ChatIcon width={16} height={16} />
          <span>Client Comments</span>
          {totalCount > 0 && (
            <span
              className={
                "inline-flex items-center justify-center min-w-[20px] h-5 " +
                "px-1.5 rounded-pill bg-secondary text-white text-[0.7rem] font-extrabold"
              }
            >
              {totalCount}
            </span>
          )}
        </div>
        <button
          className={
            "w-7 h-7 rounded-lg border-none bg-transparent text-text-soft " +
            "cursor-pointer flex items-center justify-center transition-all duration-150 " +
            "hover:bg-border/[0.08] hover:text-text-primary flex-shrink-0"
          }
          onClick={onClose}
          aria-label="Close comments"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {isLoading && (
          <div className="flex items-center gap-2.5 p-5 text-text-soft text-[0.9rem]">
            <Spinner size="sm" />
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
            <ChatIcon width={32} height={32} strokeWidth={1.5} />
            <p className="text-[0.9rem] m-0 leading-relaxed">
              No comments yet from this client.
            </p>
          </div>
        )}
        {!isLoading &&
          !loadError &&
          grouped.map(({ key, label, comments: groupComments }) => (
            <div key={key} className="flex flex-col gap-3">
              {/* Group label */}
              <div
                className={
                  "text-[0.75rem] font-extrabold uppercase " +
                  "tracking-[0.06em] text-text-soft pb-1.5 border-b border-border"
                }
              >
                {label}
              </div>
              {groupComments.map((comment) => (
                <div
                  key={comment.id}
                  className={
                    "border border-border rounded-sm bg-surface-elevated " +
                    "px-4 py-3.5 flex flex-col gap-2.5 transition-shadow " +
                    "duration-200 hover:shadow-soft"
                  }
                >
                  <div className="flex flex-col gap-2">
                    {/* Author row */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={
                          "w-8 h-8 rounded-full bg-secondary text-white " +
                          "flex items-center justify-center text-[0.75rem] " +
                          "font-extrabold flex-shrink-0 shadow-sm"
                        }
                      >
                        {String(comment.authorName || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-px flex-1 min-w-0">
                        <span
                          className={
                            "text-[0.85rem] font-bold text-text-primary " +
                            "whitespace-nowrap overflow-hidden text-ellipsis"
                          }
                        >
                          {comment.authorName || "Client"}
                        </span>
                        <span className="text-[0.73rem] text-text-soft">
                          {formatCommentTime(comment.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-[3px] rounded-[6px] text-[0.65rem] font-extrabold tracking-[0.04em] uppercase flex-shrink-0 ${getStatusClasses(comment.status)}`}
                      >
                        {getStatusLabel(comment.status)}
                      </span>
                    </div>
                    <p className="text-[0.88rem] text-text-primary leading-[1.55] m-0">
                      {comment.content}
                    </p>
                  </div>

                  {comment.agencyReply && (
                    <div
                      className={
                        "bg-background rounded-[10px] px-3.5 py-2.5 " +
                        "flex flex-col gap-1 border-l-[3px] border-secondary"
                      }
                    >
                      <div
                        className={
                          "flex items-center gap-[5px] text-[0.72rem] " +
                          "font-extrabold uppercase tracking-[0.04em] text-secondary"
                        }
                      >
                        <ReplyIcon width={12} height={12} />
                        Your reply
                      </div>
                      <p className="text-[0.85rem] text-text-primary leading-[1.5] m-0">
                        {comment.agencyReply}
                      </p>
                      {comment.agencyRepliedAt && (
                        <span className="text-[0.72rem] text-text-soft mt-0.5">
                          {formatCommentTime(comment.agencyRepliedAt)}
                        </span>
                      )}
                    </div>
                  )}

                  {!comment.agencyReply && (
                    <div className="flex flex-col">
                      {replyingTo !== comment.id ? (
                        <button
                          className={
                            "inline-flex items-center gap-[5px] px-2.5 py-[5px] " +
                            "rounded-lg border border-border bg-white text-text-soft " +
                            "text-[0.78rem] font-bold cursor-pointer transition-all " +
                            "duration-150 self-start hover:bg-background " +
                            "hover:text-text-primary hover:border-primary"
                          }
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          <ReplyIcon width={12} height={12} />
                          Reply
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className={
                              "w-full px-3 py-2.5 rounded-[10px] border border-border " +
                              "bg-background text-[0.85rem] font-[inherit] text-text-primary " +
                              "resize-none leading-relaxed transition-all duration-200 box-border " +
                              "focus:outline-none focus:border-secondary focus:bg-surface " +
                              "focus:shadow-[0_0_0_3px_rgba(215,122,97,0.1)]"
                            }
                            placeholder="Write a reply..."
                            value={replyTexts[comment.id] || ""}
                            onChange={(e) =>
                              handleReplyChange(comment.id, e.target.value)
                            }
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.ctrlKey || e.metaKey)
                              ) {
                                e.preventDefault();
                                handleReplySubmit(comment.id);
                              }
                            }}
                          />
                          {replyErrors[comment.id] && (
                            <span className="text-[0.78rem] text-[#dc2626] font-semibold">
                              {replyErrors[comment.id]}
                            </span>
                          )}
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              className={
                                "px-3 py-1.5 rounded-lg border border-border bg-surface " +
                                "text-text-soft text-[0.8rem] font-bold cursor-pointer " +
                                "transition-all duration-150 hover:bg-background hover:text-text-primary"
                              }
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyErrors((p) => ({
                                  ...p,
                                  [comment.id]: null,
                                }));
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className={
                                "px-4 py-1.5 rounded-lg border-none bg-secondary text-white " +
                                "text-[0.8rem] font-bold cursor-pointer transition-all duration-150 " +
                                "hover:enabled:bg-[#c4674e] disabled:opacity-45 disabled:cursor-not-allowed"
                              }
                              disabled={
                                submitting === comment.id ||
                                !(replyTexts[comment.id] || "").trim()
                              }
                              onClick={() => handleReplySubmit(comment.id)}
                            >
                              {submitting === comment.id
                                ? "Sending..."
                                : "Send Reply"}
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
