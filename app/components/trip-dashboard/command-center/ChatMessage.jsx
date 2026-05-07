import React from "react";
import ReactMarkdown from "react-markdown";
import { getMatchedPlaces, matchPlaceMentions } from "../../../lib/trip-dashboard/placeEntities.js";
import RichItineraryMessage from "./RichItineraryMessage.jsx";

function PlaceLinkedText({ children, placeEntities, selectedPlaceId, onPlaceSelect }) {
  if (typeof children !== "string" && typeof children !== "number") {
    return <>{children}</>;
  }

  const content = String(children ?? "");
  const segments = matchPlaceMentions(content, placeEntities);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type !== "place") {
          return <React.Fragment key={`text-${index}`}>{segment.text}</React.Fragment>;
        }

        const isSelected = segment.place.id === selectedPlaceId;
        return (
          <button
            key={`${segment.place.id}-${index}`}
            type="button"
            className={`place-inline-link ${isSelected ? "selected" : ""}`}
            onClick={() => onPlaceSelect?.(segment.place.id)}
            aria-label={`Show ${segment.place.name} on map`}
          >
            {segment.text}
          </button>
        );
      })}
    </>
  );
}

function renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect) {
  return React.Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return (
        <PlaceLinkedText placeEntities={placeEntities} selectedPlaceId={selectedPlaceId} onPlaceSelect={onPlaceSelect}>
          {child}
        </PlaceLinkedText>
      );
    }

    if (React.isValidElement(child) && child.type === PlaceLinkedText) {
      return child;
    }

    if (React.isValidElement(child) && child.props?.children) {
      return React.cloneElement(child, {
        children: renderLinkedChildren(child.props.children, placeEntities, selectedPlaceId, onPlaceSelect),
      });
    }

    return child;
  });
}

function PlaceCards({ places, selectedPlaceId, onPlaceSelect }) {
  if (!Array.isArray(places) || places.length === 0) {
    return null;
  }

  return (
    <div className="message-place-cards" aria-label="Places mentioned">
      {places.map((place) => (
        <button
          key={place.id}
          type="button"
          className={`message-place-card ${place.id === selectedPlaceId ? "selected" : ""}`}
          onClick={() => onPlaceSelect?.(place.id)}
          aria-label={`Focus ${place.name} on map`}
        >
          <span className="place-card-pin" aria-hidden="true">
            {place.source === "live" ? "*" : String((place.itineraryIndex ?? 0) + 1)}
          </span>
          <span className="place-card-body">
            <strong>{place.name}</strong>
            {place.formattedAddress ? <span>{place.formattedAddress}</span> : null}
            {place.dayLabel ? <small>{place.dayLabel}</small> : null}
            {place.timeLabel ? <small>{place.timeLabel}</small> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function ChatMessage({
  message,
  isUser,
  userName,
  userInitials,
  itinerary = null,
  renderAsItinerary = false,
  placeEntities = [],
  selectedPlaceId = "",
  onPlaceSelect,
}) {
  const matchedPlaces = isUser ? [] : getMatchedPlaces(message?.content, placeEntities);
  const shouldRenderRichItinerary = !isUser && renderAsItinerary && itinerary;

  return (
    <div className={`chat-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="avatar assistant-avatar" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="m16 10-4 4-4-4" />
          </svg>
        </div>
      )}
      <div className="message-content">
        <div className="message-meta">
          <span className="sender">{isUser ? userName : "Voyage Agent"}</span>
          <span className="time">{isUser ? "You" : "Agent"}</span>
        </div>
        <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : shouldRenderRichItinerary ? (
            <RichItineraryMessage
              itinerary={itinerary}
              placeEntities={placeEntities}
              selectedPlaceId={selectedPlaceId}
              onPlaceSelect={onPlaceSelect}
            />
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  p({ children }) {
                    return <p>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</p>;
                  },
                  li({ children }) {
                    return <li>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</li>;
                  },
                  strong({ children }) {
                    return <strong>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</strong>;
                  },
                  em({ children }) {
                    return <em>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</em>;
                  },
                  h1({ children }) {
                    return <h1>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</h1>;
                  },
                  h2({ children }) {
                    return <h2>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</h2>;
                  },
                  h3({ children }) {
                    return <h3>{renderLinkedChildren(children, placeEntities, selectedPlaceId, onPlaceSelect)}</h3>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              <PlaceCards places={matchedPlaces} selectedPlaceId={selectedPlaceId} onPlaceSelect={onPlaceSelect} />
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="avatar user-avatar" aria-hidden="true">
          {userInitials}
        </div>
      )}
    </div>
  );
}
