# Client Itinerary Saved Portfolio Design

## Goal

Make `ClientItineraryPage.jsx` the saved itinerary portfolio for the agency dashboard. It should show only approved/saved itineraries that are tied to client trips. Draft and generated-but-unapproved itineraries stay in Command Center.

## Current State

The page already uses the right shell:

- A left `Client Directory` pane.
- A right `Client Portfolio` workspace pane.
- A horizontal trip strip when a client is selected.
- `fetchItineraryDraft(agencyId, itineraryId)` to load the selected itinerary detail.
- `ItineraryDraftPanel` as the rich itinerary renderer.

The missing behavior is that the page currently builds clients from all `agencyTrips`, then only loads detail when a selected trip has `itineraryId`. This leaves the page empty when the upstream trip list does not expose saved itineraries and does not make the approved/saved boundary explicit.

## Product Boundary

Client Itinerary is the saved portfolio:

- Include approved/saved trips with an itinerary id.
- Exclude draft threads.
- Exclude generated itineraries that have not been saved to a client.
- Use saved/approved language in this page, not draft language.

Command Center remains the working area:

- Draft thread selection.
- Agent chat.
- Generated itinerary previews before approval.
- Save-to-client action.

## UI Direction

The UI should match the current Voyage dashboard screenshots:

- Keep the white top header, dark teal left navigation, light gray page background, rounded white panels, subtle borders, and soft shadows.
- Keep the existing two-panel content layout.
- Use serif headings for page/client titles and compact sans-serif labels for operational metadata.
- Use dark teal for selected navigation and active client rows.
- Use coral for active itinerary accents and approved/saved chips.

Left pane:

- Title: `Client Directory`.
- Search input remains near the top.
- Rows show client initials, client name, and saved itinerary count.
- Only clients with saved itineraries appear.
- The selected client row uses the current dark teal active style.

Right pane:

- Empty state before selection keeps the current `Client Portfolio` feel.
- Selected state header shows client name and saved itinerary count.
- Horizontal saved itinerary cards show destination, travel window, and an approved/saved status label.
- Selected card uses a coral border and subtle warm background.
- Detail area uses the existing itinerary panel/map/day-card visual language.
- Wrapper labels should say `Saved itinerary` or `Approved itinerary`, not `Draft`.

## Data Flow

`ClientItineraryPage` receives `agencyTrips` and `agencyId`.

It derives `savedTrips` from `agencyTrips`:

- Trip must have a stable `itineraryId`.
- Trip status must indicate saved or approved. Accept current fields such as `approvalStatus` or `status`; normalize string casing.
- If the backend later adds a dedicated saved flag, prefer that explicit flag over text matching.

It derives `clients` from `savedTrips`, grouped by normalized `clientName`.

When the selected client changes:

- Auto-select that client's first saved itinerary.
- If the selected trip disappears after data refresh, fall back to the first available saved trip for that client, then the first saved client.

When the selected saved trip changes:

- Fetch `fetchItineraryDraft(agencyId, selectedTrip.itineraryId)`.
- Store the full itinerary detail locally for the preview.
- Ignore stale fetch responses if the selected trip changes before a request completes.

## States

No saved itineraries:

- Show an empty client directory and right-pane message: `Saved itineraries will appear here after approval from Command Center.`

Client selected:

- Show saved itinerary count and itinerary cards.
- Load the selected itinerary detail.

Loading:

- Show the current spinner with copy: `Loading saved itinerary...`

Missing itinerary detail:

- Show `This saved trip is missing itinerary details.`

Fetch error:

- Show `Unable to load this saved itinerary.`
- Keep the selected itinerary card visible so the user does not lose context.

## Testing

Add or update focused client-side tests for:

- Draft/unapproved trips do not appear in `ClientItineraryPage`.
- Approved/saved trips with itinerary ids appear grouped by client.
- Selecting a client selects the first saved itinerary.
- Selecting another saved itinerary fetches its details.
- Empty state appears when there are no saved itineraries.

Manual verification:

- Open the dashboard Itineraries tab.
- Confirm it visually matches the existing Voyage shell.
- Confirm Command Center still shows drafts and Client Itinerary does not.

