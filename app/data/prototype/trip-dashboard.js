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
    note: "Keep the first evening light and walkable.",
    locations: [
      {
        id: "day-1-loc-1",
        name: "Airport transfer",
        district: "Transit",
        time: "13:30",
        completed: true,
      },
      {
        id: "day-1-loc-2",
        name: "Hotel check-in",
        district: "Eixample",
        time: "15:00",
        completed: false,
      },
      {
        id: "day-1-loc-3",
        name: "Late dinner in Eixample",
        district: "Eixample",
        time: "20:00",
        completed: false,
      },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city exploration",
    note: "Stack the walking stops close together.",
    locations: [
      {
        id: "day-2-loc-1",
        name: "Breakfast near the Gothic Quarter",
        district: "Ciutat Vella",
        time: "09:00",
        completed: false,
      },
      {
        id: "day-2-loc-2",
        name: "Cathedral walk",
        district: "Ciutat Vella",
        time: "11:00",
        completed: false,
      },
      {
        id: "day-2-loc-3",
        name: "Tapas crawl",
        district: "Ciutat Vella",
        time: "19:30",
        completed: false,
      },
    ],
  },
  {
    id: "day-3",
    label: "Day 3",
    title: "Gaudi and seaside",
    note: "Use the beach as the late-afternoon reset point.",
    locations: [
      {
        id: "day-3-loc-1",
        name: "Sagrada Familia",
        district: "Eixample",
        time: "09:30",
        completed: false,
      },
      {
        id: "day-3-loc-2",
        name: "Park Guell",
        district: "Gracia",
        time: "13:00",
        completed: false,
      },
      {
        id: "day-3-loc-3",
        name: "Beach sunset",
        district: "Barceloneta",
        time: "18:30",
        completed: false,
      },
    ],
  },
];

export const initialMapPlaces = [
  {
    id: "place-1",
    name: "Sagrada Familia",
    district: "Eixample",
    note: "Anchor the second full day with an early entry.",
  },
  {
    id: "place-2",
    name: "Gothic Quarter",
    district: "Ciutat Vella",
    note: "Cluster lunch and walking stops here.",
  },
  {
    id: "place-3",
    name: "Barceloneta Beach",
    district: "Barceloneta",
    note: "Use as the late-afternoon reset point.",
  },
];

export const initialAgentMessages = [
  { id: "agent-1", role: "assistant", text: "I can turn a short trip brief into a day-by-day plan." },
  {
    id: "agent-2",
    role: "assistant",
    text: "Tell me your destination, pace, and must-see stops, and I'll organize the route.",
  },
];

export const prototypeData = {
  workspaceTabs: prototypeWorkspaceTabs,
  tripBrief: initialTripBrief,
  itineraryDays: initialItineraryDays,
  mapPlaces: initialMapPlaces,
  agentMessages: initialAgentMessages,
};

export default prototypeData;
