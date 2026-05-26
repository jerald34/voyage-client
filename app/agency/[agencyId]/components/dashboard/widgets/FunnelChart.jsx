"use client";
import { useState } from "react";
import FunnelStageDetailPanel from "./FunnelStageDetailPanel";

const STAGE_LABELS = {
  created: "Trips created",
  drafted: "Itineraries drafted",
  sent: "Shares sent",
  viewed: "Shares viewed",
  approved: "Approved"
};

/**
 * Horizontal proportional funnel chart with drop-off labels between stages.
 *
 * Click (or Enter/Space) on a stage opens the right-side detail panel
 * listing the trips at that stage. Spec §3.3 and §6.4.
 */
export default function FunnelChart({ stages = [], agencyId }) {
  const [activeStage, setActiveStage] = useState(null);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  if (stages.length === 0) {
    return null;
  }

  const summary = `Funnel from ${stages[0]?.count ?? 0} trips created to ${stages[stages.length - 1]?.count ?? 0} approved.`;

  return (
    <>
      <section
        aria-label={summary}
        className="rounded-xl border border-border/10 bg-surface p-6"
      >
        <h2 className="text-base font-semibold text-text-primary">Conversion funnel</h2>
        <p className="mt-1 text-xs text-text-muted">{summary}</p>
        <ol className="mt-4 space-y-3">
          {stages.map((stage, i) => {
            const widthPct = (stage.count / maxCount) * 100;
            const dropOff = stage.dropOffPct;
            return (
              <li key={stage.key} className="flex flex-col gap-1">
                {dropOff !== null && i > 0 ? (
                  <div className="flex items-center gap-2 pl-2 text-[11px] uppercase tracking-wide text-text-muted">
                    <span aria-hidden="true">↓</span>
                    <span className="tabular-nums">{dropOff.toFixed(1)}% drop-off</span>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveStage(stage)}
                  aria-label={`${STAGE_LABELS[stage.key]}: ${stage.count}. Open trip list.`}
                  className="group relative flex items-center gap-3 rounded-lg border border-border/10 px-3 py-2 text-left transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
                  style={{ transitionTimingFunction: "var(--ease-out)", transitionDuration: "160ms" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 -z-0 rounded-l-lg bg-[color:var(--accent)]/10"
                    style={{ width: `${widthPct}%` }}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex flex-1 items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{STAGE_LABELS[stage.key]}</span>
                    <span className="tabular-nums text-sm font-semibold text-text-primary">{stage.count}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <FunnelStageDetailPanel
        stage={activeStage}
        agencyId={agencyId}
        onClose={() => setActiveStage(null)}
      />
    </>
  );
}
