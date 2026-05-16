# Dynamic First-Use Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static tutorial artwork with a step-by-step guide that captures mounted real dashboard UI regions at runtime.

**Architecture:** `HomePage.jsx` marks real UI regions as tour capture targets and passes a resolver into `FirstUseTutorial`. A focused capture utility wraps `html2canvas`, while the tutorial owns capture state, step navigation, fallbacks, and completion. `tutorialContent.js` remains the shared content source for the modal and Settings quick reference.

**Tech Stack:** Next.js client components, React 19, Tailwind utility classes, `html2canvas`, Vitest, Testing Library, jsdom.

---

## File Structure

- Create: `app/components/trip-dashboard/tutorial/captureTutorialTarget.js`
  - Owns DOM lookup, retry, and `html2canvas` conversion to a data URL.
- Modify: `app/components/trip-dashboard/tutorial/tutorialContent.js`
  - Replaces `image` with `id`, `captureTarget`, and `fallbackImage`.
- Modify: `app/components/trip-dashboard/tutorial/FirstUseTutorial.jsx`
  - Converts the modal to a real wizard with dynamic capture states.
- Modify: `app/components/trip-dashboard/HomePage.jsx`
  - Imports the capture helper, marks mounted capture targets, passes `getTutorialCapture`, and preserves localStorage completion behavior.
- Modify: `app/components/trip-dashboard/pages/SettingsPage.jsx`
  - Keeps the help content useful without implying the replay image is a static screenshot.
- Modify: `tests/home-page.test.jsx`
  - Mocks `html2canvas`, validates capture target requests, completion storage, failure fallback, and Settings replay.
- Modify if needed: `tests/setup.js`
  - Add only missing browser shims discovered by the tests.

---

### Task 1: Lock Dynamic Capture Behavior With Tests

**Files:**
- Modify: `tests/home-page.test.jsx`

- [ ] **Step 1: Add an `html2canvas` mock**

Add this near the existing `vi.mock` declarations:

```jsx
const html2CanvasMock = vi.hoisted(() =>
  vi.fn(async () => ({
    toDataURL: vi.fn(() => "data:image/png;base64,dynamic-tour-capture"),
  })),
);

vi.mock("html2canvas", () => ({
  default: (...args) => html2CanvasMock(...args),
}));
```

- [ ] **Step 2: Reset the capture mock before each homepage test**

Inside the `beforeEach` for `describe("Agency portfolio HomePage", ...)`, reset the mock:

```jsx
beforeEach(() => {
  resetApiMocks();
  html2CanvasMock.mockClear();
  html2CanvasMock.mockResolvedValue({
    toDataURL: vi.fn(() => "data:image/png;base64,dynamic-tour-capture"),
  });
  localStorage.setItem("voyage-home-tour-completed-v1", "true");
});
```

This keeps unrelated HomePage tests from automatically opening the tutorial unless they explicitly remove the storage key.

- [ ] **Step 3: Update the existing first-use tutorial test**

Replace the current tutorial assertion block with:

```jsx
it("shows the first-use tutorial with a live homepage capture until it is dismissed", async () => {
  localStorage.removeItem("voyage-home-tour-completed-v1");

  render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

  expect(await screen.findByRole("dialog", { name: "First-use tutorial" })).toBeInTheDocument();

  await waitFor(() => {
    expect(html2CanvasMock).toHaveBeenCalledTimes(1);
  });

  expect(html2CanvasMock.mock.calls[0][0]).toHaveAttribute("data-tour-capture", "home-header");
  expect(screen.getByAltText("Live capture of the homepage controls")).toHaveAttribute(
    "src",
    "data:image/png;base64,dynamic-tour-capture",
  );
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Finish tutorial" }));

  await waitFor(() => {
    expect(localStorage.getItem("voyage-home-tour-completed-v1")).toBe("true");
  });

  expect(screen.queryByRole("dialog", { name: "First-use tutorial" })).not.toBeInTheDocument();
});
```

- [ ] **Step 4: Add a step navigation capture test**

Add this test after the first-use tutorial test:

