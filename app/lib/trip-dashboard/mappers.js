export function normalizeLocation(location, index) {
  const normalizedName = String(location?.name ?? "").trim();
  const normalizedDistrict = String(location?.district ?? "").trim();
  const normalizedTime = String(location?.time ?? "").trim();
  return {
    id: location?.id ?? `location-${index + 1}`,
    name: normalizedName || "Untitled stop",
    district: normalizedDistrict,
    time: normalizedTime,
    completed: location?.completed === true,
  };
}

export function normalizeDay(day, index) {
  const normalizedTitle = String(day?.title ?? "").trim();
  return {
    id: day?.id ?? `day-${index + 1}`,
    label: day?.label ?? `Day ${index + 1}`,
    title: normalizedTitle || "Planning in progress",
    note: day?.note ?? "",
    locations: Array.isArray(day?.locations) ? day.locations.map(normalizeLocation) : [],
  };
}
