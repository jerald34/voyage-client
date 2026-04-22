"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import prototypeData from "./data/prototype/trip-dashboard.js";
import { usePrototypeState } from "./hooks/usePrototypeState.js";
import { useTripDashboard } from "./hooks/useTripDashboard.js";

import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import AgentKickoffScreen from "./components/AgentKickoffScreen";
import WorkspaceScreen from "./components/WorkspaceScreen";
import ReviewScreen from "./components/ReviewScreen";
import ShareScreen from "./components/ShareScreen";

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activeScreen,
    setActiveScreen,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    tripBrief,
    days,
    selectedDayId,
    setSelectedDayId,
    selectedPlaceId,
    setSelectedPlaceId,
    agentMessages,
    setDays,
  } = usePrototypeState();
  const mapPlaces = Array.isArray(prototypeData.mapPlaces) ? prototypeData.mapPlaces : [];
  const dashboard = useTripDashboard({
    days,
    setDays,
    tripBrief,
    mapPlaces,
  });

  // If arriving from /login with ?authenticated=1, skip landing and go to trip-brief
  useEffect(() => {
    const isAuthenticated = searchParams.get("authenticated");
    const user = typeof window !== "undefined" && localStorage.getItem("voyage-user");
    if (isAuthenticated === "1" && user) {
      setActiveScreen("trip-brief");
    }
  }, [searchParams, setActiveScreen]);

  const currentScreen = activeScreen === "landing" ? "welcome" : activeScreen;
  const currentWorkspaceTab =
    activeWorkspaceTab === "overview" || activeWorkspaceTab === "itinerary" ? "trip" : activeWorkspaceTab;

  const selectedDay = dashboard.days.find((day) => day.id === selectedDayId) || dashboard.days[0] || null;
  const effectiveSelectedDayId = selectedDay?.id ?? null;
  const selectedPlace = mapPlaces.find((place) => place.id === selectedPlaceId) || null;

  return (
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />

      <section className="wireframe-section">
        {currentScreen === "welcome" && <LandingPage onStart={() => router.push("/login")} />}

        {currentScreen === "trip-brief" && (
          <HomePage
            days={dashboard.days}
            mapHighlights={dashboard.mapHighlights}
            nextActiveDay={dashboard.nextActiveDay}
            onContinue={() => setActiveScreen("agent-kickoff")}
            onMarkDayDone={dashboard.markDayDone}
            onToggleLocation={dashboard.toggleLocationComplete}
            tripBrief={tripBrief}
            tripProgress={dashboard.tripProgress}
          />
        )}

        {currentScreen === "agent-kickoff" && (
          <AgentKickoffScreen onOpenWorkspace={() => setActiveScreen("workspace")} tripBrief={tripBrief} />
        )}

        {currentScreen === "workspace" && (
          <WorkspaceScreen
            activeWorkspaceTab={currentWorkspaceTab}
            agentMessages={agentMessages}
            days={dashboard.days}
            onReviewTrip={() => setActiveScreen("review")}
            onSelectDay={setSelectedDayId}
            onSelectPlace={setSelectedPlaceId}
            onTabChange={(tab) => {
              setActiveWorkspaceTab(tab);
              if (tab === "map") {
                const nextMapPlaceId = mapPlaces[0]?.id ?? null;
                if (nextMapPlaceId === null) {
                  setSelectedPlaceId(null);
                } else if (!selectedPlaceId) {
                  setSelectedPlaceId(nextMapPlaceId);
                }
              }
            }}
            selectedDay={selectedDay}
            selectedDayId={effectiveSelectedDayId}
            selectedPlace={selectedPlace}
            tripBrief={tripBrief}
          />
        )}

        {currentScreen === "review" && (
          <ReviewScreen
            days={dashboard.days}
            onBackToWorkspace={() => setActiveScreen("workspace")}
            onShare={() => setActiveScreen("share")}
            tripBrief={tripBrief}
          />
        )}

        {currentScreen === "share" && <ShareScreen onBackToWorkspace={() => setActiveScreen("workspace")} />}
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}