```jsx
it("captures the workspace target when the user advances the tutorial", async () => {
  localStorage.removeItem("voyage-home-tour-completed-v1");

  render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

  expect(await screen.findByRole("dialog", { name: "First-use tutorial" })).toBeInTheDocument();

  await waitFor(() => {
    expect(html2CanvasMock).toHaveBeenCalledTimes(1);
  });

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() => {
    expect(html2CanvasMock).toHaveBeenCalledTimes(2);
  });

  expect(html2CanvasMock.mock.calls[1][0]).toHaveAttribute("data-tour-capture", "workspace");
  expect(screen.getByRole("heading", { name: "Plan inside the workspace" })).toBeInTheDocument();
});
```

- [ ] **Step 5: Add a capture failure fallback test**

Add this test after the navigation test:

```jsx
it("keeps the tutorial usable when a live capture fails", async () => {
  localStorage.removeItem("voyage-home-tour-completed-v1");
  html2CanvasMock.mockRejectedValueOnce(new Error("capture failed"));

  render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

  expect(await screen.findByRole("dialog", { name: "First-use tutorial" })).toBeInTheDocument();

  expect(await screen.findByText("Live preview unavailable")).toBeInTheDocument();
  expect(screen.getByText("You can continue the guide while Voyage refreshes this preview.")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  expect(await screen.findByRole("heading", { name: "Plan inside the workspace" })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the failing tests**

Run:

```bash
npm.cmd test -- tests/home-page.test.jsx
```

Expected: FAIL because `html2canvas` is not mocked by the current tutorial flow, `FirstUseTutorial` still uses static `image`, and `HomePage` does not pass a capture resolver.

---

### Task 2: Add the Capture Utility and Tour Content Contract

**Files:**
- Create: `app/components/trip-dashboard/tutorial/captureTutorialTarget.js`
- Modify: `app/components/trip-dashboard/tutorial/tutorialContent.js`

- [ ] **Step 1: Create the capture utility**

Create `app/components/trip-dashboard/tutorial/captureTutorialTarget.js`:

```js
"use client";

import html2canvas from "html2canvas";

const CAPTURE_RETRY_DELAY_MS = 120;

function waitForCaptureTarget(captureTarget, attempt = 0) {
  const selector = `[data-tour-capture="${captureTarget}"]`;
  const element = document.querySelector(selector);

  if (element || attempt > 0) {
    return Promise.resolve(element);
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(document.querySelector(selector));
    }, CAPTURE_RETRY_DELAY_MS);
  });
}

export async function captureTutorialTarget(captureTarget) {
  if (!captureTarget || typeof document === "undefined") {
    throw new Error("Tutorial capture target is unavailable.");
  }

  const element = await waitForCaptureTarget(captureTarget);

  if (!element) {
    throw new Error(`Tutorial capture target "${captureTarget}" was not found.`);
  }

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    logging: false,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
  });

  return canvas.toDataURL("image/png");
}
```

- [ ] **Step 2: Update tutorial content**

Replace the `homeTourSteps` entries in `tutorialContent.js` with:

```js
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
```

Keep `HOME_TOUR_STORAGE_KEY` and `homeTourHelpBullets` exported.

- [ ] **Step 3: Run the focused tests again**

Run:

```bash
npm.cmd test -- tests/home-page.test.jsx
```

Expected: still FAIL until `HomePage.jsx` passes the resolver and `FirstUseTutorial.jsx` consumes it.

---

### Task 3: Wire Live Capture Targets Through HomePage

**Files:**
- Modify: `app/components/trip-dashboard/HomePage.jsx`

- [ ] **Step 1: Import the capture utility**

Add this import beside the tutorial imports:

```jsx
import { captureTutorialTarget } from "./tutorial/captureTutorialTarget.js";
```

- [ ] **Step 2: Add a stable capture resolver**

Add this callback near `closeFirstUseTutorial` and `replayFirstUseTutorial`:

```jsx
const getTutorialCapture = useCallback((captureTarget) => captureTutorialTarget(captureTarget), []);
```

- [ ] **Step 3: Pass the resolver into the tutorial**

Change the tutorial call to:

```jsx
<FirstUseTutorial
  open={isFirstUseTutorialOpen}
  onClose={closeFirstUseTutorial}
  getCapture={getTutorialCapture}
