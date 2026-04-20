import { useState } from "react";

import {
  initialAgentMessages,
  initialItineraryDays,
  initialTripBrief,
  prototypeWorkspaceTabs,
} from "./prototype-data";

export function usePrototypeState() {
  const [activeScreen, setActiveScreen] = useState("landing");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(prototypeWorkspaceTabs[0].id);
  const [tripBrief, setTripBrief] = useState(initialTripBrief);
  const [days, setDays] = useState(initialItineraryDays);
  const [selectedDayId, setSelectedDayId] = useState(initialItineraryDays[0]?.id ?? null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [agentMessages, setAgentMessages] = useState(initialAgentMessages);

  return {
    activeScreen,
    setActiveScreen,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    tripBrief,
    setTripBrief,
    days,
    setDays,
    selectedDayId,
    setSelectedDayId,
    selectedPlaceId,
    setSelectedPlaceId,
    agentMessages,
    setAgentMessages,
  };
}

export default usePrototypeState;
