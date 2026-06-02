"use client";

const fmtInt = (n) => (n ?? 0).toLocaleString();
const fmtUsd = (n) => `$${(n ?? 0).toFixed(3)}`;

function Card({ label, value }) {
  return (
    <div className="rounded-md border border-border/12 bg-surface p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text-primary tabular-nums">{value}</p>
    </div>
  );
}

export default function UsageStatCards({ totals }) {
  const t = totals || {};
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Total tokens" value={fmtInt(t.totalTokens)} />
      <Card label="Est. cost" value={fmtUsd(t.costUsd)} />
      <Card label="Runs" value={fmtInt(t.runCount)} />
      <Card label="Cached tokens" value={fmtInt(t.cachedTokens)} />
    </div>
  );
}