/>
```

- [ ] **Step 4: Mark the real homepage/header target**

Wrap the `DashboardHeader` with a capture target container:

```jsx
<div data-tour-capture="home-header">
  <DashboardHeader
    isSidebarOpen={isSidebarOpen}
    setIsSidebarOpen={setIsSidebarOpen}
    liveStatus={liveStatus}
    scopedStreamError={isVisible ? streamError : null}
    scopedIsStreaming={isVisible ? isStreaming : false}
    getInitials={getInitials}
    displayName={user?.displayName || "Traveler"}
    agencyId={agencyId}
    activeTab={activeTab}
    onNewItinerary={handleNewItinerary}
    isCreatingDraftThread={isCreatingDraftThread}
    isClientMenuOpen={isClientMenuOpen}
    setIsClientMenuOpen={setIsClientMenuOpen}
    clientMenuRef={clientMenuRef}
    hasOptions={planningOptions.length > 0}
    activeTripClientName={activeTripClientName}
    activeTripInitials={activeTripInitials}
    activeTripOrganizerInitials={activeTripOrganizerInitials}
    clientMenuEmptyTitle={clientMenuEmptyTitle}
    clientMenuEmptyBody={clientMenuEmptyBody}
    safeOptions={activeTab === "itineraries" ? planningOptions.filter(o => o.type !== "draft") : planningOptions}
    activeOption={activeOption}
    onPlanningOptionDelete={handleDeleteOption}
    deletingThreadId={deletingThreadId}
    onPlanningOptionChange={(ctx) => { setActiveContext(createPlanningContext(ctx?.type, ctx?.id)); setComposerInput(""); }}
    canApproveDraft={activeContext?.type === "draft" && Boolean(activeTripState?.itinerary?.id)}
    onApproveDraft={() => { setApprovalError(""); setIsApprovalModalOpen(true); }}
  />
</div>
```

- [ ] **Step 5: Mark the real workspace target**

Add `data-tour-capture="workspace"` to the command-center section:

```jsx
<section
  data-tour-capture="workspace"
  className="relative flex flex-1 min-h-0 overflow-hidden rounded-[24px] border border-border/10 shadow-inner max-[900px]:rounded-none max-[900px]:border-none max-[900px]:shadow-none"
