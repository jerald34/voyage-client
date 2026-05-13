# Client Itinerary Saved Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ClientItineraryPage.jsx` show only approved/saved client itineraries, while draft itinerary threads remain in Command Center.

**Architecture:** Add a small pure selector module for saved itinerary filtering/grouping/selection, then keep `ClientItineraryPage.jsx` focused on view state, fetching the selected itinerary detail, and rendering the existing Voyage dashboard layout. Use focused component tests that mock the API and `ItineraryDraftPanel` so the saved portfolio behavior is tested without Google Maps or Command Center state.

**Tech Stack:** Next.js 16, React 19, plain CSS modules-by-import, Vitest, Testing Library, existing `fetchItineraryDraft` API helper.

---

## Sub-Agent Assignment

| Task | Difficulty | Assigned Model | Reason |
| --- | --- | --- | --- |
| Task 0: Branch prep | Easy | `gpt-5.4-mini` | Git-only setup. |
| Task 1: Failing tests | Mid | `gpt-5.5` | Defines saved/approved behavior and stale fetch expectations. |
| Task 2: Saved itinerary selectors | Mid | `gpt-5.5` | Data boundary must avoid leaking pending/draft trips. |
| Task 3: ClientItineraryPage behavior | Hard | `gpt-5.5` | Selection reconciliation and stale fetch handling. |
| Task 4: Current-design UI polish | Easy | `gpt-5.4-mini` | CSS and copy alignment with existing screenshots. |
| Task 5: Verification and cleanup | Easy | `gpt-5.4-mini` | Focused tests, build, status check. |
| Task 6: Final code review | Mid | `gpt-5.5` | Validate data boundary, tests, and regressions before handoff. |

## File Structure

- Create `app/lib/trip-dashboard/savedItineraries.js`
  - Owns pure saved itinerary filtering, grouping, status labeling, and selection resolution.
- Modify `app/components/trip-dashboard/pages/ClientItineraryPage.jsx`
  - Uses the selector module, reconciles selection, fetches itinerary detail, and renders saved-only UI states.
- Modify `app/components/trip-dashboard/pages/ClientItineraryPage.css`
  - Adds saved-count, status-chip, empty directory, selected card, and responsive refinements while preserving current shell styling.
- Create `tests/client-itinerary-page.test.jsx`
  - Tests saved-only filtering, grouping, selection, fetch behavior, empty state, and stale response protection.

## Task 0: Branch Prep

**Assigned model:** `gpt-5.4-mini`

**Files:**
- No file changes.

- [ ] **Step 1: Confirm clean client repo state**

Run:

```powershell
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" status --short --branch
```

Expected:

```text
## staging...origin/staging [ahead 1]
?? docs/superpowers/plans/2026-05-08-client-itinerary-saved-portfolio-plan.md
```

- [ ] **Step 2: Create a normal feature branch from current staging**

Run:

```powershell
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" switch -c feat/client-itinerary-saved-portfolio
```

Expected:

```text
Switched to a new branch 'feat/client-itinerary-saved-portfolio'
```

## Task 1: Write Saved Portfolio Failing Tests

**Assigned model:** `gpt-5.5`

**Files:**
- Create: `tests/client-itinerary-page.test.jsx`

- [ ] **Step 1: Create the focused failing test file**

Create `Voyage-Client/tests/client-itinerary-page.test.jsx` with:

```jsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ClientItineraryPage from "../app/components/trip-dashboard/pages/ClientItineraryPage.jsx";

const fetchItineraryDraftMock = vi.hoisted(() => vi.fn());

vi.mock("../app/lib/api.js", () => ({
  fetchItineraryDraft: (...args) => fetchItineraryDraftMock(...args),
}));

vi.mock("../app/components/trip-dashboard/itinerary/ItineraryDraftPanel.jsx", () => ({
  default: function MockItineraryDraftPanel({ itinerary, draftVersion, tripSummary }) {
    return (
      <section aria-label="saved itinerary detail">
        <span>{draftVersion}</span>
        <h3>{itinerary?.title ?? "Missing itinerary title"}</h3>
        <p>{tripSummary?.destination ?? "Missing destination"}</p>
      </section>
    );
  },
}));

const savedTrips = [
  {
    id: "trip-santos-olongapo",
    clientName: "Santos Family",
    destination: "Olongapo City",
    travelWindow: "May 12-17, 2026",
    approvalStatus: "Approved",
    status: "active",
    itineraryId: "itinerary-santos-1",
  },
  {
    id: "trip-santos-baguio",
    clientName: "Santos Family",
    destination: "Baguio",
    travelWindow: "June 2-5, 2026",
    approvalStatus: "Saved itinerary",
    status: "active",
    itineraryId: "itinerary-santos-2",
  },
  {
    id: "trip-reyes-cebu",
    clientName: "Reyes Group",
    destination: "Cebu",
    travelWindow: "July 9-13, 2026",
    savedAt: "2026-05-08T00:00:00.000Z",
    status: "active",
    itineraryId: "itinerary-reyes-1",
  },
];

const unsavedTrips = [
  {
    id: "trip-pending",
    clientName: "Pending Family",
    destination: "Boracay",
    travelWindow: "August 1-5, 2026",
    approvalStatus: "Awaiting itinerary approval",
    status: "active",
    itineraryId: "itinerary-pending",
  },
  {
    id: "trip-final-confirmation",
    clientName: "Almost Family",
    destination: "Bohol",
    travelWindow: "August 10-13, 2026",
    approvalStatus: "Final confirmation pending",
    status: "active",
    itineraryId: "itinerary-final-confirmation",
  },
  {
    id: "trip-approved-without-itinerary",
    clientName: "No Itinerary Client",
    destination: "Davao",
    travelWindow: "September 1-3, 2026",
    approvalStatus: "Approved",
    status: "active",
  },
  {
    id: "trip-archived",
    clientName: "Archived Client",
    destination: "Cebu",
    travelWindow: "March 1-4, 2026",
    approvalStatus: "Approved",
    status: "archived",
    itineraryId: "itinerary-archived",
  },
];

function mockItineraryFetch() {
  fetchItineraryDraftMock.mockImplementation(async (_agencyId, itineraryId) => ({
    itinerary: {
      id: itineraryId,
      title: `Saved ${itineraryId}`,
      version: itineraryId === "itinerary-santos-2" ? 2 : 1,
      days: [],
    },
  }));
}

describe("ClientItineraryPage saved itinerary portfolio", () => {
  beforeEach(() => {
    fetchItineraryDraftMock.mockReset();
    mockItineraryFetch();
  });

  it("shows only approved or saved trips with itinerary ids", async () => {
    render(<ClientItineraryPage agencyId="agency-1" agencyTrips={[...savedTrips, ...unsavedTrips]} />);

    expect(await screen.findByText("Saved itinerary v1")).toBeInTheDocument();
    expect(screen.getByText("Santos Family")).toBeInTheDocument();
    expect(screen.getAllByText("2 saved").length).toBeGreaterThan(0);
    expect(screen.getByText("Reyes Group")).toBeInTheDocument();
    expect(screen.getAllByText("1 saved").length).toBeGreaterThan(0);
    expect(screen.getByText("Olongapo City")).toBeInTheDocument();
    expect(screen.getByText("Baguio")).toBeInTheDocument();
    expect(screen.queryByText("Pending Family")).not.toBeInTheDocument();
    expect(screen.queryByText("Almost Family")).not.toBeInTheDocument();
    expect(screen.queryByText("No Itinerary Client")).not.toBeInTheDocument();
    expect(screen.queryByText("Archived Client")).not.toBeInTheDocument();
    expect(fetchItineraryDraftMock).toHaveBeenCalledWith("agency-1", "itinerary-santos-1");
  });

  it("selects a client's first saved itinerary and fetches a different itinerary when clicked", async () => {
    render(<ClientItineraryPage agencyId="agency-1" agencyTrips={savedTrips} />);

    await waitFor(() => {
      expect(fetchItineraryDraftMock).toHaveBeenCalledWith("agency-1", "itinerary-santos-1");
    });

    fireEvent.click(screen.getByRole("button", { name: /Baguio/i }));

    await waitFor(() => {
      expect(fetchItineraryDraftMock).toHaveBeenLastCalledWith("agency-1", "itinerary-santos-2");
    });
    expect(await screen.findByText("Saved itinerary v2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved itinerary-santos-2" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reyes Group/i }));

    await waitFor(() => {
      expect(fetchItineraryDraftMock).toHaveBeenLastCalledWith("agency-1", "itinerary-reyes-1");
    });
    expect(await screen.findByText("Cebu")).toBeInTheDocument();
  });

  it("shows the saved-portfolio empty state when there are no saved itineraries", () => {
    render(<ClientItineraryPage agencyId="agency-1" agencyTrips={unsavedTrips} />);

    expect(screen.getByText("Saved itineraries will appear here after approval from Command Center.")).toBeInTheDocument();
    expect(screen.getByText("No saved itineraries yet.")).toBeInTheDocument();
    expect(fetchItineraryDraftMock).not.toHaveBeenCalled();
  });

  it("shows an error without losing selected itinerary context when detail fetch fails", async () => {
    fetchItineraryDraftMock.mockRejectedValue(new Error("Network down"));

    render(<ClientItineraryPage agencyId="agency-1" agencyTrips={savedTrips.slice(0, 1)} />);

    expect(await screen.findByText("Unable to load this saved itinerary.")).toBeInTheDocument();
    expect(screen.getByText("Olongapo City")).toBeInTheDocument();
  });

  it("ignores stale itinerary fetch responses after rapid itinerary selection", async () => {
    let resolveFirst;
    let resolveSecond;
    fetchItineraryDraftMock.mockImplementation((_agencyId, itineraryId) => (
      new Promise((resolve) => {
        if (itineraryId === "itinerary-santos-1") {
          resolveFirst = resolve;
        } else {
          resolveSecond = resolve;
        }
      })
    ));

    render(<ClientItineraryPage agencyId="agency-1" agencyTrips={savedTrips.slice(0, 2)} />);

    await waitFor(() => {
      expect(fetchItineraryDraftMock).toHaveBeenCalledWith("agency-1", "itinerary-santos-1");
    });

    fireEvent.click(screen.getByRole("button", { name: /Baguio/i }));

    await waitFor(() => {
      expect(fetchItineraryDraftMock).toHaveBeenCalledWith("agency-1", "itinerary-santos-2");
    });

    resolveSecond({
      itinerary: {
        id: "itinerary-santos-2",
        title: "Current Baguio itinerary",
        version: 2,
        days: [],
      },
    });

    expect(await screen.findByRole("heading", { name: "Current Baguio itinerary" })).toBeInTheDocument();

    resolveFirst({
      itinerary: {
        id: "itinerary-santos-1",
        title: "Stale Olongapo itinerary",
        version: 1,
        days: [],
      },
    });

    await waitFor(() => {
      expect(screen.queryByText("Stale Olongapo itinerary")).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the new test file and confirm it fails**

Run:

```powershell
npm.cmd test -- tests/client-itinerary-page.test.jsx
```

Expected:

```text
FAIL  tests/client-itinerary-page.test.jsx
```

At least one failure must show pending/unapproved clients still render, missing saved-empty copy, or stale fetch protection missing.

## Task 2: Add Saved Itinerary Selectors

**Assigned model:** `gpt-5.5`

**Files:**
- Create: `app/lib/trip-dashboard/savedItineraries.js`

- [ ] **Step 1: Create the saved itinerary selector module**

Create `Voyage-Client/app/lib/trip-dashboard/savedItineraries.js` with:

```js
const ACCEPTED_SAVED_STATUSES = new Set([
  "approved",
  "approved itinerary",
  "client approved",
  "saved",
  "saved itinerary",
  "sent to client",
]);

