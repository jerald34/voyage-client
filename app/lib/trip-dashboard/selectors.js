import { getDayProgress } from "./progress.js";

function isPlaceholderDay(day) {
  return day?.isPlaceholder === true;
}

export function getNextActiveDay(days) {
  const safeDays = Array.isArray(days) ? days : [];

  return safeDays.find((day) => {
    const progress = getDayProgress(day);
    return !isPlaceholderDay(day) && !progress.isComplete;
  }) ?? null;
}

export function getMapHighlights(days, mapPlaces, limit = 3) {
  const safeDays = Array.isArray(days) ? days : [];
  const safeMapPlaces = Array.isArray(mapPlaces) ? mapPlaces : [];
  const normalizeKeyPart = (value) => String(value ?? "").trim().toLowerCase();
  const getHighlightKey = (name, district) => `${normalizeKeyPart(name)}|${normalizeKeyPart(district)}`;
  const placeGroupsByName = new Map();

  for (const place of safeMapPlaces) {
    const normalizedName = normalizeKeyPart(place?.name);
    if (!normalizedName) {
      continue;
    }

    const group = placeGroupsByName.get(normalizedName) ?? [];
    group.push(place);
    placeGroupsByName.set(normalizedName, group);
  }
  const highlights = [];
  const seenKeys = new Set();

  const addHighlight = (item) => {
    const rawName = item?.name;
    const normalizedName = normalizeKeyPart(rawName);
    if (!normalizedName || highlights.length >= limit) {
      return;
    }

    const district = normalizeKeyPart(item?.district);
    const matchingPlaces = placeGroupsByName.get(normalizedName) ?? [];
    const distinctDistricts = new Set(matchingPlaces.map((place) => normalizeKeyPart(place?.district)).filter(Boolean));
    const matchingPlace = distinctDistricts.size === 1 ? matchingPlaces.find((place) => normalizeKeyPart(place?.district)) : null;
    const resolvedDistrict = district || normalizeKeyPart(matchingPlace?.district) || "route stop";
    const key = getHighlightKey(normalizedName, resolvedDistrict);
    const displayValue = String(rawName).trim();
    const labelValue = item?.district?.trim() || matchingPlace?.district?.trim() || "Route stop";

    if (
      highlights.some(
        (highlight) =>
          normalizeKeyPart(highlight.value) === normalizedName &&
          normalizeKeyPart(highlight.label) === normalizeKeyPart(resolvedDistrict),
      )
    ) {
      return;
    }

    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    highlights.push({
      label: labelValue,
      value: displayValue,
    });
  };

  safeDays
    .filter((day) => !isPlaceholderDay(day))
    .flatMap((day) => (Array.isArray(day?.locations) ? day.locations : []))
    .forEach((location) => {
      addHighlight(location);
    });

  safeMapPlaces.forEach((place) => {
    addHighlight(place);
  });

  return highlights;
}
