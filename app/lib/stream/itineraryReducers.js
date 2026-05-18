/**
 * Pure reducer functions for patching a cached itinerary object
 * in response to granular SSE streaming events.
 *
 * Extracted from useAgentRunStream.js for testability and separation of concerns.
 */

// ── Internal helpers ────────────────────────────────────────────────────────

function patchDayItems(itinerary, dayId, mapItems) {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;
  const days = itinerary.days.map((day) => {
    if (day?.id !== dayId) return day;
    const items = Array.isArray(day.items) ? day.items : [];
    return { ...day, items: mapItems(items) };
  });
  return { ...itinerary, days };
}

// ── Item-level reducers ─────────────────────────────────────────────────────

export function applyItineraryItemAdded(itinerary, payload) {
  return patchDayItems(itinerary, payload?.dayId, (items) => {
    if (!payload?.item) return items;
    const exists = items.some(
      (item) => item?.id && item.id === payload.item.id,
    );
    if (exists) {
      return items.map((item) =>
        item?.id === payload.item.id ? payload.item : item,
      );
    }
    return [...items, payload.item].sort(
      (a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0),
    );
  });
}

export function applyItineraryItemUpdated(itinerary, payload) {
  if (!payload?.item) return itinerary;
  return patchDayItems(itinerary, payload?.dayId, (items) =>
    items.map((item) =>
      item?.id === payload.item.id ? { ...item, ...payload.item } : item,
    ),
  );
}

export function applyItineraryItemRemoved(itinerary, payload) {
  if (!itinerary) return itinerary;
  if (Array.isArray(payload?.items)) {
    return patchDayItems(itinerary, payload.dayId, () => payload.items);
  }
  return patchDayItems(itinerary, payload?.dayId, (items) =>
    items.filter((item) => item?.id !== payload?.itemId),
  );
}

export function applyItineraryItemMoved(itinerary, payload) {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;
  const days = itinerary.days.map((day) => {
    if (day?.id === payload?.fromDayId && Array.isArray(payload?.fromItems)) {
      return { ...day, items: payload.fromItems };
    }
    if (day?.id === payload?.toDayId && Array.isArray(payload?.toItems)) {
      return { ...day, items: payload.toItems };
    }
    return day;
  });
  return { ...itinerary, days };
}

// ── Day-level reducers ──────────────────────────────────────────────────────

export function applyItineraryDayAdded(itinerary, payload) {
  if (!itinerary || !payload?.day) return itinerary;
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const exists = days.some((day) => day?.id === payload.day.id);
  const next = exists
    ? days.map((day) => (day?.id === payload.day.id ? payload.day : day))
    : [...days, payload.day];
  next.sort(
    (a, b) => Number(a?.dayNumber ?? 0) - Number(b?.dayNumber ?? 0),
  );
  return { ...itinerary, days: next };
}

export function applyItineraryDayUpdated(itinerary, payload) {
  if (!itinerary || !payload?.day) return itinerary;
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  return {
    ...itinerary,
    days: days.map((day) =>
      day?.id === payload.day.id ? { ...day, ...payload.day } : day,
    ),
  };
}

export function applyItineraryDayRemoved(itinerary, payload) {
  if (!itinerary) return itinerary;
  if (Array.isArray(payload?.days)) {
    return { ...itinerary, days: payload.days };
  }
  return {
    ...itinerary,
    days: (itinerary.days || []).filter(
      (day) => day?.id !== payload?.dayId,
    ),
  };
}
