import React, { useMemo } from "react";
import { buildRichItinerarySections } from "../../../lib/trip-dashboard/richItinerary.js";

function StopShell({ stop, selectedPlaceId, onPlaceSelect }) {
  const isSelected = stop.isSelectable && stop.placeId === selectedPlaceId;
  const rowBase =
    "grid gap-4 items-start w-full border border-border/10 rounded-xl bg-surface-elevated text-text-primary p-3.5 text-left transition-all duration-200 shadow-sm";
  const rowGrid = "grid-cols-[74px_80px_minmax(0,1fr)]";
  const rowSelectable = stop.isSelectable
    ? "cursor-pointer hover:border-secondary/40 hover:shadow-md active:scale-[0.99]"
    : "opacity-90";
  const rowSelected = isSelected ? "border-secondary/60 ring-2 ring-secondary/10 shadow-md" : "";

  const className = `${rowBase} ${rowGrid} ${rowSelectable} ${rowSelected}`;

  const content = (
    <>
      <span className="text-text-soft text-[11px] font-bold leading-[1.35] pt-1">{stop.timeLabel}</span>
      {stop.photoUrl ? (
        <img className="w-[80px] h-[80px] rounded-lg object-cover shadow-sm" src={stop.photoUrl} alt={stop.placeName} />
      ) : (
        <span className="w-[80px] h-[80px] rounded-lg inline-flex items-center justify-center bg-background text-text-soft text-xl font-bold border border-border/10" aria-hidden="true">
          {stop.placeName.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="grid gap-1 min-w-0">
        <strong className="text-text-primary text-[13px] leading-[1.25]">{stop.title}</strong>
        <span className="flex flex-wrap gap-x-2 gap-y-1 text-text-soft text-[11px] font-bold leading-[1.35]">
          {stop.rating ? <span>{stop.rating}</span> : null}
          {stop.placeType ? <span>{stop.placeType}</span> : null}
          {stop.userRatingCount ? <span>{stop.userRatingCount.toLocaleString()} reviews</span> : null}
          <span>{stop.statusLabel}</span>
        </span>
        {stop.description ? <span className="text-text-primary text-xs leading-[1.4]">{stop.description}</span> : null}
        {stop.highlights.length > 0 ? (
          <span className="flex flex-col gap-0.5">
            {stop.highlights.map((highlight) => (
              <small key={highlight} className="text-text-soft text-[11px] leading-[1.35]">{highlight}</small>
            ))}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!stop.isSelectable) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onPlaceSelect?.(stop.placeId)}
      aria-label={`Select ${stop.title}`}
      aria-current={isSelected ? "true" : undefined}
    >
      {content}
    </button>
  );
}

export default function RichItineraryMessage({
  itinerary,
  placeEntities = [],
  selectedPlaceId = "",
  onPlaceSelect,
}) {
  const sections = useMemo(
    () => buildRichItinerarySections({ itinerary, placeEntities }),
    [itinerary, placeEntities],
  );

  return (
    <article className="grid gap-6 min-w-[min(100%,340px)] bg-surface-elevated p-5 rounded-2xl border border-border/10 shadow-sm" aria-label="Generated itinerary">
      <header className="grid gap-2 p-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(215,122,97,0.6)]" />
          <span className="text-text-soft text-[10px] font-black tracking-widest uppercase">Draft Itinerary</span>
        </div>
        <h2 className="m-0 text-text-primary text-2xl font-serif leading-[1.1] tracking-tight">{sections.title}</h2>
        {sections.summary ? (
          <p className="m-0 text-text-soft text-[14px] leading-relaxed font-medium line-clamp-2 hover:line-clamp-none transition-all duration-300">
            {sections.summary}
          </p>
        ) : null}
      </header>

      <div className="grid gap-3.5">
        {sections.days.map((day) => (
          <section className="grid gap-3" key={day.id}>
            <h3 className="flex items-center gap-2 m-0 text-text-primary text-[14px] font-bold py-1 border-b border-border/10">
              <span className="text-secondary tracking-tight">Day {day.dayNumber}</span>
              {day.title ? (
                <span className="text-text-soft font-normal truncate"> — {day.title}</span>
              ) : null}
            </h3>
            <div className="grid gap-2">
              {day.stops.map((stop) => (
                <StopShell
                  key={stop.id}
                  stop={stop}
                  selectedPlaceId={selectedPlaceId}
                  onPlaceSelect={onPlaceSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