>
```

- [ ] **Step 6: Run the focused tests**

Run:

```bash
npm.cmd test -- tests/home-page.test.jsx
```

Expected: still FAIL until `FirstUseTutorial.jsx` renders dynamic captures and new button labels.

---

### Task 4: Convert FirstUseTutorial Into a Dynamic Wizard

**Files:**
- Modify: `app/components/trip-dashboard/tutorial/FirstUseTutorial.jsx`

- [ ] **Step 1: Update the component signature and capture state**

Change the component definition and state setup to:

```jsx
export default function FirstUseTutorial({ open, onClose, getCapture }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [captures, setCaptures] = useState({});
```

- [ ] **Step 2: Reset state when the modal opens**

Replace the current `open` effect with:

```jsx
useEffect(() => {
  if (!open) return;
  setActiveIndex(0);
  setCaptures({});
}, [open]);
```

- [ ] **Step 3: Add capture loading effect**

Add this effect after `activeStep` is defined:

```jsx
useEffect(() => {
  if (!open || !activeStep?.captureTarget || typeof getCapture !== "function") return;

  const existing = captures[activeStep.id];
  if (existing?.status === "ready" || existing?.status === "capturing") return;

  let cancelled = false;

  setCaptures((current) => ({
    ...current,
    [activeStep.id]: { status: "capturing", src: "", error: "" },
  }));

  getCapture(activeStep.captureTarget)
    .then((src) => {
      if (cancelled) return;
      setCaptures((current) => ({
        ...current,
        [activeStep.id]: { status: "ready", src, error: "" },
      }));
    })
    .catch((error) => {
      if (cancelled) return;
      setCaptures((current) => ({
        ...current,
        [activeStep.id]: {
          status: "failed",
          src: activeStep.fallbackImage ?? "",
          error: error instanceof Error ? error.message : "Capture failed.",
        },
      }));
    });

  return () => {
    cancelled = true;
  };
}, [activeStep, captures, getCapture, open]);
```

- [ ] **Step 4: Replace static image rendering with dynamic preview states**

Inside the screenshot frame, replace the `<img src={activeStep.image} ... />` block with:

```jsx
{captures[activeStep.id]?.status === "ready" || captures[activeStep.id]?.src ? (
  <img
    src={captures[activeStep.id].src}
    alt={activeStep.alt}
    className="h-full w-full object-cover"
  />
) : captures[activeStep.id]?.status === "failed" ? (
  <div className="flex h-full flex-col items-center justify-center bg-[#0b171e] p-6 text-center">
    <p className="text-sm font-semibold text-white">Live preview unavailable</p>
    <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
      You can continue the guide while Voyage refreshes this preview.
    </p>
  </div>
) : (
  <div className="flex h-full flex-col items-center justify-center bg-[#0b171e] p-6 text-center">
    <p className="text-sm font-semibold text-white">Capturing the current dashboard</p>
    <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
      Voyage is using the live page below this guide.
    </p>
  </div>
)}
```

- [ ] **Step 5: Make the navigation read as a wizard**

Change the secondary navigation buttons to:

```jsx
<button
  type="button"
  className="rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-40"
  onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
  disabled={activeIndex === 0}
>
  Back
</button>
{activeIndex < homeTourSteps.length - 1 ? (
  <button
    type="button"
    className="rounded-pill bg-secondary px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
    onClick={() => setActiveIndex((current) => Math.min(current + 1, homeTourSteps.length - 1))}
  >
    Next
  </button>
) : (
  <button
    type="button"
    className="rounded-pill bg-secondary px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
    onClick={handleClose}
  >
    Finish tutorial
  </button>
)}
```

Keep the top `Skip tutorial` button wired to `handleClose`.

- [ ] **Step 6: Run the focused tests**

Run:

```bash
npm.cmd test -- tests/home-page.test.jsx
```

Expected: PASS or reveal minor accessible-name/text adjustments needed in the test or component.

---

### Task 5: Adjust Settings Help Copy and Static Preview

**Files:**
- Modify: `app/components/trip-dashboard/pages/SettingsPage.jsx`

- [ ] **Step 1: Change the Settings preview to a quick-reference panel**

Replace the static `<img>` block in the tutorial help panel with:

```jsx
<div
  className="rounded-[22px] border border-border bg-background p-5 shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
  data-tour-capture="settings-help"
>
  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-soft">
    Tutorial replay
  </p>
  <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-text-primary">
    See the live dashboard as you learn
  </h3>
  <p className="mt-2 text-sm leading-6 text-text-soft">
    The guide captures the current homepage and workspace so the preview matches the system you are using.
  </p>
</div>
```

- [ ] **Step 2: Update permanent help bullets**

In `tutorialContent.js`, replace `homeTourHelpBullets` with:

```js
export const homeTourHelpBullets = [
  "You only see the tour once unless you replay it from Settings.",
  "The tour captures mounted dashboard sections so the visuals match the current interface.",
  "Settings keeps the same help content in one permanent place.",
];
```

- [ ] **Step 3: Run the focused tests**

Run:

```bash
npm.cmd test -- tests/home-page.test.jsx
```

Expected: PASS.

---

### Task 6: Verify and Commit

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
npm.cmd test -- tests/home-page.test.jsx
```

Expected: PASS.

- [ ] **Step 2: Run the client build**

Run:

```bash
npm.cmd run build
```

Expected: PASS. If Windows/OneDrive reports an `EPERM` rename/unlink issue, rerun once before treating it as a product regression.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git diff -- app/components/trip-dashboard/HomePage.jsx app/components/trip-dashboard/tutorial app/components/trip-dashboard/pages/SettingsPage.jsx tests/home-page.test.jsx tests/setup.js
```

Expected: only tutorial capture, wizard UI, Settings help copy, and tests changed.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add app/components/trip-dashboard/HomePage.jsx app/components/trip-dashboard/pages/SettingsPage.jsx app/components/trip-dashboard/tutorial tests/home-page.test.jsx tests/setup.js
git commit -m "feat: capture live dashboard for first-use tutorial"
```

Expected: a new commit containing the implementation only. Do not include `public/tutorial` cleanup unless the implementation intentionally removes all fallback references.

---

## Self-Review

- Spec coverage: the plan covers live DOM capture, wizard navigation, centralized tutorial content, capture failure fallback, Settings replay, and focused tests.
- Placeholder scan: no unfinished markers or undefined placeholder functions remain.
- Type consistency: `captureTarget`, `fallbackImage`, `getCapture`, and `captureTutorialTarget` names are consistent across all tasks.
- Scope check: the plan does not add backend persistence, analytics, hidden-tab mutation, or generated static screenshots.
