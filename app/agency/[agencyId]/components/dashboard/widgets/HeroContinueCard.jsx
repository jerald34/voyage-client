/**
 * HeroContinueCard.jsx
 * Staff dashboard hero card — most recently touched trip with Continue CTA (§4.1)
 */

'use client';

import EmptyState from './EmptyState';

// Status tone mapping for chip color
const STATUS_TONES = {
  DRAFT: 'warning',
  IN_REVIEW: 'accent',
  APPROVED_INTERNAL: 'success',
  ARCHIVED: 'muted',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  APPROVED_INTERNAL: 'Approved',
  ARCHIVED: 'Archived',
};

function StatusChip({ status }) {
  const tone = STATUS_TONES[status] || 'muted';
  const label = STATUS_LABELS[status] || status;

  // CSS color mappings for each tone
  const toneColorMap = {
    warning: 'var(--warning)',
    accent: 'var(--accent)',
    success: 'var(--success)',
    muted: 'var(--text-muted)',
  };

  const bgColorMap = {
    warning: 'rgba(217, 119, 6, 0.1)',    // --warning with 10% opacity
    accent: 'rgba(59, 130, 246, 0.1)',    // --accent with 10% opacity
    success: 'rgba(22, 163, 74, 0.1)',    // --success with 10% opacity
    muted: 'rgba(113, 113, 122, 0.1)',    // --text-muted with 10% opacity
  };

  const color = toneColorMap[tone];
  const bgColor = bgColorMap[tone];

  return (
    <span
      className="inline-block px-2 py-1 rounded text-xs font-medium"
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
    >
      {label}
    </span>
  );
}

export default function HeroContinueCard({ trip, onContinue }) {
  if (!trip) {
    return <EmptyState variant="staff-hero" />;
  }

  return (
    <div className="h-[200px] rounded-xl border border-border/10 bg-surface p-6 flex flex-col justify-between">
      {/* Top: status chip, title, client name */}
      <div>
        <div className="mb-3">
          <StatusChip status={trip.statusChip} />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1 line-clamp-2">
          {trip.tripTitle}
        </h2>
        <p className="text-sm text-text-muted">
          {trip.clientName}
        </p>
      </div>

      {/* Middle: last activity preview */}
      {trip.lastActivityPreview && (
        <p className="text-sm text-text-primary line-clamp-2">
          {trip.lastActivityPreview}
        </p>
      )}

      {/* Bottom: Continue CTA */}
      <button
        type="button"
        onClick={() => onContinue(trip.tripId)}
        className="w-full h-12 rounded-lg bg-[color:var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ '--tw-ring-color': 'var(--accent)' }}
      >
        Continue
      </button>
    </div>
  );
}
