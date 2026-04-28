# Agency Itinerary Agent UI Design

## Context

Voyage Client currently has a prototype agency portfolio dashboard, an agent kickoff screen, and a trip workspace with `Trip`, `Map`, `Agent`, and `Share` tabs. The backend design for the next phase introduces an agency-first itinerary agent that uses LM Studio, Google Maps, web search, durable chat threads, visible tool calls, live tasks, and structured itinerary drafts.

This frontend design defines the UI needed for agency staff to use that backend agent. The interface should feel like a professional ChatGPT-style travel planning workspace: staff chat with the agent, watch live work, inspect tool calls and sources, and review the itinerary as it is created.

## Goals

- Add an agency staff UI for creating itinerary drafts through an agent chat.
- Show live streamed agent events from the backend.
- Make tool calls and tasks visible without exposing hidden chain-of-thought.
- Display the itinerary draft beside the conversation so staff can review changes as they happen.
- Show Google Maps place context, route hints, and web search sources used by the agent.
- Preserve a path from the agency portfolio dashboard into the agent workspace.
- Keep all client-sharing controls out of scope for this phase except future-disabled affordances.

## Non-Goals

- No normal-user itinerary view in this phase.
- No normal-user chat modification flow in this phase.
- No real client sending, approval link, or share workflow in this phase.
- No full interactive Google map requirement for the first implementation.
- No billing or quota management interface for Google Maps or web search.
- No exposure of hidden model reasoning. The UI shows progress summaries, task labels, tool calls, and source references only.

## User Flow

```text
Agency Portfolio Dashboard
-> staff clicks Create itinerary with Agent
-> Agent Workspace opens a new thread
-> staff enters the trip brief as a chat message
-> backend creates an agent run
-> UI connects to the SSE stream
-> assistant text, tasks, tool calls, sources, and itinerary updates appear live
-> staff reviews the structured itinerary
-> staff asks for revisions or manually edits the draft
-> staff marks the itinerary internally reviewed
```

Existing trip-detail and review screens can remain available for prototype continuity, but the new agent workspace should become the primary creation surface for agency itinerary drafting.

## Entry Points

### Agency Dashboard Entry

The agency portfolio dashboard should expose a clear primary action:

- `Create itinerary with Agent`

Secondary entry points:

- Recent agent threads.
- Active draft itineraries.
- Agent priority queue action such as `Open itinerary draft`.

The entry point should pass agency context and, when available, trip context into the agent workspace.

### Existing Workspace Entry

If staff are already inside a trip workspace, the `Agent` tab should open the same agent thread model rather than a separate local-only chat mock. The tab can be retained, but it should evolve into a real thread view backed by the server.

## Page Structure

The agent workspace uses a three-zone layout on desktop and a tabbed layout on mobile.

### 1. Thread And Trip Rail

Purpose: orient staff and let them switch relevant work.

Desktop placement: left rail.

Content:

- Voyage agency workspace label.
- Current agency name.
- Current trip title or `New itinerary draft`.
- Thread list or recent drafts.
- Draft status chips:
  - `Draft`
  - `Needs review`
  - `Internally approved`
- Back link to agency dashboard.

The rail should be compact and operational, not a marketing sidebar.

### 2. Agent Chat

Purpose: primary interaction surface.

Desktop placement: center column.

Content:

- Scrollable message timeline.
- User messages.
- Assistant messages with streaming text.
- Inline run status.
- Composer pinned to bottom.
- Retry control for failed runs.
- Stop/cancel control only after backend cancellation is implemented.

Composer expectations:

- Multiline input.
- Primary send button.
- Disabled state while no text is present.
- Clear loading state while a message is being submitted.
- Suggested prompt chips for empty threads, such as:
  - `Create a 4-day Cebu honeymoon itinerary`
  - `Build a food-focused Tokyo plan`
  - `Make this slower paced`
  - `Add map-efficient routing`

### 3. Live Work Rail

Purpose: show what the agent is doing.

Desktop placement: right rail above or beside the itinerary inspector.

Content:

- Current run status.
- Task checklist.
- Tool calls.
- Provider status summaries.

Task examples:

