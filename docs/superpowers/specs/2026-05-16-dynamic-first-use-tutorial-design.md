# Dynamic First-Use Tutorial Design

## Purpose

Replace the current first-use tutorial preview artwork with screenshots captured from the live dashboard UI. The tutorial should feel like a step-by-step guide that shows users the real system they are about to use, not a static illustration that can drift from the product.

## Current State

`HomePage.jsx` opens `FirstUseTutorial` for users who have not completed the home tour. The tutorial is replayable from `SettingsPage.jsx` and its content is centralized in `tutorialContent.js`.

The current tutorial uses static SVG files from `public/tutorial`. Those files are mockups, not captures of the real dashboard. This is the main mismatch with the desired experience.

## Recommended Approach

Use client-side capture with `html2canvas`, which is already available in `Voyage-Client`. Add stable capture targets to the real dashboard and let the tutorial request screenshots from those targets when it opens.

This keeps the tutorial dynamic while avoiding duplicated "mini dashboard" markup inside the modal.

## Tutorial Flow

The tutorial remains a modal, but it should read as a guided wizard:

1. Step 1: Start on the homepage
   - Show the real header/new itinerary/client switcher area.
   - Explain how to create a fresh itinerary and switch active clients.
2. Step 2: Plan inside the workspace
   - Show the real command center workspace with the chat/map context visible.
   - Explain that itinerary, agent chat, and map context stay together.
3. Step 3: Review and replay later
   - Show a real available guide target, preferably the settings/help tutorial area when mounted.
   - Explain how users can replay the guide later from Settings.

Navigation should use `Back`, `Next`, and `Finish`. The current step should be visibly highlighted in a simple numbered rail or progress row.

## Capture Architecture

Add a small capture layer instead of embedding capture details in every tutorial element:

- Mark dashboard regions with stable attributes such as `data-tour-capture="home-header"` and `data-tour-capture="workspace"`.
- Pass a capture resolver into `FirstUseTutorial`, for example `getTutorialCapture(step.captureTarget)`.
- The resolver uses `html2canvas` on the matching mounted DOM node and returns a data URL.
- `FirstUseTutorial` stores capture state per step: `idle`, `capturing`, `ready`, or `failed`.
- Recapture when the tutorial opens and when a step is selected if the step has not already captured successfully.

## Data Model

Extend `homeTourSteps` so each step declares what it needs:

- `id`
- `title`
- `description`
- `bullets`
- `captureTarget`
- `fallbackImage` only as a last-resort fallback
- `alt`

The tutorial content stays centralized so Settings can continue rendering the same quick reference.

## Error Handling

Capture can fail if the target is not mounted, the browser blocks canvas rendering, or the element has not finished laying out. The tutorial should handle this without breaking the user flow:

- Show a loading state while capture is running.
- Retry once after a short delay if the target is missing on the first attempt.
- If capture still fails, show a neutral fallback panel and keep the step text usable.
- Do not close the tutorial or block the user from finishing the tour.

## Constraints

Only capture mounted real UI. The tutorial should not silently switch tabs just to capture hidden content. That keeps the first implementation predictable and avoids changing the user's active workspace while they are learning it.

Because the modal overlays the page, captures should run before the modal content visually covers the target or should temporarily hide only the modal capture surface during the screenshot operation. The backdrop should not appear in the captured image.

## Testing

Add focused coverage for:

- First-use tutorial opens when `HOME_TOUR_STORAGE_KEY` is absent.
- Completing or skipping the tutorial writes the storage key.
- The tutorial requests the expected capture target for the active step.
- A failed capture still renders step content and allows the user to continue.
- Settings replay still reopens the same tutorial.

Mock `html2canvas` in tests so the tests validate behavior without relying on real browser screenshot support.

## Out of Scope

- Generating static screenshot assets.
- Rebuilding the tutorial as a full onboarding system.
- Capturing hidden tabs by mutating the active dashboard tab.
- Adding analytics or backend persistence for tutorial completion.

## Self-Review

- No placeholder requirements remain.
- The dynamic screenshot source is explicit: mounted live dashboard DOM targets.
- The fallback behavior is defined without reintroducing static mockups as the primary experience.
- The implementation remains scoped to `HomePage.jsx`, `FirstUseTutorial.jsx`, `tutorialContent.js`, Settings replay, and focused tests.
