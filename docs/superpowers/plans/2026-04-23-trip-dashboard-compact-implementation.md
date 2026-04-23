# Trip Dashboard Compact Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Minimalist Compact Flow" redesign for the Trip Dashboard by adjusting CSS values in `app/globals.css` according to the approved design specification.

**Architecture:** All changes are purely aesthetic and confined to `app/globals.css`. No React components need to be modified.

---

## Planned File Structure

### Modify
- `app/globals.css`

## Task 1: Update Dashboard Shell and Hero Spacing

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update `.trip-dashboard-shell`**
  - Change `gap: 32px` to `gap: 16px`
  - Change `padding-top: 20px` to `padding-top: 12px`

- [ ] **Step 2: Update `.trip-dashboard-hero`**
  - Change `gap: 28px` to `gap: 16px`
  - Change `padding: clamp(28px, 5vw, 40px)` to `padding: 20px 24px`

## Task 2: Compact the Summary Strip

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update `.trip-summary-strip`**
  - Change `gap: 18px` to `gap: 8px`

- [ ] **Step 2: Update `.trip-summary-card`**
  - Change `padding: 18px 20px` to `padding: 12px 16px`
  
- [ ] **Step 3: Update `.trip-summary-card strong`**
  - Add `font-size: 0.95rem` (it was `1rem`).

## Task 3: Tighten Dashboard Grid and Cards

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update `.trip-dashboard-grid`**
  - Change `gap: 24px` to `gap: 16px`

- [ ] **Step 2: Update `.trip-map-panel`**
  - Change `padding: clamp(24px, 4vw, 36px)` to `padding: 16px 20px`

- [ ] **Step 3: Update `.trip-day-card`**
  - Change `padding: 24px` to `padding: 16px`

- [ ] **Step 4: Update `.trip-map-canvas`**
  - Change `min-height: 320px` to `min-height: 260px`