- `Planning itinerary structure`
- `Searching Google Maps for candidate places`
- `Checking route distance between stops`
- `Searching the web for current travel context`
- `Writing itinerary days`

Tool call rows should show:

- tool name,
- compact summary,
- status,
- timestamp or relative time,
- expandable JSON summary for debugging only when useful.

Tool statuses:

- `running`
- `completed`
- `failed`
- `skipped`

The UI should never label this as raw model thinking. Use language such as `Live work`, `Tasks`, `Tool activity`, or `Sources`.

### 4. Itinerary Canvas

Purpose: structured preview and review surface for the draft.

Desktop placement: right side or lower split panel, depending on available width.

Content:

- Trip title and summary.
- Travel dates when known.
- Traveler count and budget/pace when known.
- Day-by-day itinerary cards.
- Item rows for activities, meals, transfers, check-ins, free time, and notes.
- Place metadata badges when enriched:
  - Google place name.
  - address.
  - route estimate from previous stop.
  - source indicator.
- Empty state while the itinerary has not been created.

The itinerary should update when `itinerary.updated` events arrive. The UI should highlight recently added or changed items briefly so staff can understand what changed.

### 5. Sources Drawer

Purpose: make map and web references inspectable.

Content:

- Web source title.
- URL.
- snippet.
- retrieval time.
- source type:
  - `Web`
  - `Google Place`
  - `Route estimate`
- associated itinerary day or item when available.

This can be a drawer, panel, or tab. It should be reachable from both assistant messages and itinerary items.

### 6. Review Actions

Purpose: keep agency staff in control.

Actions:

- `Ask agent to revise`
- `Edit draft`
- `Mark internally reviewed`
- `Return to dashboard`

Future-disabled action:

- `Send to client`

`Send to client` should not perform real sharing in this phase. If shown, it must clearly appear unavailable until the client workflow is implemented.

## Streaming Event Handling

The frontend should connect to the backend SSE endpoint returned by `POST /agencies/:agencyId/agent/threads/:threadId/messages`.

Expected event types:

- `run.started`
- `task.updated`
- `tool.started`
- `tool.completed`
- `tool.failed`
- `message.delta`
- `message.completed`
- `itinerary.updated`
- `source.added`
- `run.completed`
- `run.failed`

UI behavior:

- `run.started`: set run status to running and show live work section.
- `message.delta`: append text to the active assistant message.
- `message.completed`: finalize assistant message.
- `task.updated`: create or update task row.
- `tool.started`: create running tool call row.
- `tool.completed`: mark tool row complete and show summary.
- `tool.failed`: mark tool row failed and show recoverable error text.
- `source.added`: add source to the drawer and source count badges.
- `itinerary.updated`: refresh or patch itinerary canvas.
- `run.completed`: clear streaming state and enable composer.
- `run.failed`: show failure state, keep partial content, and offer retry.

The first implementation can consume full event payloads and refetch the thread or itinerary after important events. A later optimization can apply granular patches directly.

## Loading And Empty States

### Empty Thread

Show:

- short prompt explaining staff can create a draft by describing the trip,
- prompt examples,
- no fake messages pretending the agent already worked.

### Running State

Show:

- active assistant message bubble,
- animated but restrained streaming indicator,
- live task list,
- running tool rows.

### Provider Unavailable

If the backend returns `LOCAL_MODEL_UNAVAILABLE`, show:

```text
The local model is unavailable. Start LM Studio and try again.
```

If Google Maps or web search fails, show partial-result messaging:

```text
The itinerary draft was created, but some places could not be enriched.
```

### Failed Run

Show:

- failed status in the live work rail,
- error message from the backend,
- retry button,
- partial assistant output if available.

## Responsive Behavior

Desktop:

- three-zone layout:
  - left rail,
  - center chat,
  - right itinerary/live work rail.

Tablet:

- two-column layout:
  - chat,
  - itinerary/live work tabs.

Mobile:

- segmented tabs:
  - `Chat`
  - `Itinerary`
  - `Work`
  - `Sources`

The composer should remain reachable without covering itinerary content. Text must not overflow buttons, chips, cards, or rails.

