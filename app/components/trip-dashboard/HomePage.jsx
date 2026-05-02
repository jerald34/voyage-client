import { useEffect, useRef, useState } from "react";
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

export default function HomePage({ user: userProp, agencyTrips = initialAgencyPortfolioTrips, onContinue, onOpenTrip }) {
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

  const summary = getAgencyPortfolioSummary(agencyTrips);
  const insights = getAgentCommandInsights(agencyTrips);
  const priorityQueue = getAgentPriorityQueue(agencyTrips);
  const urgentDepartures = getUrgentDepartures(agencyTrips);
  const approvalBlockers = getApprovalBlockers(agencyTrips);

  const draftDays = Array.isArray(itinerary?.days) ? itinerary.days.slice(0, 3) : [];
  const tripTitle = itinerary?.title || "No active draft yet";
  const draftVersion = itinerary?.version ? `Draft v${itinerary.version}` : "Draft v3"; // Fallback to v3 for visual demo
  const travelers = itinerary?.trip?.travelerCount;
  const budget = itinerary?.trip?.budgetLevel;

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
      {/* Top Header */}
      <header className="voyage-header">
        <div className="brand-logo">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B65D48" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
           VOYAGE
        </div>
        <div className="user-profile">
           <img src="https://i.pravatar.cc/150?img=47" alt="User" className="user-avatar" />
           <div className="user-info">
              <strong>{user?.displayName || "Alexandra Diaz"}</strong>
              <span>Senior Travel Planner</span>
           </div>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </header>

      <div className="voyage-body">
        {/* Sidebar */}
        <aside className="voyage-sidebar">
          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               </div>
               <span>Command<br/>Center</span>
            </a>
            <a href="#" className="nav-item">
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
               </div>
               <span>Itineraries</span>
            </a>
            <a href="#" className="nav-item">
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
               </div>
               <span>Clients</span>
            </a>
            <a href="#" className="nav-item">
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
               </div>
               <span>Suppliers</span>
            </a>
            <a href="#" className="nav-item">
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
               </div>
               <span>Bookings</span>
            </a>
            <a href="#" className="nav-item">
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
               </div>
               <span>Reports</span>
            </a>
            <a href="#" className="nav-item" style={{ marginTop: 'auto' }}>
               <div className="icon-wrapper">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
               </div>
               <span>Settings</span>
            </a>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="voyage-main-content">
          <section className="agentic-surface">
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
              itinerary={itinerary}
              draftDays={draftDays}
              tripTitle={tripTitle}
              draftVersion={draftVersion}
              budget={budget}
              travelers={travelers}
              insights={insights}
              onContinue={onContinue}
              dispatchAgentMessage={dispatchAgentMessage}
            />
          </section>

          <div className="bottom-queues">
            <AgentPriorityQueue trips={priorityQueue} />
            <UrgentDeparturesPanel trips={urgentDepartures} />
            <ApprovalQueuePanel trips={approvalBlockers} />
            <ClientTripPortfolio trips={agencyTrips} onOpenTrip={onOpenTrip} />
          </div>
          
          <footer className="dashboard-footer">
             <div className="status"><span className="status-dot-green"></span> All Systems Operational</div>
             <div className="right-footer">
               <span className="exchange">Exchange Rates: USD 1.00 = EUR 0.92</span>
               <span className="weather">⛅ Weather in Zurich: 18°C</span>
               <span className="time">May 22, 2025 • 10:24 AM 🕐</span>
             </div>
          </footer>
        </main>
      </div>

      <style jsx>{`
        .voyage-dashboard-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #F3F4F6;
          font-family: 'Inter', sans-serif;
        }

        .voyage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          background: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 0 24px;
          flex-shrink: 0;
          z-index: 10;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          letter-spacing: 2px;
          color: #111827;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-info strong {
          font-size: 14px;
          color: #111827;
        }

        .user-info span {
          font-size: 12px;
          color: #6B7280;
        }

        .voyage-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .voyage-sidebar {
          width: 90px;
          background: #113437;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 20px 0;
          flex: 1;
          gap: 12px;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 4px;
          color: #7B9A98;
          text-decoration: none;
          gap: 6px;
          text-align: center;
        }

        .nav-item .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-item span {
          font-size: 11px;
          font-weight: 500;
          line-height: 1.2;
        }

        .nav-item.active {
          color: white;
          background: rgba(255, 255, 255, 0.08);
          border-left: 3px solid #D77A61;
        }

        .nav-item:hover:not(.active) {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .voyage-main-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .agentic-surface {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .bottom-queues {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
        }

        .dashboard-footer {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 24px 0 0 0;
           margin-top: 24px;
           font-size: 12px;
           color: #6B7280;
        }
        
        .right-footer {
           display: flex;
           gap: 24px;
        }
        
        .status {
           display: flex;
           align-items: center;
           gap: 6px;
        }
        
        .status-dot-green {
           width: 8px;
           height: 8px;
           background: #10B981;
           border-radius: 50%;
        }

        @media (max-width: 1400px) {
          .bottom-queues {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 1024px) {
          .agentic-surface {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
