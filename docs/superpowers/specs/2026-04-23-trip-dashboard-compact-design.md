# Trip Dashboard: Compact Flow Redesign

## 1. Overview
This design overhauls the Voyage `trip-dashboard` interface to eliminate excessive vertical whitespace ("dead space") and create a more efficient, at-a-glance layout. It adopts a "Minimalist Compact Flow" approach, retaining the existing hierarchical order (Hero -> Summary Stats -> Timeline/Map) while aggressively tightening padding, margins, and component dimensions. 

## 2. Aesthetics & Branding
*   **Fonts:** The design strictly adheres to the established typographic system. `DM Serif Display` is used for headings to convey a premium, editorial feel, while `Plus Jakarta Sans` is used for body copy and interface elements for legibility.
*   **Theme:** The interface relies on the existing design tokens, particularly utilizing `var(--voyage-background)`, `var(--voyage-primary)` for text emphasis, and subtle gradients.
*   **Visual Style:** We prioritize subtle borders, soft shadows (`var(--voyage-shadow-soft)`), and muted accents rather than heavy, blocky components.

## 3. Layout Restructuring (CSS Updates)

### 3.1. Dashboard Shell (`trip-dashboard-shell`)
*   **Change:** Reduce grid gap from `32px` to `16px`.
*   **Change:** Reduce `padding-top` from `20px` to `12px` to pull content closer to the persistent header.

### 3.2. Dashboard Hero (`trip-dashboard-hero`)
*   **Change:** Reduce padding from `clamp(28px, 5vw, 40px)` down to `20px 24px`.
*   **Change:** Reduce the internal gap from `28px` to `16px`.
*   **Result:** The introductory area becomes a sleek banner rather than a dominant, space-consuming section.

### 3.3. Summary Strip (`trip-summary-strip` & `trip-summary-card`)
*   **Change:** Decrease the grid gap between summary cards from `18px` to `8px`.
*   **Change:** Reduce the padding inside `trip-summary-card` from `18px 20px` to `12px 16px`.
*   **Typography:** Slightly scale down the `strong` value texts inside the summary strip to maintain proportion with the smaller padding.
*   **Result:** The row of statistics becomes a tightly packed utility strip that separates the hero from the itinerary timeline without forcing the user to scroll.

### 3.4. Dashboard Grid (Timeline & Map)
*   **Change:** Reduce the gap in `trip-dashboard-grid` from `24px` to `16px`.
*   **Change:** In `trip-map-panel`, reduce padding from `clamp(24px, 4vw, 36px)` to `16px 20px`.
*   **Change:** In `trip-day-card`, reduce padding from `24px` to `16px`, and lower inner gaps.
*   **Change:** In `trip-map-canvas`, reduce `min-height` slightly (e.g. from `320px` to `260px`) to match the tighter timeline cards.

## 4. Implementation Constraints
*   **No Component Deletion:** The React component structure (`HomePage.jsx`, `DashboardHero.jsx`, etc.) remains identical. All changes are executed via CSS adjustments in `globals.css`.
*   **Responsive Integrity:** The compact layout must continue to stack gracefully on mobile viewports. Existing responsive grid configurations (e.g., transitioning from grid to stack) will be preserved, simply operating with tighter spacing variables.
