import React, { useMemo } from "react";
import { buildRichItinerarySections } from "../../../lib/trip-dashboard/richItinerary.js";

function StopShell({ stop, selectedPlaceId, onPlaceSelect }) {
  const isSelected = stop.isSelectable && stop.placeId === selectedPlaceId;
  const rowBase =
    "grid gap-2.5 items-start w-full border border-border rounded-sm bg-white text-text-primary p-2.5 text-left";
  const rowGrid = "grid-cols-[74px_54px_minmax(0,1fr)]";
  const rowSelectable = stop.isSelectable
    ? "cursor-pointer transition-[border-color,box-shadow,transform] duration-[180ms] ease-linear hover:-translate-y-px hover:border-secondary/70 hover:shadow-[0_10px_20px_rgba(34,56,67,0.08)] focus-visible:outline-2 focus-visible:outline-transparent focus-visible:outline-offset-2 focus-visible:border-secondary focus-visible:shadow-[0_0_0_3px_rgba(215,122,97,0.24),0_10px_20px_rgba(34,56,67,0.08)]"
    : "bg-white/[0.72]";
  const rowSelected = isSelected ? "border-secondary/70 shadow-[0_10px_20px_rgba(34,56,67,0.08)] -translate-y-px" : "";

  const className = `${rowBase} ${rowGrid} ${rowSelectable} ${rowSelected}`;

  const content = (
    <>
      <span className="text-text-soft text-[11px] font-extrabold leading-[1.35]">{stop.timeLabel}</span>
      {stop.photoUrl ? (
        <img className="w-[54px] h-[54px] rounded-[10px] object-cover" src={stop.photoUrl} alt={`${stop.placeName} itinerary stop`} />
      ) : (
        <span className="w-[54px] h-[54px] rounded-[10px] inline-flex items-center justify-center bg-background text-text-primary text-lg font-extrabold" aria-hidden="true">
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
    <article className="grid gap-4 min-w-[min(100%,280px)]" aria-label="Generated itinerary">
      <header className="grid gap-1.5">
        <span className="text-text-soft text-[10px] font-extrabold tracking-[0.12em] uppercase">Generated itinerary</span>
        <h2 className="m-0 text-text-primary text-lg leading-[1.2]">{sections.title}</h2>
        {sections.summary ? <p className="m-0 text-text-soft text-[13px] leading-[1.45]">{sections.summary}</p> : null}
      </header>

      <div className="grid gap-3.5">
        {sections.days.map((day) => (
          <section className="grid gap-2" key={day.id}>
            <h3 className="flex items-baseline gap-2 m-0 text-text-primary text-[13px] leading-[1.25]">
              <span>{day.label}</span>
              {day.title ? (
                <small className="min-w-0 text-text-soft text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{day.title}</small>
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
