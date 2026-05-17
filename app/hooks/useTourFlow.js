// Tour/first-use tutorial flow: open-on-first-load, step progression, persistence.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  VOYAGE_TOUR_STORAGE_KEY,
  voyageTourSteps,
} from "../components/trip-dashboard/tutorial/tutorialContent.js";

export function useTourFlow({ user, cipTourState, setActiveTab, setIsSidebarOpen }) {
  const [isFirstUseTutorialOpen, setIsFirstUseTutorialOpen] = useState(false);
  const [activeTourSteps, setActiveTourSteps] = useState(voyageTourSteps);
  const [tourMobilePaneOverride, setTourMobilePaneOverride] = useState(null);
  const [tourGlassSheetSnap, setTourGlassSheetSnap] = useState(null);

  const visibleTourSteps = useMemo(() => {
    return voyageTourSteps.filter((step) => {
      if (step.target === "cip-trip-selector") return cipTourState.hasMultipleTrips;
      if (step.target === "cip-day-strip") return cipTourState.hasItineraryDays;
      if (step.target === "cip-actions") return cipTourState.hasSelectedClient;
      return true;
    });
  }, [cipTourState]);

  useEffect(() => {
    if (!user) return;
    const hasSeenTutorial = typeof window !== "undefined"
      && localStorage.getItem(VOYAGE_TOUR_STORAGE_KEY) === "true";
    if (!hasSeenTutorial) {
      setActiveTourSteps(voyageTourSteps);
      setIsFirstUseTutorialOpen(true);
    }
  }, [user]);

  const closeFirstUseTutorial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(VOYAGE_TOUR_STORAGE_KEY, "true");
    }
    setIsFirstUseTutorialOpen(false);
    setTourMobilePaneOverride(null);
    setTourGlassSheetSnap(null);
  }, []);

  const replayFirstUseTutorial = useCallback(() => {
    setActiveTab("command-center");
    const snapshot = cipTourState.hasSelectedClient
      ? voyageTourSteps.filter((step) => {
          if (step.target === "cip-trip-selector") return cipTourState.hasMultipleTrips;
          if (step.target === "cip-day-strip") return cipTourState.hasItineraryDays;
          return true;
        })
      : voyageTourSteps;
    setActiveTourSteps(snapshot);
    setIsFirstUseTutorialOpen(true);
  }, [cipTourState, setActiveTab]);

  const handleFirstUseTutorialStepChange = useCallback((step) => {
    if (step?.tab) {
      setActiveTab((current) => (current === step.tab ? current : step.tab));
    }
    if (step?.target === "cip-client-directory") {
      setTourMobilePaneOverride("list");
    } else if (
      step?.target === "cip-workspace" ||
      step?.target === "cip-trip-selector" ||
      step?.target === "cip-day-strip" ||
      step?.target === "cip-actions"
    ) {
      setTourMobilePaneOverride("detail");
    } else {
      setTourMobilePaneOverride(null);
    }
    if (step?.target === "workspace-chat") {
      setTourGlassSheetSnap("half");
    } else if (step?.target === "workspace-map") {
      setTourGlassSheetSnap("peek");
    } else {
      setTourGlassSheetSnap(null);
    }
    if (step?.target === "settings-replay") {
      setIsSidebarOpen(true);
    }
  }, [setActiveTab, setIsSidebarOpen]);

  return {
    isFirstUseTutorialOpen,
    activeTourSteps,
    tourMobilePaneOverride,
    tourGlassSheetSnap,
    visibleTourSteps,
    closeFirstUseTutorial,
    replayFirstUseTutorial,
    handleFirstUseTutorialStepChange,
  };
}
