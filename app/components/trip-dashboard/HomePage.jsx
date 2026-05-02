import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAgentRunStream } from "../../hooks/useAgentRunStream.js";
import {
  createAgentThread,
  fetchAgentThread,
  fetchItineraryDraft,
  listAgentThreads,
  sendMessage,
} from "../../lib/api.js";
import { initialAgencyPortfolioTrips } from "../../data/prototype/agency-portfolio.js";
import {
  getAgencyPortfolioSummary,
  getAgentCommandInsights,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import AgencyMetricStrip from "./AgencyMetricStrip.jsx";
import AgentPriorityQueue from "./AgentPriorityQueue.jsx";
import ApprovalQueuePanel from "./ApprovalQueuePanel.jsx";
import ClientTripPortfolio from "./ClientTripPortfolio.jsx";
import UrgentDeparturesPanel from "./UrgentDeparturesPanel.jsx";

function toUiRole(role) {
  if (role === "USER") return "user";
  if (role === "ASSISTANT") return "assistant";
  return "system";
}

function normalizeItineraryResponse(responseData) {
  return responseData?.itinerary ?? responseData ?? null;
}

export default function HomePage({ user: userProp, agencyTrips = initialAgencyPortfolioTrips, onContinue, onOpenTrip }) {
  const [user, setUser] = useState(userProp || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [composerInput, setComposerInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [agentError, setAgentError] = useState("");
  const [expandedMessageIds, setExpandedMessageIds] = useState({});
  const dropdownRef = useRef(null);
  const agencyId = user?.memberships?.[0]?.agencyId ?? null;
  const hasLoadedInitialThreadRef = useRef(false);

  const {
    isStreaming,
    runStatus,
    assistantMessage,
    toolCalls,
    lastItineraryUpdate,
    error: streamError,
    startStream,
  } = useAgentRunStream(agencyId ?? "");

  useEffect(() => {
    if (userProp) setUser(userProp);
  }, [userProp]);

  useEffect(() => {
    if (user) return;
    const stored = localStorage.getItem("voyage-user");
    if (!stored) return;
    try {
      setUser(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to parse user", error);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!agencyId || hasLoadedInitialThreadRef.current) return;
    hasLoadedInitialThreadRef.current = true;

    (async () => {
      try {
        const threadsResult = await listAgentThreads(agencyId);
        const latestThread = Array.isArray(threadsResult?.threads) ? threadsResult.threads[0] : null;
        if (!latestThread) return;

        const detailResult = await fetchAgentThread(agencyId, latestThread.id);
        const thread = detailResult?.thread;
        if (!thread) return;

        setThreadId(thread.id);
        const normalizedMessages = Array.isArray(thread.messages)
          ? thread.messages
              .filter((message) => message?.role === "USER" || message?.role === "ASSISTANT")
              .map((message) => ({
                id: message.id,
                role: toUiRole(message.role),
                content: message.content,
              }))
          : [];
        setMessages(normalizedMessages);

        const itineraryUpdateEvent = Array.isArray(thread.events)
          ? [...thread.events]
              .reverse()
              .find((event) => event?.type === "itinerary.updated" && event?.payload?.itineraryId)
          : null;
        const itineraryId = itineraryUpdateEvent?.payload?.itineraryId ?? null;
        if (itineraryId) {
          const itineraryResult = await fetchItineraryDraft(agencyId, itineraryId);
          setItinerary(normalizeItineraryResponse(itineraryResult));
        }
      } catch (error) {
        console.error("Failed to load latest agent thread", error);
      }
    })();
  }, [agencyId]);

  useEffect(() => {
    if (runStatus !== "completed" || !assistantMessage) return;

    setMessages((previous) => {
      const alreadyPresent = previous.some(
        (message) => message.role === "assistant" && message.content.trim() === assistantMessage.trim(),
      );
      if (alreadyPresent) return previous;
      return [...previous, { id: `assistant-${Date.now()}`, role: "assistant", content: assistantMessage }];
    });
  }, [runStatus, assistantMessage]);

  useEffect(() => {
    if (!agencyId || !lastItineraryUpdate) return;
    fetchItineraryDraft(agencyId, lastItineraryUpdate)
      .then((result) => setItinerary(normalizeItineraryResponse(result)))
      .catch((error) => console.error("Failed to fetch itinerary draft", error));
  }, [agencyId, lastItineraryUpdate]);

  useEffect(() => {
    if (streamError) {
      setAgentError(streamError);
    }
  }, [streamError]);

  const summary = getAgencyPortfolioSummary(agencyTrips);
  const insights = getAgentCommandInsights(agencyTrips);
  const priorityQueue = getAgentPriorityQueue(agencyTrips);
  const urgentDepartures = getUrgentDepartures(agencyTrips);
  const approvalBlockers = getApprovalBlockers(agencyTrips);

  const displayedMessages = useMemo(() => {
    if (messages.length === 0) {
      return [
        {
          id: "welcome",
          role: "assistant",
          content: "Start a request to generate a live itinerary draft from the Voyage Agent backend.",
        },
      ];
    }

    return messages.slice(-6);
  }, [messages]);

  const hasStreamingBubble =
    isStreaming &&
    typeof assistantMessage === "string" &&
    assistantMessage.trim().length > 0 &&
    displayedMessages[displayedMessages.length - 1]?.content !== assistantMessage;

  const activeToolCalls = useMemo(() => {
    const recent = Array.isArray(toolCalls) ? [...toolCalls].slice(-6).reverse() : [];
    const uniqueNames = [];

    for (const call of recent) {
      if (!call?.name || uniqueNames.includes(call.name)) continue;
      uniqueNames.push(call.name);
      if (uniqueNames.length >= 3) break;
    }

    return uniqueNames;
  }, [toolCalls]);

  const draftDays = Array.isArray(itinerary?.days) ? itinerary.days.slice(0, 3) : [];
  const tripTitle = itinerary?.title || "No active draft yet";
  const draftVersion = itinerary?.version ? `Draft v${itinerary.version}` : "No draft";
  const travelers = itinerary?.trip?.travelerCount;
  const budget = itinerary?.trip?.budgetLevel;
  const messageClampLength = 180;

  function toggleMessageExpansion(messageId) {
    setExpandedMessageIds((previous) => ({
      ...previous,
      [messageId]: !previous[messageId],
    }));
  }

  function getMessageContent(message) {
    const rawContent = String(message?.content ?? "").trim();
    const isExpanded = Boolean(expandedMessageIds[message.id]);
    const isLong = rawContent.length > messageClampLength;
    const preview = isLong && !isExpanded ? `${rawContent.slice(0, messageClampLength).trimEnd()}...` : rawContent;

    return {
      preview,
      isLong,
      isExpanded,
    };
  }

  async function dispatchAgentMessage(rawPrompt) {
    if (!agencyId) {
      setAgentError("Missing agency context. Refresh and log in again.");
      return;
    }

    const content = rawPrompt.trim();
    if (!content || isSending) return;

    setAgentError("");
    setIsSending(true);
    setComposerInput("");
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: "user", content }]);

    try {
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const threadResult = await createAgentThread(agencyId);
        currentThreadId = threadResult?.thread?.id ?? null;
        if (!currentThreadId) {
          throw new Error("Failed to create agent thread.");
        }
        setThreadId(currentThreadId);
      }

      const sendResult = await sendMessage(agencyId, currentThreadId, content);
      const runId = sendResult?.runId || sendResult?.run?.id;
      if (runId) {
        startStream(runId);
      }
    } catch (error) {
      console.error("Failed to send agent message", error);
      setAgentError(error?.message || "Unable to send your request to Voyage Agent.");
    } finally {
      setIsSending(false);
    }
  }

  function submitComposer(event) {
    event.preventDefault();
    void dispatchAgentMessage(composerInput);
  }

  return (
    <div id="home" className="trip-dashboard-shell agency-dashboard-shell">
      <header className="landing-header trip-dashboard-header agency-dashboard-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <div className="agency-header-profile-wrap" ref={dropdownRef}>
          <div className="agency-header-context">
            <span>{user?.displayName || "Guest"}</span>
            <strong>{user?.role === "ADMIN" ? "Platform Admin" : "Agency Operator"}</strong>
          </div>
          <button className="agency-avatar" onClick={() => setShowDropdown(!showDropdown)} aria-expanded={showDropdown}>
            {user?.displayName?.charAt(0) || "U"}
          </button>

          {showDropdown && (
            <div className="agency-profile-dropdown">
              <div className="dropdown-user-info">
                <strong>{user?.displayName}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-menu">
                <button className="dropdown-item">Profile Settings</button>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    localStorage.removeItem("voyage-user");
                    window.location.href = "/login";
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="agentic-surface frame-panel">
        <div className="agentic-chat-panel">
          <div className="agentic-panel-head">
            <span className="frame-label">Agent Command Center</span>
            <h1>Plan with Voyage Agent</h1>
            <p className="lede">Live thread, live tools, and live itinerary generation from your agent backend.</p>
          </div>

          <div className="agentic-chat-log">
            {displayedMessages.map((message) => {
              const contentState = getMessageContent(message);
              return (
                <article key={message.id} className={`agentic-bubble ${message.role}`}>
                  <p title={message.content}>{contentState.preview}</p>
                  {contentState.isLong ? (
                    <button
                      className="agentic-expand-toggle"
                      onClick={() => toggleMessageExpansion(message.id)}
                      type="button"
                    >
                      {contentState.isExpanded ? "Show less" : "Show more"}
                    </button>
                  ) : null}
                </article>
              );
            })}
            {hasStreamingBubble ? <article className="agentic-bubble assistant streaming">{assistantMessage}</article> : null}
          </div>

          <div className="agentic-tool-row" aria-label="Active tool calls">
            {activeToolCalls.length > 0 ? (
              activeToolCalls.map((name) => <span key={name}>{name}</span>)
            ) : (
              <span>No tool calls yet</span>
            )}
            <strong>{isStreaming ? "Agent thinking" : "Agent ready"}</strong>
          </div>

          <form className="agentic-composer" onSubmit={submitComposer}>
            <input
              type="text"
              value={composerInput}
              onChange={(event) => setComposerInput(event.target.value)}
              placeholder="Ask Voyage Agent to create or revise an itinerary..."
              aria-label="Agent prompt input"
            />
            <button className="button button-primary" disabled={isSending || !composerInput.trim()} type="submit">
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>

          {agentError ? <p className="agentic-error">{agentError}</p> : null}

          <div className="agentic-quick-actions">
            <button
              className="button button-secondary"
              onClick={() => void dispatchAgentMessage("Regenerate the current itinerary with stronger pacing and less transit time.")}
              type="button"
            >
              Regenerate Plan
            </button>
            <button
              className="button button-secondary"
              onClick={() => void dispatchAgentMessage("Optimize the route order by travel time and cluster nearby places.")}
              type="button"
            >
              Optimize Route
            </button>
            <button className="button button-secondary" onClick={onContinue} type="button">
              Run Agency Review
            </button>
          </div>
        </div>

        <aside className="agentic-draft-panel">
          <div className="agentic-draft-head">
            <div>
              <span className="frame-label">Live Itinerary</span>
              <h2>{tripTitle}</h2>
            </div>
            <span className="agentic-draft-version">{draftVersion}</span>
          </div>

          <div className="agentic-draft-actions">
            <button className="button button-primary" onClick={onContinue} type="button">
              Approve Draft
            </button>
            <button
              className="button button-secondary"
              onClick={() => void dispatchAgentMessage("Regenerate this itinerary draft and keep budget constraints.")}
              type="button"
            >
              Regenerate
            </button>
          </div>

          <div className="agentic-constraints">
            {budget ? <span>Budget: {budget}</span> : null}
            {travelers ? <span>Travelers: {travelers}</span> : null}
            {itinerary?.status ? <span>Status: {itinerary.status}</span> : null}
            {Array.isArray(itinerary?.days) ? <span>Days: {itinerary.days.length}</span> : null}
          </div>

          <div className="agentic-day-list">
            {draftDays.length > 0 ? (
              draftDays.map((day) => (
                <article key={day.dayNumber} className="agentic-day-card">
                  <header>
                    <strong>Day {day.dayNumber}</strong>
                    <span>{day.title || "Planned Day"}</span>
                  </header>
                  <ul>
                    {(Array.isArray(day.items) ? day.items : []).slice(0, 3).map((item, index) => (
                      <li key={`${day.dayNumber}-${index}`}>{item.title}</li>
                    ))}
                  </ul>
                </article>
              ))
            ) : (
              <article className="agentic-day-card empty">
                <p>No itinerary draft yet. Send a request in chat to generate one with the backend agent.</p>
              </article>
            )}
          </div>

          <div className="agentic-map-thumb">
            <strong>Route Preview</strong>
            <p>{insights.join(" • ")}</p>
          </div>

          <div className="agentic-open-link">
            <Link href={agencyId ? `/agency/${agencyId}/agent` : "#"}>Open full Agent workspace</Link>
          </div>
        </aside>
      </section>

      <AgencyMetricStrip summary={summary} />

      <div className="agency-dashboard-grid">
        <AgentPriorityQueue trips={priorityQueue} />
        <div className="agency-dashboard-side-stack">
          <UrgentDeparturesPanel trips={urgentDepartures} />
          <ApprovalQueuePanel trips={approvalBlockers} />
        </div>
      </div>

      <ClientTripPortfolio trips={agencyTrips} onOpenTrip={onOpenTrip} />

      <style jsx>{`
        .agentic-surface {
          display: grid;
          grid-template-columns: minmax(0, 1.22fr) minmax(350px, 0.78fr);
          gap: 12px;
          padding: 12px;
          background:
            radial-gradient(circle at top right, rgba(34, 56, 67, 0.08), transparent 46%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 238, 233, 0.88));
          min-height: 920px;
        }

        .agentic-chat-panel,
        .agentic-draft-panel {
          border: 1px solid var(--voyage-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: var(--voyage-shadow-soft);
        }

        .agentic-chat-panel {
          padding: 16px;
          display: grid;
          gap: 10px;
          grid-template-rows: auto minmax(0, 1fr) auto auto auto;
          min-height: 880px;
        }

        .agentic-panel-head h1 {
          font-size: clamp(2.1rem, 3.35vw, 3rem);
          line-height: 0.98;
          margin: 0 0 8px;
          max-width: 9ch;
        }

        .agentic-panel-head .lede {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .agentic-chat-log {
          display: grid;
          gap: 8px;
          max-height: 520px;
          overflow: auto;
          padding-right: 2px;
          align-content: start;
        }

        .agentic-bubble {
          padding: 10px 12px;
          border-radius: 12px;
          max-width: 86%;
          font-size: 0.85rem;
          line-height: 1.35;
          border: 1px solid transparent;
        }

        .agentic-bubble p {
          margin: 0;
          color: inherit;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .agentic-bubble.user {
          justify-self: end;
          background: rgba(34, 56, 67, 0.92);
          color: #fff;
        }

        .agentic-bubble.user .agentic-expand-toggle {
          color: rgba(255, 255, 255, 0.86);
        }

        .agentic-bubble.assistant {
          justify-self: start;
          background: rgba(215, 122, 97, 0.08);
          border-color: rgba(215, 122, 97, 0.2);
          color: var(--voyage-primary);
        }

        .agentic-bubble.system {
          justify-self: start;
          background: rgba(34, 56, 67, 0.06);
          color: var(--voyage-text-muted);
        }

        .agentic-bubble.streaming {
          position: relative;
          overflow: hidden;
        }

        .agentic-expand-toggle {
          margin-top: 8px;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--voyage-secondary);
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .agentic-bubble.streaming::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.65) 45%, transparent 100%);
          transform: translateX(-100%);
          animation: shimmer 1.8s infinite;
        }

        .agentic-tool-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .agentic-tool-row span,
        .agentic-tool-row strong {
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 700;
          border: 1px solid rgba(34, 56, 67, 0.14);
          letter-spacing: 0.02em;
        }

        .agentic-tool-row strong {
          background: rgba(32, 178, 170, 0.14);
          border-color: rgba(32, 178, 170, 0.26);
          color: #1d6e68;
        }

        .agentic-composer {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
        }

        .agentic-composer input {
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(34, 56, 67, 0.16);
          padding: 0 14px;
          color: var(--voyage-text);
          background: rgba(255, 255, 255, 0.96);
          font-size: 0.84rem;
        }

        .agentic-error {
          margin: 0;
          color: #b42318;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .agentic-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .agentic-quick-actions .button {
          min-height: 34px;
          padding: 7px 12px;
          font-size: 0.72rem;
        }

        .agentic-draft-panel {
          padding: 14px;
          display: grid;
          gap: 10px;
          align-content: start;
          grid-template-rows: auto auto auto auto auto auto;
          min-height: 880px;
        }

        .agentic-draft-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .agentic-draft-head h2 {
          font-size: 2rem;
          line-height: 1.2;
          margin-top: -8px;
          max-width: 12ch;
        }

        .agentic-draft-version {
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--voyage-secondary);
          border: 1px solid rgba(215, 122, 97, 0.24);
          background: rgba(215, 122, 97, 0.09);
        }

        .agentic-draft-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .agentic-draft-actions .button {
          min-height: 42px;
          padding: 8px;
          font-size: 0.78rem;
        }

        .agentic-constraints {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .agentic-constraints span {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--voyage-primary);
          background: rgba(34, 56, 67, 0.08);
          border: 1px solid rgba(34, 56, 67, 0.12);
          border-radius: 999px;
          padding: 6px 9px;
        }

        .agentic-day-list {
          display: grid;
          gap: 6px;
          align-content: start;
        }

        .agentic-day-card {
          border: 1px solid rgba(34, 56, 67, 0.14);
          border-radius: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.95);
          min-height: 58px;
        }

        .agentic-day-card.empty p {
          margin: 0;
          color: var(--voyage-text-muted);
          font-size: 0.84rem;
        }

        .agentic-day-card header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          align-items: center;
        }

        .agentic-day-card header strong {
          font-size: 0.9rem;
          color: var(--voyage-primary);
        }

        .agentic-day-card header span {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--voyage-text-soft);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .agentic-day-card ul {
          margin: 0;
          padding-left: 16px;
          display: grid;
          gap: 4px;
        }

        .agentic-day-card li {
          color: var(--voyage-text-muted);
          font-size: 0.76rem;
        }

        .agentic-map-thumb {
          border-radius: 10px;
          border: 1px solid rgba(34, 56, 67, 0.14);
          padding: 10px;
          background:
            linear-gradient(145deg, rgba(216, 180, 160, 0.3), rgba(255, 255, 255, 0.9)),
            radial-gradient(circle at 20% 20%, rgba(32, 178, 170, 0.2), transparent 40%);
        }

        .agentic-map-thumb strong {
          display: block;
          margin-bottom: 4px;
          color: var(--voyage-primary);
        }

        .agentic-map-thumb p {
          margin: 0;
          color: var(--voyage-text-muted);
          font-size: 0.76rem;
          line-height: 1.35;
        }

        .agentic-open-link a {
          color: var(--voyage-secondary);
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 800;
        }

        .agentic-open-link a:hover {
          text-decoration: underline;
        }

        @keyframes shimmer {
          to {
            transform: translateX(100%);
          }
        }

        @media (max-width: 1100px) {
          .agentic-surface {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .agentic-chat-panel,
          .agentic-draft-panel {
            min-height: auto;
          }
        }

        @media (max-width: 768px) {
          .agentic-composer {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
