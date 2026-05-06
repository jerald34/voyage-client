"use client";

import React, { useEffect, useMemo, useState } from "react";

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeOptionalNumber(value) {
  const text = normalizeText(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatInitialValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function formatDateInputValue(value) {
  const initial = formatInitialValue(value);
  if (!initial) return "";
  return initial.includes("T") ? initial.split("T")[0] : initial.slice(0, 10);
}

export default function ApproveItineraryModal({
  itinerary,
  isSaving,
  error,
  onCancel,
  onSubmit,
}) {
  const initialValues = useMemo(() => {
    const trip = itinerary?.trip ?? {};
    const destinationFallback = itinerary?.title ?? "";

    return {
      clientName: normalizeText(trip.clientName),
      destination:
        normalizeText(trip.destination) ||
        normalizeText(trip.destinationSummary) ||
        normalizeText(destinationFallback),
      startDate: formatDateInputValue(trip.startDate),
      endDate: formatDateInputValue(trip.endDate),
      travelerCount: formatInitialValue(trip.travelerCount),
      budgetLevel: normalizeText(trip.budgetLevel),
    };
  }, [itinerary]);

  const [formState, setFormState] = useState(initialValues);

  useEffect(() => {
    setFormState(initialValues);
  }, [initialValues]);

  const canSubmit = useMemo(() => {
    return Boolean(normalizeText(formState.clientName) && normalizeText(formState.destination) && !isSaving);
  }, [formState.clientName, formState.destination, isSaving]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit?.({
      clientName: normalizeText(formState.clientName),
      destination: normalizeText(formState.destination),
      startDate: normalizeText(formState.startDate) || null,
      endDate: normalizeText(formState.endDate) || null,
      travelerCount: normalizeOptionalNumber(formState.travelerCount),
      budgetLevel: normalizeText(formState.budgetLevel) || undefined,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-itinerary-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Draft approval</p>
            <h2 id="approve-itinerary-title">Save draft to client</h2>
          </div>
          <button type="button" className="close-button" onClick={onCancel} aria-label="Close">
            x
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span>Client name</span>
              <input
                type="text"
                value={formState.clientName}
                onChange={handleChange("clientName")}
                required
                autoComplete="name"
                placeholder="Enter client name"
              />
            </label>

            <label className="field">
              <span>Destination</span>
              <input
                type="text"
                value={formState.destination}
                onChange={handleChange("destination")}
                required
                autoComplete="off"
                placeholder="Enter destination"
              />
            </label>

            <label className="field">
              <span>Start date</span>
              <input
                type="date"
                value={formState.startDate}
                onChange={handleChange("startDate")}
              />
            </label>

            <label className="field">
              <span>End date</span>
              <input
                type="date"
                value={formState.endDate}
                onChange={handleChange("endDate")}
              />
            </label>

            <label className="field">
              <span>Travelers</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={formState.travelerCount}
                onChange={handleChange("travelerCount")}
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span>Budget</span>
              <input
                type="text"
                value={formState.budgetLevel}
                onChange={handleChange("budgetLevel")}
                placeholder="Optional"
              />
            </label>
          </div>

          {error ? (
            <div className="error-message" role="alert">
              {typeof error === "string" ? error : error?.message || "Unable to save draft."}
            </div>
          ) : null}

          <footer className="modal-actions">
            <button type="button" className="secondary-button" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={!canSubmit}>
              {isSaving ? "Saving..." : "Save draft"}
            </button>
          </footer>
        </form>

        <style jsx>{`
          .modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 80;
            display: grid;
            place-items: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.42);
            backdrop-filter: blur(8px);
          }

          .modal-shell {
            width: min(100%, 560px);
            background: rgba(255, 255, 255, 0.98);
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
            overflow: hidden;
          }

          .modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding: 18px 20px 14px;
            border-bottom: 1px solid #eef2f7;
          }

          .eyebrow {
            margin: 0 0 4px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #b65d48;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 18px;
            line-height: 1.3;
            color: #111827;
          }

          .close-button {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            background: #f8fafc;
            color: #374151;
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            flex-shrink: 0;
          }

          .close-button:hover {
            background: #ffffff;
            border-color: #d1d5db;
          }

          .modal-form {
            padding: 18px 20px 20px;
          }

          .field-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .field {
            display: grid;
            gap: 8px;
            min-width: 0;
          }

          .field span {
            font-size: 12px;
            font-weight: 700;
            color: #4b5563;
          }

          .field input {
            width: 100%;
            min-width: 0;
            padding: 11px 12px;
            border-radius: 12px;
            border: 1px solid #dbe2ea;
            background: #fff;
            font-size: 14px;
            color: #111827;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }

          .field input::placeholder {
            color: #9ca3af;
          }

          .field input:focus {
            outline: none;
            border-color: #b65d48;
            box-shadow: 0 0 0 4px rgba(182, 93, 72, 0.12);
          }

          .error-message {
            margin-top: 14px;
            padding: 10px 12px;
            border-radius: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            font-size: 13px;
            line-height: 1.5;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 18px;
          }

          .secondary-button,
          .primary-button {
            border: none;
            border-radius: 12px;
            padding: 11px 16px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
          }

          .secondary-button {
            background: #f8fafc;
            color: #374151;
            border: 1px solid #e5e7eb;
          }

          .primary-button {
            background: #b65d48;
            color: #ffffff;
            box-shadow: 0 10px 18px rgba(182, 93, 72, 0.22);
          }

          .secondary-button:hover,
          .primary-button:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          .primary-button:disabled,
          .secondary-button:disabled {
            cursor: not-allowed;
            opacity: 0.6;
            transform: none;
          }

          @media (max-width: 640px) {
            .modal-backdrop {
              padding: 12px;
              align-items: end;
            }

            .modal-shell {
              width: 100%;
              border-radius: 18px 18px 0 0;
            }

            .field-grid {
              grid-template-columns: 1fr;
            }

            .modal-actions {
              flex-direction: column-reverse;
            }

            .secondary-button,
            .primary-button {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
