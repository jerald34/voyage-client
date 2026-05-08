import React, { useMemo } from "react";
import { buildRichItinerarySections } from "../../../lib/trip-dashboard/richItinerary.js";
import "./RichItineraryMessage.css";

function StopShell({ stop, selectedPlaceId, onPlaceSelect }) {
  const isSelected = stop.isSelectable && stop.placeId === selectedPlaceId;
  const className = `rich-stop-row ${stop.isSelectable ? "selectable" : "unresolved"} ${isSelected ? "selected" : ""}`;
  const content = (
    <>
      <span className="rich-stop-time">{stop.timeLabel}</span>
      {stop.photoUrl ? (
        <img className="rich-stop-photo" src={stop.photoUrl} alt={`${stop.placeName} itinerary stop`} />
      ) : (
        <span className="rich-stop-photo-placeholder" aria-hidden="true">
          {stop.placeName.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="rich-stop-body">
        <strong>{stop.title}</strong>
        <span className="rich-stop-meta">
          {stop.rating ? <span>{stop.rating}</span> : null}
          {stop.placeType ? <span>{stop.placeType}</span> : null}
          {stop.userRatingCount ? <span>{stop.userRatingCount.toLocaleString()} reviews</span> : null}
          <span>{stop.statusLabel}</span>
        </span>
        {stop.description ? <span className="rich-stop-description">{stop.description}</span> : null}
        {stop.highlights.length > 0 ? (
          <span className="rich-stop-highlights">
            {stop.highlights.map((highlight) => (
              <small key={highlight}>{highlight}</small>
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
    <article className="rich-itinerary-message" aria-label="Generated itinerary">
      <header className="rich-itinerary-header">
        <span className="rich-itinerary-kicker">Generated itinerary</span>
        <h2>{sections.title}</h2>
        {sections.summary ? <p>{sections.summary}</p> : null}
      </header>

      <div className="rich-itinerary-days">
        {sections.days.map((day) => (
          <section className="rich-day-section" key={day.id}>
            <h3>
              <span>{day.label}</span>
              {day.title ? <small>{day.title}</small> : null}
            </h3>
            <div className="rich-stop-list">
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
