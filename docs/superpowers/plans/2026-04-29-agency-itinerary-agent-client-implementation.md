# Agency Itinerary Agent Client Implementation Plan

> **For agentic workers:** Use this plan to implement the frontend Agency Itinerary Agent task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is designed so that different models or workers can pick up the work phase-by-phase.

**Goal:** Build the frontend agency-first itinerary agent workspace. This includes the dense industrial layout, chat interface, live SSE streaming hooks, technical live work rail, and structured itinerary canvas.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS (or existing global CSS variables), Server-Sent Events (SSE).

**Design Reference:** `docs/superpowers/specs/2026-04-28-agency-itinerary-agent-design.md`

---

## Phase 1: File Structure & Routing

**Goal:** Scaffold the core directories, routing structure, and placeholder components.

- [ ] **Step 1: Create Page Route**
  Create `app/agency/[agencyId]/trip/[tripId]/agent/page.jsx` (or `.tsx`). This is the main entry point for an existing trip.
  Create `app/agency/[agencyId]/agent/page.jsx` for starting a new trip without a `tripId`.
- [ ] **Step 2: Create Component Directories**
  Inside `app/components/agent/`, create the following subdirectories:
  - `layout/`
  - `chat/`
  - `live-work/`
  - `itinerary/`
  - `sources/`
- [ ] **Step 3: Create Stub Components**
  Create basic shell exports for the following components (just returning a `div` with their name):
  - `app/components/agent/layout/AgencyAgentWorkspace.jsx`
  - `app/components/agent/layout/AgentThreadRail.jsx`
  - `app/components/agent/chat/AgentChatPanel.jsx`
  - `app/components/agent/live-work/AgentLiveWorkRail.jsx`
  - `app/components/agent/itinerary/ItineraryCanvas.jsx`
- [ ] **Step 4: Update Global CSS**
  Add the specific typography and spacing tokens to `app/globals.css`.
  - Add a monospaced font stack for technical data (`--font-mono`).
  - Ensure `--voyage-primary`, `--voyage-secondary`, `--voyage-background`, and `--voyage-border-strong` exist.
- [ ] **Step 5: Verify Setup**
  Ensure the new routes render the `AgencyAgentWorkspace` component without crashing.

---

## Phase 2: Core Layout & Navigation

**Goal:** Implement the "Dense Industrial / Premium Terminal" three-zone desktop layout.

- [ ] **Step 1: Implement `AgencyAgentWorkspace` Layout Grid**
  Build the top-level CSS Grid layout. It should define three main columns on desktop: Left Rail (250px), Center Chat (flexible), Right Panel (450px+). Ensure it collapses into a tabbed layout on mobile devices.
- [ ] **Step 2: Build `AgentThreadRail`**
  Implement the left rail. Include:
  - Agency Name header.
  - "New Itinerary Draft" button.
  - A mocked list of recent threads with status chips (e.g., `Draft`, `Needs review`).
  - A back link to the main Agency Dashboard.
- [ ] **Step 3: Layout Integration**
  Render `AgentThreadRail` in the left column, and placeholders for the Chat and Right Panel in the `AgencyAgentWorkspace`. Add crisp `1px` borders (`--voyage-border-strong`) between panels.

---

## Phase 3: Static Agent Chat Interface

**Goal:** Build the conversational UI for the center panel.

- [ ] **Step 1: Build `AgentMessageList` Component**
  Create `app/components/agent/chat/AgentMessageList.jsx`. Use a dense vertical stack for messages. Style Assistant messages slightly offset from User messages. Use the `--voyage-background` for the chat area background.
- [ ] **Step 2: Build `AgentComposer` Component**
  Create `app/components/agent/chat/AgentComposer.jsx`.
  - Include a multiline `textarea` that auto-expands.
  - Add a primary `Send` button colored with `--voyage-secondary` (terracotta).
  - Implement a disabled state when the input is empty or `isLoading` is true.
- [ ] **Step 3: Implement Suggested Prompts**
  Inside the chat panel, implement suggested prompt chips (e.g., "Build a food-focused Tokyo plan"). Clicking a chip should populate the composer.
- [ ] **Step 4: Assemble `AgentChatPanel`**
  Combine the Message List and Composer into the `AgentChatPanel`. Ensure the composer is pinned to the bottom and the message list is scrollable.

---

## Phase 4: Live Work & Sources UI

**Goal:** Build the technical, data-dense right rail components.

