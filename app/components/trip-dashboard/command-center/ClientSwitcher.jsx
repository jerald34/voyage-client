import React from "react";

export default function ClientSwitcher({
  isClientMenuOpen,
  setIsClientMenuOpen,
  clientMenuRef,
  hasOptions,
  activeTripClientName,
  activeTripInitials,
  activeTripOrganizerInitials,
  clientMenuEmptyTitle,
  safeOptions,
  activeOption,
  getInitials,
  onPlanningOptionDelete,
  deletingThreadId,
  onPlanningOptionChange,
  clientMenuEmptyBody
}) {
  return (
    <div className="client-switcher-wrap" ref={clientMenuRef}>
      {/* <span className="client-switcher-label">Current client</span> */}
      <button
        className={`client-switcher ${isClientMenuOpen ? "open" : ""}`}
        onClick={() => setIsClientMenuOpen((current) => !current)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isClientMenuOpen}
        aria-label={hasOptions ? `Current client: ${activeTripClientName}` : clientMenuEmptyTitle}
      >
        {activeTripClientName ? (
          <>
            <span className="client-badge-stack" aria-hidden="true">
              <span className="client-badge primary">{activeTripInitials}</span>
              {activeTripOrganizerInitials && <span className="client-badge secondary">{activeTripOrganizerInitials}</span>}
            </span>
            <span className="client-switcher-name">{activeTripClientName}</span>
          </>
        ) : (
          <span className="client-switcher-empty">{clientMenuEmptyTitle}</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isClientMenuOpen && (
        <div className="client-menu" role="listbox" aria-label="Current client">
          {hasOptions ? (
            safeOptions.map((option) => {
              const isSelected = option?.type === activeOption?.type && option?.id === activeOption?.id;
              const optionName = option?.clientName || option?.label || "Planning item";
              const initials = getInitials(optionName);
              const optionThreadId = option?.threadId ?? (option?.type === "draft" ? option?.id : null);
              const canDeleteThread = Boolean(optionThreadId && onPlanningOptionDelete);
              const isDeletingThread = Boolean(optionThreadId && deletingThreadId === optionThreadId);

              return (
                <div
                  key={`${option?.type ?? "option"}:${option?.id ?? optionName}`}
                  className={`client-option-row ${option?.type === "draft" ? "draft" : "trip"} ${isSelected ? "selected" : ""}`}
                >
                  <button
                    type="button"
                    className="client-option"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onPlanningOptionChange?.({ type: option?.type, id: option?.id });
                      setIsClientMenuOpen(false);
                    }}
                  >
                    <span className="client-option-badge" aria-hidden="true">
                      {initials}
                    </span>
                    <span className="client-option-body">
                      <strong>{optionName}</strong>
                      <span>{option?.destination || option?.statusLabel}</span>
                      {option?.statusLabel && <small>{option.statusLabel}</small>}
                    </span>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                    )}
                  </button>
                  {canDeleteThread && (
                    <button
                      type="button"
                      className="client-option-delete"
                      aria-label={`Delete ${optionName} thread`}
                      disabled={isDeletingThread}
                      onClick={() => onPlanningOptionDelete?.(option)}
                    >
                      {isDeletingThread ? (
                        <span aria-hidden="true">...</span>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="client-menu-empty" role="status" aria-live="polite">
              <strong>{clientMenuEmptyTitle}</strong>
              <p>{clientMenuEmptyBody}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
