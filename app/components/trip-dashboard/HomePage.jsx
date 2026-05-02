import { useEffect, useMemo, useRef, useState } from "react";
import { useAgentRunStream } from "../../hooks/useAgentRunStream.js";
import {
  createAgentThread,
  fetchAgentThread,
  fetchItineraryDraft,
  listAgentThreads,
  sendMessage,
} from "../../lib/api.js";
import {
  getAgencyPortfolioSummary,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import AgentPriorityQueue from "./AgentPriorityQueue.jsx";
import ApprovalQueuePanel from "./ApprovalQueuePanel.jsx";
import ClientTripPortfolio from "./ClientTripPortfolio.jsx";
import UrgentDeparturesPanel from "./UrgentDeparturesPanel.jsx";
import AgentCommandCenter from "./AgentCommandCenter.jsx";
import ItineraryDraftPanel from "./ItineraryDraftPanel.jsx";

function toUiRole(role) {
  if (role === "USER") return "user";
  if (role === "ASSISTANT") return "assistant";
  return "system";
}

function normalizeItineraryResponse(responseData) {
  return responseData?.itinerary ?? responseData ?? null;
}

function getInitials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "VP";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRunStatusLabel(runStatus, streamError) {
  if (streamError) {
    return "Needs attention";
  }

  if (runStatus === "completed") {
    return "Idle";
  }

  if (runStatus === "in_progress" || runStatus === "running") {
    return "Agent streaming";
  }

  return "Ready";
}

export default function HomePage({ user: userProp, agencyTrips = [], onContinue, onOpenTrip }) {
  const [user, setUser] = useState(userProp || null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [composerInput, setComposerInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [agentError, setAgentError] = useState("");
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

  const safeTrips = Array.isArray(agencyTrips) ? agencyTrips : [];
  const summary = getAgencyPortfolioSummary(safeTrips);
  const priorityQueue = getAgentPriorityQueue(safeTrips);
  const urgentDepartures = getUrgentDepartures(safeTrips);
  const approvalBlockers = getApprovalBlockers(safeTrips);
  const displayName = user?.displayName || "Traveler";
  const draftVersion = itinerary?.version ? `Draft v${itinerary.version}` : "Draft unavailable";
  const tripSummary = itinerary?.trip ?? null;
  const liveStatus = getRunStatusLabel(runStatus, streamError);

  const footerMetrics = useMemo(
    () => [
      `${summary.activeTrips} active trips`,
      `${summary.awaitingApproval} approvals pending`,
      `${summary.departuresIn30Days} departures in 30 days`,
    ],
    [summary.activeTrips, summary.awaitingApproval, summary.departuresIn30Days],
  );

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
        if (!currentThreadId) throw new Error("Failed to create agent thread.");
        setThreadId(currentThreadId);
      }

      const sendResult = await sendMessage(agencyId, currentThreadId, content);
      const runId = sendResult?.runId || sendResult?.run?.id;
      if (runId) startStream(runId);
    } catch (error) {
      console.error("Failed to send agent message", error);
      setAgentError(error?.message || "Unable to send your request to Voyage Agent.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="voyage-dashboard-layout">
      <header className="voyage-header">
        <div className="brand-logo">
          <span className="brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.2 6.3 6.8 1-4.9 4.8 1.2 6.8L12 17.7 5.7 21l1.2-6.8L2 9.3l6.8-1L12 2z" />
            </svg>
          </span>
          <div>
            <div className="brand-name">VOYAGE</div>
            <div className="brand-subtitle">Agency trip workspace</div>
          </div>
        </div>

        <div className="header-actions">
          <div className={`run-status ${streamError ? "danger" : isStreaming ? "streaming" : "idle"}`}>
            <span className="status-dot" />
            {liveStatus}
          </div>
          <div className="user-profile">
            <div className="user-avatar" aria-hidden="true">
              {getInitials(displayName)}
            </div>
            <div className="user-info">
              <strong>{displayName}</strong>
              <span>{agencyId ? "Agency workspace" : "No agency selected"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="voyage-body">
        <aside className="voyage-sidebar" aria-label="Dashboard navigation">
          <nav className="sidebar-nav">
            <button type="button" className="nav-item active">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span>Command Center</span>
            </button>
            <button type="button" className="nav-item">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span>Itineraries</span>
            </button>
            <button type="button" className="nav-item">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span>Clients</span>
            </button>
            <button type="button" className="nav-item">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <span>Suppliers</span>
            </button>
            <button type="button" className="nav-item">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span>Bookings</span>
            </button>
            <button type="button" className="nav-item">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </span>
              <span>Reports</span>
            </button>
            <button type="button" className="nav-item nav-item-bottom">
              <span className="icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <main className="voyage-main-content">
          <section className="hero-stack">
            <div className="agentic-surface">
              <AgentCommandCenter
                messages={messages}
                isStreaming={isStreaming}
                assistantMessage={assistantMessage}
                toolCalls={toolCalls}
                dispatchAgentMessage={dispatchAgentMessage}
                composerInput={composerInput}
                setComposerInput={setComposerInput}
                isSending={isSending}
                agentError={agentError}
                user={user}
              />
              <ItineraryDraftPanel
                draftDays={Array.isArray(itinerary?.days) ? itinerary.days.slice(0, 3) : []}
                draftVersion={draftVersion}
                tripSummary={tripSummary}
                onContinue={onContinue}
                dispatchAgentMessage={dispatchAgentMessage}
              />
            </div>
          </section>


          {/* <footer className="dashboard-footer">
            <div className="status">
              <span className={`status-dot ${streamError ? "status-error" : isStreaming ? "status-live" : ""}`} />
              {liveStatus}
            </div>
            <div className="right-footer">
              {footerMetrics.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </footer> */}
        </main>
      </div>

      <style jsx>{`
        .voyage-dashboard-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #eceff3;
          color: #111827;
          font-family: "Inter", sans-serif;
        }

        .voyage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 84px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 28px;
          flex-shrink: 0;
          z-index: 10;
          backdrop-filter: blur(8px);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #154449;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(17, 52, 55, 0.16);
        }

        .brand-name {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.24em;
        }

        .brand-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .run-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          background: #f8fafc;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .run-status.streaming {
          background: #ecfdf5;
          color: #047857;
          border-color: #bbf7d0;
        }

        .run-status.danger {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: currentColor;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 12px;
          border-left: 1px solid #e5e7eb;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #b65d48, #d77a61);
          color: white;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-info strong {
          font-size: 14px;
          color: #111827;
        }

        .user-info span {
          font-size: 12px;
          color: #6b7280;
        }

        .voyage-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .voyage-sidebar {
          width: 90px;
          background: linear-gradient(180deg, #0f3a3f 0%, #0c3135 100%);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 18px 0;
          flex: 1;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 18px 4px;
          color: rgba(219, 234, 236, 0.78);
          text-decoration: none;
          gap: 10px;
          text-align: center;
          background: transparent;
          border: none;
          cursor: pointer;
          font: inherit;
        }

        .nav-item .icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nav-item span:last-child {
          font-size: 11px;
          font-weight: 600;
          line-height: 1.2;
        }

        .nav-item.active {
          color: white;
          background: rgba(255, 255, 255, 0.08);
          border-left: 3px solid #d77a61;
        }

        .nav-item:hover:not(.active) {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-item-bottom {
          margin-top: auto;
        }

        .voyage-main-content {
          flex: 1;
          overflow: hidden;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hero-stack {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .agentic-surface {
          display: grid;
          grid-template-columns: minmax(420px, 0.86fr) minmax(0, 1.14fr);
          gap: 20px;
          flex: 1;
          min-height: 0;
        }

        .bottom-queues {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 6px 2px 0;
          font-size: 12px;
          color: #6b7280;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .status-dot.status-live {
          background: #10b981;
        }

        .status-dot.status-error {
          background: #dc2626;
        }

        .right-footer {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 18px;
        }

        @media (max-width: 1440px) {
          .bottom-queues {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 1100px) {
          .agentic-surface {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .voyage-sidebar {
            width: 82px;
          }

          .voyage-main-content {
            padding: 18px;
          }

          .bottom-queues {
            grid-template-columns: 1fr;
          }

          .dashboard-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