const BLOCKED_STATUS_TERMS = [
  "awaiting",
  "pending",
  "requested changes",
  "missing",
  "needs",
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeSavedStatus(value) {
  return normalizeText(value).toLowerCase();
}

export function getStableItineraryId(trip) {
  const id = trip?.itineraryId ?? trip?.itinerary?.id ?? "";
  return normalizeText(id);
}

export function getSavedStatusLabel(trip) {
  const approvalStatus = normalizeText(trip?.approvalStatus);
  if (approvalStatus && isAcceptedSavedStatus(approvalStatus)) return approvalStatus;

  const itineraryStatus = normalizeText(trip?.itineraryStatus);
  if (itineraryStatus && isAcceptedSavedStatus(itineraryStatus)) return itineraryStatus;

  return "Saved itinerary";
}

function isAcceptedSavedStatus(value) {
  const status = normalizeSavedStatus(value);
  if (!status) return false;
  if (BLOCKED_STATUS_TERMS.some((term) => status.includes(term))) return false;
  return ACCEPTED_SAVED_STATUSES.has(status);
}

function hasSavedMarker(trip) {
  if (trip?.isSaved === true || trip?.isApproved === true) return true;
  if (normalizeText(trip?.savedAt) || normalizeText(trip?.approvedAt)) return true;
  return (
    isAcceptedSavedStatus(trip?.approvalStatus) ||
    isAcceptedSavedStatus(trip?.itineraryStatus) ||
    isAcceptedSavedStatus(trip?.clientStatus) ||
    isAcceptedSavedStatus(trip?.status)
  );
}

export function isSavedItineraryTrip(trip) {
  if (!trip || typeof trip !== "object") return false;
  if (!getStableItineraryId(trip)) return false;
  if (normalizeSavedStatus(trip.status) === "archived") return false;
  return hasSavedMarker(trip);
}

export function getSavedItineraryTrips(agencyTrips = []) {
  return (Array.isArray(agencyTrips) ? agencyTrips : []).filter(isSavedItineraryTrip);
}

function getClientId(clientName) {
  return normalizeText(clientName).toLowerCase();
}

function getTripSortValue(trip) {
  return normalizeText(trip?.departureDate || trip?.startDate || trip?.travelWindow || trip?.destination || trip?.id);
}

export function groupSavedTripsByClient(savedTrips = []) {
  const map = new Map();

  (Array.isArray(savedTrips) ? savedTrips : []).forEach((trip) => {
    const clientName = normalizeText(trip?.clientName);
    if (!clientName) return;

    const clientId = getClientId(clientName);
    if (!map.has(clientId)) {
      map.set(clientId, {
        id: clientId,
        name: clientName,
        trips: [],
      });
    }
    map.get(clientId).trips.push(trip);
  });

  return Array.from(map.values())
    .map((client) => ({
      ...client,
      trips: [...client.trips].sort((a, b) => getTripSortValue(a).localeCompare(getTripSortValue(b))),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveSavedPortfolioSelection({ clients, selectedClientId, selectedTripId }) {
  const safeClients = Array.isArray(clients) ? clients : [];
  const currentClient = safeClients.find((client) => client.id === selectedClientId) ?? null;

  if (currentClient) {
    const currentTrip = currentClient.trips.find((trip) => trip.id === selectedTripId) ?? null;
    if (currentTrip) {
      return { clientId: currentClient.id, tripId: currentTrip.id };
    }

    const firstTripForClient = currentClient.trips[0] ?? null;
    if (firstTripForClient) {
      return { clientId: currentClient.id, tripId: firstTripForClient.id };
    }
  }

  const firstClient = safeClients[0] ?? null;
  const firstTrip = firstClient?.trips?.[0] ?? null;

  return {
    clientId: firstClient?.id ?? null,
    tripId: firstTrip?.id ?? null,
  };
}

export function normalizeItineraryResponse(responseData) {
  return responseData?.itinerary ?? responseData ?? null;
}
```

- [ ] **Step 2: Run the new tests and confirm failures moved to the component**

Run:

```powershell
npm.cmd test -- tests/client-itinerary-page.test.jsx
```

Expected:

```text
FAIL  tests/client-itinerary-page.test.jsx
```

Failures now point at `ClientItineraryPage.jsx` not using the new selectors yet.

## Task 3: Wire ClientItineraryPage Saved-Only Behavior

**Assigned model:** `gpt-5.5`

**Files:**
- Modify: `app/components/trip-dashboard/pages/ClientItineraryPage.jsx`
- Test: `tests/client-itinerary-page.test.jsx`

- [ ] **Step 1: Replace the page implementation with saved-only selection and fetch logic**

Replace `Voyage-Client/app/components/trip-dashboard/pages/ClientItineraryPage.jsx` with:

```jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./ClientItineraryPage.css";
import { fetchItineraryDraft } from "../../../lib/api.js";
import {
  getSavedItineraryTrips,
  getSavedStatusLabel,
  getStableItineraryId,
  groupSavedTripsByClient,
  normalizeItineraryResponse,
  resolveSavedPortfolioSelection,
} from "../../../lib/trip-dashboard/savedItineraries.js";
import ItineraryDraftPanel from "../itinerary/ItineraryDraftPanel.jsx";

function getInitials(name) {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getTravelWindow(trip) {
  return trip?.travelWindow || trip?.dates || trip?.dateRange || "Dates pending";
}

function getTripDestination(trip) {
  return trip?.destination || trip?.destinationSummary || trip?.title || "Saved itinerary";
}

export default function ClientItineraryPage({ agencyTrips = [], agencyId }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullItinerary, setFullItinerary] = useState(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState("");
  const requestSequenceRef = useRef(0);

  const savedTrips = useMemo(() => getSavedItineraryTrips(agencyTrips), [agencyTrips]);
  const clients = useMemo(() => groupSavedTripsByClient(savedTrips), [savedTrips]);
  const hasSavedItineraries = clients.length > 0;

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => client.name.toLowerCase().includes(query));
  }, [clients, searchQuery]);

  const selectedClient = clients.find((client) => client.id === selectedClientId) || null;
  const selectedTrip = selectedClient?.trips.find((trip) => trip.id === selectedTripId) || null;

  useEffect(() => {
    const nextSelection = resolveSavedPortfolioSelection({ clients, selectedClientId, selectedTripId });

    if (nextSelection.clientId !== selectedClientId) {
      setSelectedClientId(nextSelection.clientId);
    }
    if (nextSelection.tripId !== selectedTripId) {
      setSelectedTripId(nextSelection.tripId);
    }
  }, [clients, selectedClientId, selectedTripId]);

  useEffect(() => {
    const itineraryId = getStableItineraryId(selectedTrip);

    requestSequenceRef.current += 1;
    const requestSequence = requestSequenceRef.current;
    setFullItinerary(null);
    setItineraryError("");

    if (!agencyId || !itineraryId) {
      setIsLoadingItinerary(false);
      return;
    }

    let cancelled = false;
    setIsLoadingItinerary(true);

    fetchItineraryDraft(agencyId, itineraryId)
      .then((res) => {
        if (cancelled || requestSequence !== requestSequenceRef.current) return;
        setFullItinerary(normalizeItineraryResponse(res));
      })
      .catch((err) => {
        if (cancelled || requestSequence !== requestSequenceRef.current) return;
        console.error(err);
        setFullItinerary(null);
        setItineraryError("Unable to load this saved itinerary.");
      })
      .finally(() => {
        if (cancelled || requestSequence !== requestSequenceRef.current) return;
        setIsLoadingItinerary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agencyId, selectedTrip]);

  const renderPreview = () => {
    if (!selectedTrip) {
      return (
        <div className="empty-workspace">
          <p>Saved itineraries will appear here after approval from Command Center.</p>
        </div>
      );
    }

    if (isLoadingItinerary) {
      return (
        <div className="empty-workspace">
          <div className="loading-spinner" />
          <p>Loading saved itinerary...</p>
        </div>
      );
    }

    if (itineraryError) {
      return (
        <div className="empty-workspace">
          <p>{itineraryError}</p>
        </div>
      );
    }

    if (!fullItinerary) {
      return (
        <div className="empty-workspace">
          <p>This saved trip is missing itinerary details.</p>
        </div>
      );
    }

    return (
      <div className="itinerary-details-wrapper">
        <ItineraryDraftPanel
          itinerary={fullItinerary}
          draftDays={fullItinerary.days || []}
          draftVersion={fullItinerary.version ? `Saved itinerary v${fullItinerary.version}` : "Saved itinerary"}
          tripSummary={fullItinerary.trip ?? selectedTrip}
        />
      </div>
    );
  };

  return (
    <div className="client-itinerary-surface">
      <aside className="client-sidebar-pane">
        <div className="pane-header">
          <h3 className="section-title">Client Directory</h3>
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="client-list">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const initials = getInitials(client.name);
              return (
                <button
                  key={client.id}
                  className={`client-card ${selectedClientId === client.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setSelectedTripId(client.trips[0]?.id || null);
                  }}
                >
                  <div className="client-avatar">{initials}</div>
                  <div className="client-info">
                    <strong>{client.name}</strong>
                    <span>{client.trips.length} saved</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="empty-results">
              {hasSavedItineraries ? "No saved clients match your search." : "No saved itineraries yet."}
            </div>
          )}
        </div>
      </aside>

      <main className="workspace-pane">
        {selectedClient ? (
          <div className="workspace-content">
            <header className="workspace-header">
              <div className="client-meta">
                <h2>{selectedClient.name}</h2>
                <div className="client-meta-row">
                  <span className="client-badge">Saved itineraries</span>
                  <span className="saved-count-pill">{selectedClient.trips.length} saved</span>
                </div>
              </div>
            </header>

            <div className="workspace-layout">
              <div className="trip-strip">
                {selectedClient.trips.map((trip) => (
                  <button
                    key={trip.id}
                    className={`trip-card ${selectedTripId === trip.id ? "active" : ""}`}
                    onClick={() => setSelectedTripId(trip.id)}
                  >
                    <div className="trip-card-body">
                      <strong>{getTripDestination(trip)}</strong>
                      <span className="trip-dates">{getTravelWindow(trip)}</span>
                    </div>
                    <span className="trip-status-chip">{getSavedStatusLabel(trip)}</span>
                  </button>
                ))}
              </div>

              <div className="itinerary-preview-area">
                {renderPreview()}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-workspace">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Client Portfolio</h3>
            <p>Saved itineraries will appear here after approval from Command Center.</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run the focused test file**

Run:

```powershell
npm.cmd test -- tests/client-itinerary-page.test.jsx
```

Expected:

```text
PASS  tests/client-itinerary-page.test.jsx
```

- [ ] **Step 3: Commit data and behavior changes**

Run:

```powershell
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" add "app/lib/trip-dashboard/savedItineraries.js" "app/components/trip-dashboard/pages/ClientItineraryPage.jsx" "tests/client-itinerary-page.test.jsx"
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" commit -m "feat: show saved client itineraries"
```

Expected:

```text
[feat/client-itinerary-saved-portfolio <sha>] feat: show saved client itineraries
```

## Task 4: Align UI With Current Voyage Design

**Assigned model:** `gpt-5.4-mini`

**Files:**
- Modify: `app/components/trip-dashboard/pages/ClientItineraryPage.css`
- Test: `tests/client-itinerary-page.test.jsx`

- [ ] **Step 1: Add saved portfolio UI classes**

Append these rules to `Voyage-Client/app/components/trip-dashboard/pages/ClientItineraryPage.css`:

```css
.client-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.saved-count-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(215, 122, 97, 0.12);
  color: var(--voyage-primary);
  border: 1px solid rgba(215, 122, 97, 0.28);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.trip-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.trip-status-chip {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(215, 122, 97, 0.12);
  color: var(--voyage-secondary);
  border: 1px solid rgba(215, 122, 97, 0.26);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.trip-card.active .trip-status-chip {
  background: var(--voyage-secondary);
  color: white;
  border-color: var(--voyage-secondary);
}

.empty-results {
  margin: 8px;
  border: 1px dashed var(--voyage-border-strong);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.48);
  font-size: 0.85rem;
  line-height: 1.45;
}

.empty-workspace p {
  max-width: 460px;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .client-itinerary-surface {
    grid-template-columns: 280px 1fr;
  }

  .trip-card {
    min-width: 200px;
  }
}

@media (max-width: 760px) {
  .client-itinerary-surface {
    grid-template-columns: 1fr;
    height: auto;
  }

  .client-sidebar-pane,
  .workspace-pane {
    min-height: 360px;
  }
}
```

- [ ] **Step 2: Run the focused test file after styling**

Run:

```powershell
npm.cmd test -- tests/client-itinerary-page.test.jsx
```

Expected:

```text
PASS  tests/client-itinerary-page.test.jsx
```

- [ ] **Step 3: Commit styling changes**

Run:

```powershell
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" add "app/components/trip-dashboard/pages/ClientItineraryPage.css"
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" commit -m "style: align saved itinerary portfolio"
```

Expected:

```text
[feat/client-itinerary-saved-portfolio <sha>] style: align saved itinerary portfolio
```

## Task 5: Run Verification

**Assigned model:** `gpt-5.4-mini`

**Files:**
- No source edits unless verification exposes a regression.

- [ ] **Step 1: Run the focused test file**

Run:

```powershell
npm.cmd test -- tests/client-itinerary-page.test.jsx
```

Expected:

```text
PASS  tests/client-itinerary-page.test.jsx
```

- [ ] **Step 2: Run dashboard regression tests**

Run:

```powershell
npm.cmd test -- tests/home-page.test.jsx tests/agency-dashboard-selectors.test.jsx
```

Expected:

```text
PASS  tests/home-page.test.jsx
PASS  tests/agency-dashboard-selectors.test.jsx
```

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ Compiled successfully
```

If the build fails with a Windows OneDrive `.next` rename or unlink `EPERM`, confirm `next.config.mjs` still uses the repo's non-default `distDir`, rerun the same command once, and report the exact error if it repeats.

- [ ] **Step 4: Confirm final git state**

Run:

```powershell
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" status --short --branch
```

Expected:

```text
## feat/client-itinerary-saved-portfolio
```

No unstaged source changes remain.

## Task 6: Final Code Review

**Assigned model:** `gpt-5.5`

**Files:**
- Review: `app/lib/trip-dashboard/savedItineraries.js`
- Review: `app/components/trip-dashboard/pages/ClientItineraryPage.jsx`
- Review: `app/components/trip-dashboard/pages/ClientItineraryPage.css`
- Review: `tests/client-itinerary-page.test.jsx`

- [ ] **Step 1: Review saved/approved filtering**

Check these exact conditions in `savedItineraries.js`:

```js
isSavedItineraryTrip({ approvalStatus: "Awaiting itinerary approval", itineraryId: "x" }) === false;
isSavedItineraryTrip({ approvalStatus: "Final confirmation pending", itineraryId: "x" }) === false;
isSavedItineraryTrip({ approvalStatus: "Approved", itineraryId: "x" }) === true;
isSavedItineraryTrip({ savedAt: "2026-05-08T00:00:00.000Z", itineraryId: "x" }) === true;
isSavedItineraryTrip({ approvalStatus: "Approved" }) === false;
isSavedItineraryTrip({ approvalStatus: "Approved", status: "archived", itineraryId: "x" }) === false;
```

- [ ] **Step 2: Review ClientItineraryPage state boundary**

Confirm `ClientItineraryPage.jsx`:

```js
// Must import only agency trip data and the itinerary API.
import { fetchItineraryDraft } from "../../../lib/api.js";
```

Confirm it does not import or receive:

```js
draftThreadStates
draftThreadOrder
tripStates
AgentCommandCenter
useTripPlanning
```

- [ ] **Step 3: Review stale fetch protection**

Confirm the fetch effect increments `requestSequenceRef.current` before each request and checks it in `then`, `catch`, and `finally`:

```js
if (cancelled || requestSequence !== requestSequenceRef.current) return;
```

- [ ] **Step 4: Review UI copy**

Confirm the Client Itinerary page uses saved/approved copy:

```text
Saved itineraries
Saved itinerary
Approved itinerary
Loading saved itinerary...
Saved itineraries will appear here after approval from Command Center.
```

Confirm it does not render this page-level copy:

```text
Draft
Draft itinerary
Generated draft
```

- [ ] **Step 5: Record review result**

If no issues are found, record:

```text
Review passed: saved itinerary portfolio is filtered from agencyTrips only, drafts remain in Command Center, tests cover filtering, selection, fetch errors, and stale responses.
```

If issues are found, patch the smallest affected file, rerun:

```powershell
npm.cmd test -- tests/client-itinerary-page.test.jsx
npm.cmd run build
```

Then commit:

```powershell
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" add "app/lib/trip-dashboard/savedItineraries.js" "app/components/trip-dashboard/pages/ClientItineraryPage.jsx" "app/components/trip-dashboard/pages/ClientItineraryPage.css" "tests/client-itinerary-page.test.jsx"
git -C "Voyage-Client" -c safe.directory="C:/Users/dever/OneDrive/Documents/Voyage/Voyage-Client" commit -m "fix: tighten saved itinerary portfolio"
```
