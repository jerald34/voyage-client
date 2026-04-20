export const prototypeEntryActions = [
  {
    id: "start-planning",
    label: "Start planning",
    description: "Open the workspace and begin shaping a new trip brief.",
    targetScreen: "workspace",
  },
  {
    id: "install-app",
    label: "Install app",
    description: "Install the mobile experience for trip access on the go.",
    targetScreen: "install",
  },
  {
    id: "voyage-agent",
    label: "Voyage agent",
    description: "Open the planning assistant to refine the trip with natural language.",
    targetScreen: "agent",
  },
];

export const prototypeWorkspaceTabs = [
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "map", label: "Map" },
  { id: "agent", label: "Agent" },
];

export const initialTripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
  travelers: 2,
  pace: "Balanced with room for slow mornings",
  budget: "Mid-range",
  priority: "Food, architecture, and a few beach hours",
};

export const initialItineraryDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival and settle in",
    stops: ["Airport transfer", "Hotel check-in", "Late dinner in Eixample"],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city exploration",
    stops: ["Breakfast near the Gothic Quarter", "Cathedral walk", "Tapas crawl"],
  },
  {
    id: "day-3",
    label: "Day 3",
    title: "Gaudi and seaside",
    stops: ["Sagrada Familia", "Park Guell", "Beach sunset"],
  },
];

export const initialMapPlaces = [
  {
    id: "place-1",
    name: "Sagrada Familia",
    district: "Eixample",
    note: "Anchor the second day with an early visit.",
  },
  {
    id: "place-2",
    name: "Gothic Quarter",
    district: "Ciutat Vella",
    note: "Cluster walking stops and lunch here.",
  },
  {
    id: "place-3",
    name: "Barceloneta Beach",
    district: "Coast",
    note: "Use as the late-afternoon reset point.",
  },
];

export const initialAgentMessages = [
  {
    id: "agent-1",
    role: "assistant",
    text: "I can turn a short trip brief into a day-by-day plan.",
  },
  {
    id: "agent-2",
    role: "assistant",
    text: "Tell me your destination, pace, and must-see stops, and I'll organize the route.",
  },
];

export const prototypeData = {
  entryActions: prototypeEntryActions,
  workspaceTabs: prototypeWorkspaceTabs,
  tripBrief: initialTripBrief,
  itineraryDays: initialItineraryDays,
  mapPlaces: initialMapPlaces,
  agentMessages: initialAgentMessages,
};

export default prototypeData;
