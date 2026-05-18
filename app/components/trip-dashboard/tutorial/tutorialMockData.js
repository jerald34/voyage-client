export const TUTORIAL_ITINERARY_ID_PREFIX = "__tutorial_itinerary_";

export const TUTORIAL_MOCK_TRIPS = [
  {
    id: "__tutorial_trip_1__",
    itineraryId: "__tutorial_itinerary_1__",
    clientName: "Emma Laurent",
    destination: "Amalfi Coast",
    startDate: "2025-09-10",
    endDate: "2025-09-17",
    isSaved: true,
    approvalStatus: "client approved",
    travelerCount: 2,
  },
  {
    id: "__tutorial_trip_2__",
    itineraryId: "__tutorial_itinerary_2__",
    clientName: "Emma Laurent",
    destination: "Sicily",
    startDate: "2025-11-03",
    endDate: "2025-11-10",
    isSaved: true,
    approvalStatus: "saved",
    travelerCount: 2,
  },
  {
    id: "__tutorial_trip_3__",
    itineraryId: "__tutorial_itinerary_3__",
    clientName: "Marco Delgado",
    destination: "Lisbon",
    startDate: "2025-10-05",
    endDate: "2025-10-12",
    isSaved: true,
    approvalStatus: "approved",
    travelerCount: 4,
  },
];

export const TUTORIAL_MOCK_FULL_ITINERARY = {
  title: "Amalfi Coast · 7 Days",
  summary: "A curated week along Italy’s southern coastline.",
  trip: {
    startDate: "2025-09-10",
    endDate: "2025-09-17",
    travelerCount: 2,
  },
  days: [
    {
      id: "mock-day-1",
      dayNumber: 1,
      title: "Arrival & Positano",
      date: "2025-09-10",
      items: [
        {
          id: "mock-item-1",
          title: "Le Sirenuse",
          type: "accommodation",
          time: "3:00 PM",
          description: "Iconic cliffside hotel with views over Positano.",
          lat: 40.6281,
          lng: 14.4843,
          placeSnapshot: {
            name: "Le Sirenuse",
            formattedAddress: "Via Cristoforo Colombo 30, Positano",
            rating: "4.9",
          },
        },
        {
          id: "mock-item-2",
          title: "Ristorante Max",
          type: "restaurant",
          time: "8:00 PM",
          description: "Terrace dinner with panoramic sea views.",
          lat: 40.6277,
          lng: 14.4852,
          placeSnapshot: {
            name: "Ristorante Max",
            formattedAddress: "Via dei Mulini 22, Positano",
            rating: "4.7",
          },
        },
      ],
    },
    {
      id: "mock-day-2",
      dayNumber: 2,
      title: "Ravello & Gardens",
      date: "2025-09-11",
      items: [
        {
          id: "mock-item-3",
          title: "Villa Rufolo",
          type: "attraction",
          time: "10:00 AM",
          description: "Historic gardens with sweeping coastal views.",
          lat: 40.6498,
          lng: 14.6121,
          placeSnapshot: {
            name: "Villa Rufolo",
            formattedAddress: "Piazza Duomo, Ravello",
            rating: "4.8",
          },
        },
        {
          id: "mock-item-4",
          title: "Babel Ravello",
          type: "restaurant",
          time: "1:00 PM",
          description: "Lunch overlooking the Amalfi coastline.",
          lat: 40.6491,
          lng: 14.6115,
          placeSnapshot: {
            name: "Babel Ravello",
            formattedAddress: "Via Trinità 13, Ravello",
            rating: "4.6",
          },
        },
      ],
    },
  ],
};

export const TUTORIAL_MOCK_PLANNING_OPTIONS = [
  {
    type: "draft",
    id: "__tutorial_draft_1__",
    clientName: "Emma Laurent – Amalfi Coast",
    label: "Emma Laurent – Amalfi Coast",
    destination: "Amalfi Coast",
    statusLabel: "Draft itinerary",
    threadId: "__tutorial_draft_1__",
  },
  {
    type: "trip",
    id: "__tutorial_trip_cc_1__",
    clientName: "Marco Delgado",
    label: "Marco Delgado",
    destination: "Lisbon",
    statusLabel: "Client approved",
    threadId: null,
    tripId: "__tutorial_trip_cc_1__",
  },
  {
    type: "trip",
    id: "__tutorial_trip_cc_2__",
    clientName: "Sophia Nakamura",
    label: "Sophia Nakamura",
    destination: "Kyoto & Osaka",
    statusLabel: "Approved",
    threadId: null,
    tripId: "__tutorial_trip_cc_2__",
  },
];

export const TUTORIAL_MOCK_TRIP_STATE = {
  threadId: "__tutorial_draft_1__",
  loaded: true,
  messages: [
    {
      id: "mock-msg-1",
      role: "user",
      content: "Plan a 7-day trip to the Amalfi Coast for a couple. They love boutique hotels, coastal hikes, and local cuisine.",
    },
    {
      id: "mock-msg-2",
      role: "assistant",
      content: "I’ve drafted a 7-day Amalfi Coast itinerary starting in Positano with Le Sirenuse, then moving through Ravello’s gardens, a private boat tour of the Emerald Grotto, and finishing with a cooking class in Minori. Each day balances scenic walks with long lunches at cliffside restaurants. Want me to adjust the pacing or swap any stops?",
    },
  ],
  itinerary: {
    title: "Amalfi Coast · 7 Days",
    trip: {
      startDate: "2025-09-10",
      endDate: "2025-09-17",
      travelerCount: 2,
      destination: "Amalfi Coast",
    },
    days: [
      {
        id: "cc-mock-day-1",
        dayNumber: 1,
        title: "Arrival & Positano",
        items: [
          {
            id: "cc-mock-item-1",
            title: "Le Sirenuse",
            type: "accommodation",
            lat: 40.6281,
            lng: 14.4843,
          },
          {
            id: "cc-mock-item-2",
            title: "Ristorante Max",
            type: "restaurant",
            lat: 40.6277,
            lng: 14.4852,
          },
        ],
      },
      {
        id: "cc-mock-day-2",
        dayNumber: 2,
        title: "Ravello & Gardens",
        items: [
          {
            id: "cc-mock-item-3",
            title: "Villa Rufolo",
            type: "attraction",
            lat: 40.6498,
            lng: 14.6121,
          },
        ],
      },
    ],
  },
};