## Visual Direction

The UI should feel like a premium agency operations workspace:

- dense but readable,
- calm and professional,
- travel-aware without decorative tourism visuals,
- focused on repeated staff use,
- no oversized landing-page hero treatment,
- no decorative orbs or generic gradient blobs,
- modest card radii,
- clear status chips,
- restrained motion for live updates.

Use existing Voyage tokens where possible:

- primary deep teal,
- terracotta action/accent,
- warm neutral surfaces,
- compact panel and card treatments.

The agent interface should distinguish:

- messages,
- tool activity,
- structured itinerary state,
- sources,
- review controls.

## Component Direction

Likely components:

- `AgencyAgentWorkspace`
- `AgentThreadRail`
- `AgentChatPanel`
- `AgentMessageList`
- `AgentComposer`
- `AgentLiveWorkRail`
- `AgentTaskList`
- `AgentToolCallList`
- `ItineraryCanvas`
- `ItineraryDayPanel`
- `ItineraryItemRow`
- `AgentSourcesDrawer`
- `AgentReviewBar`

Likely hooks/services:

- `useAgentThread`
- `useAgentRunStream`
- `useItineraryDraft`
- `agentApi`

The existing `WorkspaceScreen` can be refactored or replaced later, but the spec should guide the final agent workspace rather than preserving the current prototype chat as-is.

## API Integration

Frontend API calls:

- `POST /agencies/:agencyId/agent/threads`
- `GET /agencies/:agencyId/agent/threads`
- `GET /agencies/:agencyId/agent/threads/:threadId`
- `POST /agencies/:agencyId/agent/threads/:threadId/messages`
- `GET /agencies/:agencyId/agent/runs/:runId/stream`
- `GET /agencies/:agencyId/itineraries/:itineraryId`
- `PATCH /agencies/:agencyId/itineraries/:itineraryId`

The current `fetchApi` helper can remain for JSON calls. SSE needs a separate client because `EventSource` does not allow arbitrary headers. Since auth is cookie-based with `credentials: include` on normal requests, the SSE endpoint should rely on the same session cookie and same-origin/CORS configuration.

## Accessibility

Requirements:

- Message timeline uses semantic regions and readable message order.
- Composer has a visible label or accessible name.
- Streaming updates use polite live regions for status changes.
- Tool call rows are keyboard-expandable if expandable.
- Segmented mobile tabs use proper tab semantics.
- Color is not the only indicator of status.
- Focus returns to the composer after sending unless the user moved focus.

## Testing

Unit/component tests:

- empty thread renders prompt examples,
- sending a message calls the message endpoint and enters streaming state,
- `message.delta` events append assistant text,
- `task.updated` events update task rows,
- `tool.started` and `tool.completed` events update tool call rows,
- `source.added` events render source drawer entries,
- `itinerary.updated` causes itinerary content to appear or refresh,
- failed run shows retry affordance,
- provider unavailable errors show clear text,
- mobile tabs expose chat, itinerary, work, and sources.

Integration tests can use a mocked EventSource or injectable stream adapter. Tests must not call LM Studio, Google Maps, or a live web search provider.

## Phased Delivery

### Phase 1: Static Workspace Shell

- Agent workspace layout.
- Thread rail.
- Chat panel.
- Composer.
- Empty itinerary canvas.
- Live work rail empty and idle states.

### Phase 2: Mock Streaming

- Local mocked stream adapter.
- Live message deltas.
- Task and tool-call rows.
- Source drawer.
- Itinerary update rendering from mock data.

### Phase 3: Backend Integration

- Thread creation and loading.
- Message send.
- SSE stream connection.
- Itinerary fetch after updates.
- Error handling for failed runs and unavailable providers.

### Phase 4: Staff Review

- Manual edit entry points.
- Ask-agent-to-revise flow.
- Internal review status.
- Disabled future client-send affordance.

## Future Work

Later UI phases can add:

- real client-send workflow,
- normal-user itinerary viewer,
- normal-user modification agent,
- approval comments,
- interactive Google Map panel,
- provider quota dashboard,
- agency-wide agent thread history,
- richer itinerary diff review.
