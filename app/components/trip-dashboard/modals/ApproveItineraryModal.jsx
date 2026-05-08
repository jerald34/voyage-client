"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./ApproveItineraryModal.css";

const normalizeText = (v) => (typeof v === "string" ? v.trim() : "");
const normalizeNum = (v) => { const t = normalizeText(v); return t ? (Number.isFinite(Number(t)) ? Number(t) : undefined) : undefined; };
const formatVal = (v) => (typeof v === "number" && Number.isFinite(v)) ? String(v) : (typeof v === "string" ? v : "");
const formatDate = (v) => { const i = formatVal(v); return i ? (i.includes("T") ? i.split("T")[0] : i.slice(0, 10)) : ""; };

export default function ApproveItineraryModal({ itinerary, isSaving, error, onCancel, onSubmit }) {
  const initialValues = useMemo(() => {
    const trip = itinerary?.trip ?? {};
    return {
      clientName: normalizeText(trip.clientName),
      destination: normalizeText(trip.destination) || normalizeText(trip.destinationSummary) || normalizeText(itinerary?.title ?? ""),
      startDate: formatDate(trip.startDate),
      endDate: formatDate(trip.endDate),
      travelerCount: formatVal(trip.travelerCount),
      budgetLevel: normalizeText(trip.budgetLevel),
    };
  }, [itinerary]);

  const [formState, setFormState] = useState(initialValues);
  useEffect(() => setFormState(initialValues), [initialValues]);

  const canSubmit = Boolean(normalizeText(formState.clientName) && normalizeText(formState.destination) && !isSaving);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit?.({
      clientName: normalizeText(formState.clientName),
      destination: normalizeText(formState.destination),
      startDate: normalizeText(formState.startDate) || null,
      endDate: normalizeText(formState.endDate) || null,
      travelerCount: normalizeNum(formState.travelerCount),
      budgetLevel: normalizeText(formState.budgetLevel) || undefined,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-shell" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div><p className="eyebrow">Draft approval</p><h2>Save draft to client</h2></div>
          <button type="button" className="close-button" onClick={onCancel}>x</button>
        </header>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field"><span>Client name</span><input type="text" value={formState.clientName} onChange={(e) => setFormState({...formState, clientName: e.target.value})} required placeholder="Enter client name" /></label>
            <label className="field"><span>Destination</span><input type="text" value={formState.destination} onChange={(e) => setFormState({...formState, destination: e.target.value})} required placeholder="Enter destination" /></label>
            <label className="field"><span>Start date</span><input type="date" value={formState.startDate} onChange={(e) => setFormState({...formState, startDate: e.target.value})} /></label>
            <label className="field"><span>End date</span><input type="date" value={formState.endDate} onChange={(e) => setFormState({...formState, endDate: e.target.value})} /></label>
            <label className="field"><span>Travelers</span><input type="number" min="1" value={formState.travelerCount} onChange={(e) => setFormState({...formState, travelerCount: e.target.value})} placeholder="Optional" /></label>
            <label className="field"><span>Budget</span><input type="text" value={formState.budgetLevel} onChange={(e) => setFormState({...formState, budgetLevel: e.target.value})} placeholder="Optional" /></label>
          </div>
          {error && <div className="error-message">{typeof error === "string" ? error : error?.message || "Unable to save draft."}</div>}
          <footer className="modal-actions">
            <button type="button" className="secondary-button" onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={!canSubmit}>{isSaving ? "Saving..." : "Save client plan"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
