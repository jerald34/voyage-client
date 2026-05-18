/**
 * Tool label generation for the agent live-work display.
 * Extracted from useAgentRunStream.js.
 */

function humanizeToolName(name) {
  return String(name || "")
    .replace(/[_\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a human-readable label for an active tool call.
 */
export function buildActiveToolLabel(tool) {
  const name = String(tool?.name || "").trim();
  const input = tool?.input ?? {};

  if (name === "map_pinpoint" || name === "map.pinpoint") {
    const placeName = String(
      input?.placeName || input?.name || "",
    ).trim();
    if (placeName) return `Geocoding ${placeName}...`;
    return "Geocoding location...";
  }

  if (
    name === "route_logistics" ||
    name === "route.estimate" ||
    name === "route"
  ) {
    const origin = String(
      input?.originPlaceName || input?.origin?.name || "",
    ).trim();
    const destination = String(
      input?.destinationPlaceName || input?.destination?.name || "",
    ).trim();
    if (origin && destination)
      return `Computing route logistics: ${origin} -> ${destination}...`;
    return "Computing route logistics...";
  }

  const displayName = humanizeToolName(name);
  if (displayName) {
    return `${displayName}...`;
  }

  return "Running tool...";
}
