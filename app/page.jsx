"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import prototypeData from "./data/prototype/trip-dashboard.js";
import { usePrototypeState } from "./hooks/usePrototypeState.js";
import { useTripDashboard } from "./hooks/useTripDashboard.js";
import { fetchApi } from "./lib/api";

import LandingPage from "./components/landing/LandingPage.jsx";
import HomePage from "./components/trip-dashboard/HomePage.jsx";
import AgentKickoffScreen from "./components/agent/AgentKickoffScreen.jsx";
import WorkspaceScreen from "./components/workspace/WorkspaceScreen.jsx";
import ReviewScreen from "./components/review/ReviewScreen.jsx";
import ShareScreen from "./components/share/ShareScreen.jsx";

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticatedParam = searchParams.get("authenticated");
  const [shouldBypassLanding, setShouldBypassLanding] = useState(false);
  const [user, setUser] = useState(null);
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

  useEffect(() => {
    if (authenticatedParam !== "1") return;

    // Always try to fetch fresh user data (includes memberships).
    // Fall back to cached data if the fetch fails.
    let cancelled = false;
    fetchApi("/auth/me")
      .then((data) => {
        if (cancelled) return;
        localStorage.setItem("voyage-user", JSON.stringify(data.user));
        setUser(data.user);
        setShouldBypassLanding(true);
      })
      .catch(() => {
        // Fetch failed — try to use cached user as fallback.
        const storedUser = typeof window !== "undefined" ? localStorage.getItem("voyage-user") : null;
        if (!cancelled && storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch {}
          setShouldBypassLanding(true);
        }
      });

    return () => { cancelled = true; };
  }, [authenticatedParam]);

  useEffect(() => {
    if (shouldBypassLanding && activeScreen === "landing") {
      setActiveScreen("trip-brief");
    }
  }, [activeScreen, setActiveScreen, shouldBypassLanding]);

  const currentScreen = activeScreen === "landing" ? "welcome" : activeScreen;
  const currentWorkspaceTab =
    activeWorkspaceTab === "overview" || activeWorkspaceTab === "itinerary" ? "trip" : activeWorkspaceTab;

  const selectedDay = dashboard.days.find((day) => day.id === selectedDayId) || dashboard.days[0] || null;
  const effectiveSelectedDayId = selectedDay?.id ?? null;
  const selectedPlace = mapPlaces.find((place) => place.id === selectedPlaceId) || null;

  if (currentScreen === "trip-brief") {
    return (
      <HomePage
        user={user}
        agencyTrips={[]}
        onContinue={() => setActiveScreen("agent-kickoff")}
        onOpenTrip={() => {
          setActiveWorkspaceTab("trip");
          setActiveScreen("workspace");
        }}
      />
    );
  }

  return (
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />

      <section className="wireframe-section">
        {currentScreen === "welcome" && <LandingPage onStart={() => router.push("/login")} />}

        {currentScreen === "agent-kickoff" && (
          <AgentKickoffScreen onOpenWorkspace={() => setActiveScreen("workspace")} tripBrief={tripBrief} />
        )}

        {currentScreen === "workspace" && (
          <WorkspaceScreen
            activeWorkspaceTab={currentWorkspaceTab}
            agentMessages={agentMessages}
            days={dashboard.days}
            mapPlaces={mapPlaces}
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
