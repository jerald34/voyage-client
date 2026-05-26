"use client";
import Sparkline from "./Sparkline";

/**
 * KPI tile — 120px fixed height, label + period chip on top,
 * hero number with tabular-nums + delta chip, 32px sparkline.
 *
 * Whole tile is a button (≥44pt effective hit area). On click, the
 * parent opens the side-panel listing of contributing trips.
 *
 * Spec §6.4
 */
export default function KpiTile({
  label,
  value,
  unit,
  deltaVsPrior = 0,
  sparkline = [],
  subtitle,
  ariaLabel,
  onClick,
  formatValue = (v) => v.toString()
}) {
  const formatted = formatValue(value);
  const isPositive = deltaVsPrior > 0;
  const isNegative = deltaVsPrior < 0;
  const deltaIcon = isPositive ? "▲" : isNegative ? "▼" : "•";
  const deltaColor = isPositive
    ? "text-[color:var(--success)]"
    : isNegative
      ? "text-[color:var(--danger)]"
      : "text-text-muted";
  const deltaText = `${Math.abs(deltaVsPrior).toFixed(1)}${unit === "%" ? " pts" : ""}`;

  const a11yLabel =
    ariaLabel ??
    `${label}: ${formatted}${unit ?? ""}, ${isPositive ? "up" : isNegative ? "down" : "unchanged"} ${deltaText} vs prior period`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={a11yLabel}
      className="group relative flex h-[120px] w-full flex-col justify-between dashboard-card p-4 text-left transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
      style={{ transitionTimingFunction: "var(--ease-out)", transitionDuration: "160ms" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="dashboard-eyebrow font-extrabold">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-semibold leading-none tabular-nums text-text-primary">{formatted}</span>
          {unit ? <span className="text-sm text-text-muted">{unit}</span> : null}
        </div>
        <Sparkline values={sparkline} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1 tabular-nums font-bold ${deltaColor}`}>
          <span aria-hidden="true">{deltaIcon}</span>
          {deltaText}
        </span>
        {subtitle ? <span className="text-text-muted">{subtitle}</span> : null}
      </div>
    </button>
  );
}
