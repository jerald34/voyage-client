"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardPoll } from "../../../../hooks/useDashboardPoll";
import KpiTile from "./widgets/KpiTile";
import FunnelChart from "./widgets/FunnelChart";
import WorklistRow from "./widgets/WorklistRow";
import RatingsPanel from "./widgets/RatingsPanel";
import ActivityRibbon from "./widgets/ActivityRibbon";
import EmptyState from "./widgets/EmptyState";
import PeriodSwitcher from "./widgets/PeriodSwitcher";

// ---------------------------------------------------------------------------
// Worklist group definitions (spec §3.1)
// ---------------------------------------------------------------------------
const WORKLIST_GROUPS = [
  {
    key: "unreadComments",
    heading: "Unread comments",
    tone: "info",
    actionLabel: "Reply",
  },
  {
    key: "viewedNotReplied",
    heading: "Viewed not replied",
    tone: "info",
    actionLabel: "Open trip",
  },
  {
    key: "draftsStuck",
    heading: "Drafts stuck",
    tone: "warning",
    actionLabel: "Resume",
  },
  {
    key: "sharesExpiring",
    heading: "Shares expiring",
    tone: "warning",
    actionLabel: "Extend",
  },
  {
    key: "lowRated",
    heading: "Low rated",
    tone: "danger",
    actionLabel: "Open trip",
  },
];

