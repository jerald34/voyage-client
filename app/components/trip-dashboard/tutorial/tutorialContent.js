export const HOME_TOUR_STORAGE_KEY = "voyage-home-tour-completed-v1";

export const homeTourSteps = [
  {
    id: "home-header",
    title: "Start on the homepage",
    description:
      "Use the homepage as your control room. Create a new itinerary, switch between active clients, and see the current trip state before you start editing.",
    bullets: [
      "Tap New Itinerary to create a fresh draft.",
      "Use the client switcher to jump between trips.",
      "The header shows whether the agent is streaming or idle.",
    ],
    captureTarget: "home-header",
    fallbackImage: "/tutorial/home-tour-1.svg",
    alt: "Live capture of the homepage controls",
  },
  {
    id: "workspace",
    title: "Plan inside the workspace",
    description:
      "The workspace keeps chat, itinerary, and map context together so you can refine the trip without losing the story of the plan.",
    bullets: [
      "Chat with the agent to adjust stops and timing.",
      "Follow the itinerary as it updates in real time.",
      "Use the map to see how the trip fits together.",
    ],
    captureTarget: "workspace",
    fallbackImage: "/tutorial/home-tour-2.svg",
    alt: "Live capture of the itinerary workspace",
  },
  {
    id: "replay-help",
    title: "Review and replay later",
    description:
      "When the itinerary is ready, use the review tools, then come back to Settings any time to replay this guide.",
    bullets: [
      "Check the itinerary summary before approval.",
      "Use the review screen to validate the final plan.",
      "Open Settings anytime for help and replay.",
    ],
    captureTarget: "workspace",
    fallbackImage: "/tutorial/home-tour-3.svg",
    alt: "Live capture of the dashboard help flow",
  },
];

export const homeTourHelpBullets = [
  "You only see the tour once unless you replay it from Settings.",
  "The tour captures mounted dashboard sections so the visuals match the current interface.",
  "Settings keeps the same help content in one permanent place.",
];
