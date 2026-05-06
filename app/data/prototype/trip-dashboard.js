import { initialAgencyPortfolioTrips } from "./agency-portfolio.js";

export const prototypeWorkspaceTabs = [
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "map", label: "Map" },
  { id: "agent", label: "Agent" },
];

export const initialTripBrief = {
  destination: "Olongapo City, Zambales",
  travelWindow: "May 12-17, 2026",
  travelers: 2,
  pace: "Balanced with room for city walks and Subic Bay views",
  budget: "Mid-range",
  priority: "Subic Bay history, city landmarks, and nearby coastal stops",
};

export const initialItineraryDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival and city orientation",
    note: "Start with a light first evening around the civic core and shoreline.",
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
        district: "City center",
        time: "15:00",
        completed: false,
      },
      {
        id: "day-1-loc-3",
        name: "Subic Bay Boardwalk sunset walk",
        district: "Waterfront",
        time: "20:00",
        completed: false,
      },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "History and barangay routes",
    note: "Explore the city's civic story and a few of its 17 barangays.",
    locations: [
      {
        id: "day-2-loc-1",
        name: "Olongapo City Hall",
        district: "City center",
        time: "09:00",
        completed: false,
      },
      {
        id: "day-2-loc-2",
        name: "Rizal Triangle",
        district: "West Bajac-Bajac",
        time: "11:00",
        completed: false,
      },
      {
        id: "day-2-loc-3",
        name: "Local lunch and market stop",
        district: "Kalaklan",
        time: "19:30",
        completed: false,
      },
    ],
  },
  {
    id: "day-3",
    label: "Day 3",
    title: "Subic Bay shoreline",
    note: "Use the coast for the slower reset and the best water views.",
    locations: [
      {
        id: "day-3-loc-1",
        name: "Subic Bay boardwalk morning loop",
        district: "Transit",
        time: "09:30",
        completed: false,
      },
      {
        id: "day-3-loc-2",
        name: "Harbor Point lunch stop",
        district: "Waterfront",
        time: "13:00",
        completed: false,
      },
      {
        id: "day-3-loc-3",
        name: "Subic Bay hillside sunset viewpoint",
        district: "Subic Bay",
        time: "18:30",
        completed: false,
      },
    ],
  },
];

export const initialMapPlaces = [
  {
    id: "place-1",
    name: "Subic Bay",
    district: "Waterfront",
    note: "Anchor the trip with the bayfront and the city's shoreline identity.",
  },
  {
    id: "place-2",
    name: "Rizal Triangle",
    district: "West Bajac-Bajac",
    note: "Cluster civic and walking stops here for an easy route through the center.",
  },
  {
    id: "place-3",
    name: "City barangay loop",
    district: "17 barangays",
    note: "Use as the late-afternoon reset point for a neighborhood-focused itinerary.",
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
  agencyPortfolioTrips: initialAgencyPortfolioTrips,
};

export default prototypeData;