// ---------------------------------------------------------------------------
// Skeleton placeholder — rendered when data === null (no SSR payload)
// ---------------------------------------------------------------------------
function DashboardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-label="Loading dashboard"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg bg-surface-elevated" />
        <div className="flex gap-3">
          <div className="h-9 w-24 rounded-lg bg-surface-elevated" />
          <div className="h-9 w-32 rounded-lg bg-surface-elevated" />
        </div>
      </div>
      {/* Worklist skeleton */}
      <div className="rounded-xl border border-border/10 bg-surface p-6 space-y-3">
        <div className="h-4 w-48 rounded bg-surface-elevated" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-full rounded-lg bg-surface-elevated" />
        ))}
      </div>
      {/* KPI strip skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-xl border border-border/10 bg-surface"
          />
        ))}
      </div>
      {/* Funnel skeleton */}
      <div className="h-48 rounded-xl border border-border/10 bg-surface" />
      {/* Tail skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-48 rounded-xl border border-border/10 bg-surface" />
        <div className="h-48 rounded-xl border border-border/10 bg-surface" />
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OwnerOverview
// ---------------------------------------------------------------------------
export default function OwnerOverview({ agencyId, initialData = null }) {
  const router = useRouter();
  const [period, setPeriod] = useState("30d");

  const { data, isStale, isFetching, refetch } = useDashboardPoll({
    agencyId,
    view: "owner",
    period,
    initialData,
  });

  // -------------------------------------------------------------------------
  // Action stubs — Stage 5 will wire inline replies
  // -------------------------------------------------------------------------
  function handleTripAction(tripId) {
    router.push(`/agency/${agencyId}/trip/${tripId}`);
  }

  // -------------------------------------------------------------------------
  // Derived: worklist total
  // -------------------------------------------------------------------------
  const worklist = data?.worklist ?? {};
  const totalWorklistItems = WORKLIST_GROUPS.reduce(
    (sum, group) => sum + (worklist[group.key]?.length ?? 0),
    0,
  );

  // -------------------------------------------------------------------------
  // KPI helpers
  // -------------------------------------------------------------------------
  const kpis = data?.kpis ?? {};

  function formatResponseRate(kpi) {
    if (!kpi) return undefined;
    const { responseCount, totalCount, responseRate } = kpi;
    if (responseCount == null || totalCount == null) return undefined;
    const pct =
      responseRate != null
        ? responseRate.toFixed(0)
        : totalCount > 0
          ? ((responseCount / totalCount) * 100).toFixed(0)
          : 0;
    return `${responseCount} of ${totalCount} rated (${pct}%)`;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 md:px-8">
      {/* Stale banner */}
      {isStale && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-lg border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 px-4 py-2 text-sm text-text-primary"
        >
          <span>We couldn&rsquo;t refresh — last loaded a few minutes ago.</span>
          <button
            type="button"
            onClick={refetch}
            className="ml-4 rounded-md px-3 py-1 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[22px] font-semibold text-text-primary">
          Overview
        </h1>

        <div className="flex items-center gap-3">
          <PeriodSwitcher
            value={period}
            onChange={setPeriod}
            disabled={isFetching}
          />

          <button
            type="button"
            onClick={() => router.push(`/agency/${agencyId}/trip/new`)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
          >
            New trip
          </button>

          <button
            type="button"
            onClick={() => router.push(`/agency/${agencyId}/team`)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/30 bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
          >
            Invite teammate
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Skeleton when no data at all                                        */}
      {/* ------------------------------------------------------------------ */}
      {data === null ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* -------------------------------------------------------------- */}
          {/* Worklist hero — "Needs your eyes today"                         */}
          {/* -------------------------------------------------------------- */}
          <section
            aria-label="Needs your eyes today"
            className="rounded-xl border border-border/10 bg-surface p-6"
          >
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              Needs your eyes today
            </h2>

            {totalWorklistItems === 0 ? (
              <EmptyState variant="worklist" />
            ) : (
              <div className="space-y-4" role="list">
                {WORKLIST_GROUPS.map((group) => {
                  const items = worklist[group.key] ?? [];
                  if (items.length === 0) return null;

                  return (
                    <div key={group.key}>
                      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        {group.heading} ({items.length})
                      </p>
                      {items.map((item, idx) => (
                        <WorklistRow
                          key={item.tripId ?? `${group.key}-${idx}`}
                          tone={group.tone}
                          title={item.tripTitle ?? item.title ?? "Untitled trip"}
                          subtitle={item.subtitle ?? item.clientName ?? null}
                          hint={item.hint ?? null}
                          actionLabel={group.actionLabel}
                          onAction={() => handleTripAction(item.tripId)}
                          onRowClick={() => handleTripAction(item.tripId)}
                          style={{ transitionDelay: `${idx * 40}ms` }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* -------------------------------------------------------------- */}
          {/* KPI strip                                                        */}
          {/* -------------------------------------------------------------- */}
          <section aria-label="Key performance indicators">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiTile
                label="Win rate"
                value={kpis.winRate?.value ?? 0}
                unit="%"
                deltaVsPrior={kpis.winRate?.deltaVsPrior ?? 0}
                sparkline={kpis.winRate?.sparkline ?? []}
                formatValue={(v) => v.toFixed(1)}
              />
              <KpiTile
                label="Time to first share"
                value={kpis.timeToFirstShareDays?.value ?? 0}
                unit="days"
                deltaVsPrior={kpis.timeToFirstShareDays?.deltaVsPrior ?? 0}
                sparkline={kpis.timeToFirstShareDays?.sparkline ?? []}
                formatValue={(v) => v.toString()}
              />
              <KpiTile
                label="Median response time"
                value={kpis.medianCommentResponseHours?.value ?? 0}
                unit="h"
                deltaVsPrior={
                  kpis.medianCommentResponseHours?.deltaVsPrior ?? 0
                }
                sparkline={kpis.medianCommentResponseHours?.sparkline ?? []}
                formatValue={(v) => v.toString()}
              />
              <KpiTile
                label="Avg proposal rating"
                value={kpis.avgProposalRating?.value ?? 0}
                unit="★"
                deltaVsPrior={kpis.avgProposalRating?.deltaVsPrior ?? 0}
                sparkline={kpis.avgProposalRating?.sparkline ?? []}
                formatValue={(v) => v.toFixed(1)}
                subtitle={formatResponseRate(kpis.avgProposalRating)}
              />
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* Conversion funnel                                               */}
          {/* -------------------------------------------------------------- */}
          {data.funnel?.stages?.length > 0 && (
            <FunnelChart
              stages={data.funnel.stages}
              agencyId={agencyId}
            />
          )}

          {/* -------------------------------------------------------------- */}
          {/* Tail: ratings + activity                                        */}
          {/* -------------------------------------------------------------- */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border/10 bg-surface p-6">
              <RatingsPanel reviews={data.recentReviews ?? []} />
            </div>
            <div className="rounded-xl border border-border/10 bg-surface p-6">
              <ActivityRibbon events={data.activityRibbon ?? []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
