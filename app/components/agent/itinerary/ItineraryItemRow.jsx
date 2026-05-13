"use client";

function TypeIcon({ itemType }) {
  const t = (itemType || '').toUpperCase();

  // Activity: map pin
  if (t === 'ACTIVITY') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );

  // Meal: utensils
  if (t === 'MEAL') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
      <path d="M7 2v20"></path>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
    </svg>
  );

  // Transfer: car
  if (t === 'TRANSFER') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v7a2 2 0 0 1-2 2h-2"></path>
      <circle cx="7.5" cy="17.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );

  // Check-in: key
  if (t === 'CHECK_IN') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
  );

  // Check-out: building / hotel
  if (t === 'CHECK_OUT') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  // Free time: sun
  if (t === 'FREE_TIME') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  );

  // Note: file-text
  if (t === 'NOTE') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  );

  // Default: dot
  return <span className="text-text-muted text-sm leading-none">•</span>;
}

export default function ItineraryItemRow({ item }) {
  const { type, startTime, endTime, title, description, staffNotes } = item;
  const timeDisplay = [startTime, endTime].filter(Boolean).join(' – ');

  return (
    <div className="grid gap-3 px-3 py-3 border-b border-border bg-white transition-colors duration-500 last:border-b-0 [grid-template-columns:60px_30px_1fr]">
      <div className="text-[11px] font-bold text-text-soft pt-0.5">{timeDisplay}</div>
      <div className="pt-px flex items-start justify-center">
        <TypeIcon itemType={type} />
      </div>
      <div>
        <div className="text-sm font-bold text-primary mb-0.5">{title}</div>
        {description && (
          <div className="text-xs text-text-muted mb-1.5">{description}</div>
        )}
        {staffNotes && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-background text-text-soft uppercase">
              {staffNotes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
