export const HOME_TOUR_STORAGE_KEY = "voyage-home-tour-completed-v1";

export const homeTourSteps = [
  {
    id: "new-itinerary",
    target: "new-itinerary",
    placement: "bottom",
    title: "Create a new itinerary",
    description:
      "Start a fresh trip draft from the dashboard header without leaving the current workspace.",
    bullets: [
      "Use this when a new client inquiry comes in.",
      "Voyage creates a draft thread you can refine before approval.",
    ],
  },
  {
    id: "client-switcher",
    target: "client-switcher",
    placement: "bottom",
    title: "Switch active clients",
    description:
      "Jump between live trips and draft threads from the same control so the workspace follows the selected client.",
    bullets: [
      "The selected client controls the chat, itinerary, and map state.",
      "Open the menu to move to another active planning item.",
    ],
  },
  {
    id: "workspace",
    target: "workspace",
    placement: "right",
    title: "Work in the planning space",
    description:
      "Use the command center to chat with Voyage, review draft updates, and keep the itinerary work in one place.",
    bullets: [
      "Send adjustments through the chat composer.",
      "Watch itinerary updates and tool activity as they happen.",
    ],
  },
  {
    id: "map-context",
    target: "workspace-map",
    placement: "left",
    title: "Use the map context",
    description:
      "The live map stays behind the workspace so routes, stops, and place context remain visible while planning.",
    bullets: [
      "Use map pins to keep the trip geography visible.",
      "The map updates with the active itinerary and streaming results.",
    ],
  },
  {
    id: "replay-help",
    target: "settings-replay",
    placement: "right",
    title: "Replay the guide later",
    description:
      "Settings keeps the tutorial available after first use, so users can reopen the same guided walkthrough whenever they need it.",
    bullets: [
      "Open Settings from the sidebar.",
      "Use Replay tutorial to run this guided tour again.",
    ],
  },
];

export const homeTourHelpBullets = [
  "You only see the tour once unless you replay it from Settings.",
  "The tour highlights real controls on the dashboard one step at a time.",
  "Settings keeps the same help content in one permanent place.",
];
