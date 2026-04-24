"use client";

import { initialAgencyPortfolioTrips } from "../../data/prototype/agency-portfolio.js";
import {
  getAgencyPortfolioSummary,
  getAgentCommandInsights,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import AgentCommandCenter from "./AgentCommandCenter.jsx";
import AgencyMetricStrip from "./AgencyMetricStrip.jsx";
import AgentPriorityQueue from "./AgentPriorityQueue.jsx";
import ApprovalQueuePanel from "./ApprovalQueuePanel.jsx";
import ClientTripPortfolio from "./ClientTripPortfolio.jsx";
import UrgentDeparturesPanel from "./UrgentDeparturesPanel.jsx";

export default function HomePage({ agencyTrips = initialAgencyPortfolioTrips, onContinue }) {
  const summary = getAgencyPortfolioSummary(agencyTrips);
  const insights = getAgentCommandInsights(agencyTrips);
  const priorityQueue = getAgentPriorityQueue(agencyTrips);
  const urgentDepartures = getUrgentDepartures(agencyTrips);
  const approvalBlockers = getApprovalBlockers(agencyTrips);

  return (
    <div id="home" className="trip-dashboard-shell agency-dashboard-shell">
      <header className="landing-header trip-dashboard-header agency-dashboard-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--voyage-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: "700",
              }}
            >
              Agency Portfolio
            </span>
            <strong style={{ fontSize: "0.95rem", color: "var(--voyage-text)" }}>
              Operations desk
            </strong>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--voyage-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              border: "2px solid rgba(255,255,255,0.8)",
              boxShadow: "var(--voyage-shadow-soft)",
            }}
          >
            A
          </div>
        </div>
      </header>

      <AgentCommandCenter insights={insights} onRunReview={onContinue} />

      <AgencyMetricStrip summary={summary} />

      <div className="agency-dashboard-grid">
        <AgentPriorityQueue trips={priorityQueue} />
        <div className="agency-dashboard-side-stack">
          <UrgentDeparturesPanel trips={urgentDepartures} />
          <ApprovalQueuePanel trips={approvalBlockers} />
        </div>
      </div>

      <ClientTripPortfolio trips={agencyTrips} />
    </div>
  );
}
