"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import prototypeData from "./prototype-data";
import { usePrototypeState } from "./prototype-state";

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
  } = usePrototypeState();

  // If arriving from /login with ?authenticated=1, skip landing and go to trip-brief
  useEffect(() => {
    const isAuthenticated = searchParams.get("authenticated");
    const user = typeof window !== "undefined" && localStorage.getItem("voyage-user");
    if (isAuthenticated && user) {
      setActiveScreen("trip-brief");
    }
  }, [searchParams, setActiveScreen]);

  const currentScreen = activeScreen === "landing" ? "welcome" : activeScreen;
  const currentWorkspaceTab =
    activeWorkspaceTab === "overview" || activeWorkspaceTab === "itinerary" ? "trip" : activeWorkspaceTab;

  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0];
  const selectedPlace = prototypeData.mapPlaces.find((place) => place.id === selectedPlaceId) || prototypeData.mapPlaces[0];

  return (
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />

      <section className="wireframe-section">
        {currentScreen === "welcome" && <LandingPage onStart={() => router.push("/login")} />}

        {currentScreen === "trip-brief" && (
          <HomePage onContinue={() => setActiveScreen("agent-kickoff")} tripBrief={tripBrief} />
        )}

        {currentScreen === "agent-kickoff" && (
          <AgentKickoffScreen onOpenWorkspace={() => setActiveScreen("workspace")} tripBrief={tripBrief} />
        )}

        {currentScreen === "workspace" && (
          <WorkspaceScreen
            activeWorkspaceTab={currentWorkspaceTab}
            agentMessages={agentMessages}
            days={days}
            onReviewTrip={() => setActiveScreen("review")}
            onSelectDay={setSelectedDayId}
            onSelectPlace={setSelectedPlaceId}
            onTabChange={(tab) => {
              setActiveWorkspaceTab(tab);
              if (tab === "map" && !selectedPlaceId) setSelectedPlaceId(prototypeData.mapPlaces[0].id);
            }}
            selectedDay={selectedDay}
            selectedDayId={selectedDayId}
            selectedPlace={selectedPlace}
            tripBrief={tripBrief}
          />
        )}

        {currentScreen === "review" && (
          <ReviewScreen
            days={days}
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