- [ ] **Step 1: Build `AgentTaskList`**
  Create `app/components/agent/live-work/AgentTaskList.jsx`. Render a simple checklist showing task status (Pending, Running, Completed). Use a small, crisp font size.
- [ ] **Step 2: Build `AgentToolCallList`**
  Create `app/components/agent/live-work/AgentToolCallList.jsx`.
  - Use the monospaced font for the tool name (e.g., `Searching Google Maps`).
  - Add status badges (Running, Completed, Failed).
  - Include a toggle to expand/collapse the raw JSON input/output.
- [ ] **Step 3: Assemble `AgentLiveWorkRail`**
  Combine the Task List and Tool Call List. Add a header displaying the overall `RunStatus`.
- [ ] **Step 4: Build `AgentSourcesDrawer`**
  Create `app/components/agent/sources/AgentSourcesDrawer.jsx`. This will list URLs, snippets, and Google Place metadata retrieved by the agent. It can be a slide-out panel or a separate tab in the right column.

---

## Phase 5: Itinerary Canvas UI

**Goal:** Build the structured preview of the generated trip.

- [ ] **Step 1: Build `ItineraryItemRow`**
  Create `app/components/agent/itinerary/ItineraryItemRow.jsx`.
  - Render an item with its type (Activity, Meal, Transfer, Check-in), title, and time.
  - Apply dense tabular styling with crisp borders.
- [ ] **Step 2: Build `ItineraryDayPanel`**
  Create `app/components/agent/itinerary/ItineraryDayPanel.jsx`. This component receives an array of items for a specific day and renders a list of `ItineraryItemRow`s under a Day header.
- [ ] **Step 3: Assemble `ItineraryCanvas`**
  Combine multiple Day panels. Add the high-level Trip Title, Travel Dates, and Traveler Count at the top. Ensure the background is pristine white (`--voyage-surface`).
- [ ] **Step 4: Implement Highlighting Logic**
  Add a CSS animation or class (`flash-update`) that triggers when a row's data props change, briefly highlighting the background to indicate a live update.

---

## Phase 6: API & State Hook (`useAgentRunStream`)

**Goal:** Connect the UI to the backend Server-Sent Events stream.

- [ ] **Step 1: Build API Utilities**
  In `app/lib/api.js` (or create `agentApi.js`), add helper functions:
  - `createAgentThread(agencyId, tripId?)`
  - `sendMessage(agencyId, threadId, content)`
  - `fetchItineraryDraft(agencyId, itineraryId)`
- [ ] **Step 2: Build `useAgentRunStream` Hook**
  Create `app/hooks/useAgentRunStream.js`.
  - Initialize an `EventSource` pointing to `GET /agencies/:agencyId/agent/runs/:runId/stream`.
  - Handle authentication credentials (`withCredentials: true` if needed).
- [ ] **Step 3: Manage Local Event State**
  Inside the hook, set up local state reducers for the specific backend events:
  - `message.delta`: Append text to the active assistant message.
  - `task.updated` & `tool.started`/`completed`: Update the live work arrays.
  - `itinerary.updated`: Update the local itinerary draft state.
  - `source.added`: Append to the sources array.
  - `run.started` / `run.completed` / `run.failed`: Toggle the global `isStreaming` and `runStatus` variables.

---

## Phase 7: End-to-End Integration & Polish

**Goal:** Wire the React components to the state hook and finalize the experience.

- [ ] **Step 1: Wire Up `AgencyAgentWorkspace`**
  Initialize `useAgentRunStream` and pass the derived state down to the Chat, Live Work, and Itinerary Canvas components.
- [ ] **Step 2: Wire Up `AgentComposer`**
  Hook the `Send` button to call the `sendMessage` API endpoint and immediately trigger the streaming hook listener for the new run ID. Disable the composer while `isStreaming` is true.
- [ ] **Step 3: Implement Review Actions**
  Add the `AgentReviewBar` component at the bottom of the right panel with buttons: `Ask agent to revise`, `Edit draft`, and a visually disabled `Send to client`.
- [ ] **Step 4: Error Handling & Empty States**
  - Add an empty state to the Chat Panel with the suggested prompt chips.
  - If a run fails (e.g. `LOCAL_MODEL_UNAVAILABLE`), render the backend error gracefully in the Live Work rail and offer a `Retry` button.
- [ ] **Step 5: Mobile Responsiveness Verification**
  Ensure the 3-column layout collapses gracefully into tabs (Chat, Itinerary, Work, Sources) on mobile screens as specified in the design doc.
