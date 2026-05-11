"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import prototypeData from "./data/prototype/trip-dashboard.js";
import { usePrototypeState } from "./hooks/usePrototypeState.js";
import { useTripDashboard } from "./hooks/useTripDashboard.js";
import { useAuth } from "./hooks/useAuth.js";
import { fetchApi } from "./lib/api";

import LandingPage from "./components/landing/LandingPage.jsx";
import HomePage from "./components/trip-dashboard/HomePage.jsx";
import AgentKickoffScreen from "./components/agent/AgentKickoffScreen.jsx";
import WorkspaceScreen from "./components/workspace/WorkspaceScreen.jsx";
import ReviewScreen from "./components/review/ReviewScreen.jsx";
import ShareScreen from "./components/share/ShareScreen.jsx";
import AgencyStatusScreen from "./components/agency-status/AgencyStatusScreen.jsx";

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const authenticatedParam = searchParams.get("authenticated");
  const [shouldBypassLanding, setShouldBypassLanding] = useState(false);
  const [user, setUser] = useState(null);
  const [agencyStatus, setAgencyStatus] = useState(null); // null | { status, name, rejectionReason, suspensionReason }
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

    let cancelled = false;
    fetchApi("/auth/me")
      .then((data) => {
        if (cancelled) return;

        localStorage.setItem("voyage-user", JSON.stringify(data.user));
        setUser(data.user);

        const hasMembership = Array.isArray(data.user?.memberships) && data.user.memberships.length > 0;
        if (!hasMembership) {
          // No agency — redirect to registration wizard step 2
          router.push("/login?step=agency");
          return;
        }

        const membership = data.user.memberships[0];
        const agency = membership.agency;

        if (agency && agency.status !== "VERIFIED") {
          // Agency not yet verified — show status screen
          setAgencyStatus(agency);
          setShouldBypassLanding(true);
          return;
        }

        // Agency is verified — proceed to dashboard
        setShouldBypassLanding(true);
      })
      .catch(() => {
        const storedUser = typeof window !== "undefined" ? localStorage.getItem("voyage-user") : null;
        if (!cancelled && storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setShouldBypassLanding(true);
          } catch {}
        }
      });

    return () => { cancelled = true; };
  }, [authenticatedParam, router]);

  useEffect(() => {
    if (shouldBypassLanding && activeScreen === "landing") {
      setActiveScreen("trip-brief");
    }
  }, [activeScreen, setActiveScreen, shouldBypassLanding]);

  // Show agency status screen for non-verified agencies
  if (agencyStatus && agencyStatus.status !== "VERIFIED") {
    return <AgencyStatusScreen agency={agencyStatus} user={user} onLogout={logout} />;
  }

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
    <main className="w-full max-w-[1320px] mx-auto px-5 pt-7 pb-[72px] min-h-screen">
      <div className="system-grain" aria-hidden="true" />

      <section className="[animation:fade-in_0.55s_ease]">
        {currentScreen === "welcome" && <LandingPage onLogin={() => router.push("/login")} onContinue={() => router.push("/login")} />}

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
