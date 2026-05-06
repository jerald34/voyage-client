import { describe, expect, it } from "vitest";

import { getDayProgress, getTripProgress } from "../app/lib/trip-dashboard/progress.js";
import { getMapHighlights, getNextActiveDay } from "../app/lib/trip-dashboard/selectors.js";
import { normalizeDay, normalizeLocation } from "../app/lib/trip-dashboard/mappers.js";

const days = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [
      { id: "loc-1", name: "Airport transfer", district: "Transit", completed: true },
      { id: "loc-2", name: "Hotel check-in", district: "Eixample", completed: false },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city",
    locations: [{ id: "loc-3", name: "Tapas crawl", district: "Ciutat Vella", completed: false }],
  },
];

const mapPlaces = [
  { id: "place-1", name: "Airport transfer", district: "Transit", note: "Arrival route" },
  { id: "place-2", name: "Hotel check-in", district: "Eixample", note: "Drop bags first" },
  { id: "place-3", name: "Tapas crawl", district: "Ciutat Vella", note: "Evening cluster" },
  { id: "place-4", name: "Park Guell", district: "Gracia", note: "Morning reset" },
  { id: "place-5", name: "   brunch stop  ", district: "Born", note: "Whitespace variant" },
  { id: "place-6", name: "Whitespace District", district: "   ", note: "Blank district variant" },
  { id: "place-7", name: "Duplicate District", district: "Eixample", note: "Duplicate one" },
  { id: "place-8", name: "Duplicate District", district: "Gracia", note: "Duplicate two" },
  { id: "place-9", name: "Mixed District", district: "   ", note: "Blank duplicate" },
  { id: "place-10", name: "Mixed District", district: "Born", note: "Nonblank duplicate" },
];

const completedDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [{ id: "loc-1", name: "Airport transfer", district: "Transit", completed: true }],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city",
    locations: [{ id: "loc-2", name: "Tapas crawl", district: "Ciutat Vella", completed: true }],
  },
];

const duplicateNameDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [
      { id: "loc-1", name: "Breakfast", district: "Eixample", completed: true },
      { id: "loc-2", name: "Breakfast", district: "Gracia", completed: false },
    ],
  },
];

const placeholderDays = [
  {
    id: "day-0",
    label: "Day 0",
    title: "Placeholder",
    isPlaceholder: true,
    locations: [{ id: "loc-0", name: "Hidden placeholder stop", district: "Transit", completed: true }],
  },
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [{ id: "loc-1", name: "Airport transfer", district: "Transit", completed: false }],
  },
];

const realEmptyDays = [
  {
    id: "day-0",
    label: "Day 0",
    title: "Flexible arrival",
    locations: [],
  },
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [{ id: "loc-1", name: "Airport transfer", district: "Transit", completed: false }],
  },
];

describe("trip dashboard domain layer", () => {
  it("derives per-day progress from completed locations", () => {
    expect(getDayProgress(days[0])).toEqual({
      completedCount: 1,
      totalCount: 2,
      percent: 50,
      isComplete: false,
      isEmpty: false,
    });
  });

  it("derives overall trip progress across all days", () => {
    expect(getTripProgress(days)).toEqual({
      completedCount: 1,
      totalCount: 3,
      percent: 33,
      completedDays: 0,
      totalDays: 2,
    });
  });

  it("treats only true as completed in progress calculations", () => {
    expect(
      getDayProgress({
        locations: [
          { id: "loc-1", completed: true },
          { id: "loc-2", completed: "true" },
          { id: "loc-3", completed: 1 },
          { id: "loc-4", completed: false },
        ],
      }),
    ).toEqual({
      completedCount: 1,
      totalCount: 4,
      percent: 25,
      isComplete: false,
      isEmpty: false,
    });
  });

  it("finds the next active day and the first three map highlights", () => {
    expect(getNextActiveDay(days)?.id).toBe("day-1");
    expect(getMapHighlights(days, mapPlaces)).toEqual([
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
      { label: "Ciutat Vella", value: "Tapas crawl" },
    ]);
  });

  it("returns null when every day is complete", () => {
    expect(getNextActiveDay(completedDays)).toBeNull();
  });

  it("skips empty placeholder days when finding the next active day", () => {
    expect(getNextActiveDay(placeholderDays)?.id).toBe("day-1");
  });

  it("treats a real empty day as the next active day", () => {
    expect(getNextActiveDay(realEmptyDays)?.id).toBe("day-0");
  });

  it("falls back to map places when itinerary days are empty", () => {
    expect(getMapHighlights([], mapPlaces)).toEqual([
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
      { label: "Ciutat Vella", value: "Tapas crawl" },
    ]);
  });

  it("backfills map highlights from map places when itinerary locations are partial", () => {
    expect(getMapHighlights([{ id: "day-1", locations: [{ id: "loc-1", name: "Airport transfer", completed: true }] }], mapPlaces)).toEqual([
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
      { label: "Ciutat Vella", value: "Tapas crawl" },
    ]);
  });

  it("preserves duplicate highlight names when the item identities differ", () => {
    expect(getMapHighlights(duplicateNameDays, [])).toEqual([
      { label: "Eixample", value: "Breakfast" },
      { label: "Gracia", value: "Breakfast" },
    ]);
  });

  it("backfills district labels when itinerary names vary by casing or whitespace", () => {
    expect(
      getMapHighlights(
        [
          {
            id: "day-1",
            locations: [
              { id: "loc-1", name: "  brunch stop  ", district: "", completed: true },
            ],
          },
        ],
        mapPlaces,
      ),
    ).toEqual([
      { label: "Born", value: "brunch stop" },
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
    ]);
  });

  it("backfills district labels when itinerary districts are whitespace-only", () => {
    expect(
      getMapHighlights(
        [
          {
            id: "day-1",
            locations: [
              { id: "loc-1", name: "Whitespace District", district: "   ", completed: true },
            ],
          },
        ],
        mapPlaces,
      ),
    ).toEqual([
      { label: "Route stop", value: "Whitespace District" },
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
    ]);
  });

  it("falls back to Route stop when duplicate normalized place names have conflicting districts", () => {
    expect(
      getMapHighlights(
        [
          {
            id: "day-1",
            locations: [{ id: "loc-1", name: "Duplicate District", completed: true }],
          },
        ],
        mapPlaces,
      ),
    ).toEqual([
      { label: "Route stop", value: "Duplicate District" },
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
    ]);
  });

  it("uses the nonblank district when duplicate normalized place names mix blank and nonblank districts", () => {
    expect(
      getMapHighlights(
        [
          {
            id: "day-1",
            locations: [{ id: "loc-1", name: "Mixed District", completed: true }],
          },
        ],
        mapPlaces,
      ),
    ).toEqual([
      { label: "Born", value: "Mixed District" },
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
    ]);
  });

  it("normalizes mapper defaults and strict completion flags", () => {
    expect(normalizeLocation({ completed: "yes" }, 0)).toEqual({
      id: "location-1",
      name: "Untitled stop",
      district: "",
      time: "",
      completed: false,
    });

    expect(normalizeLocation({ id: "loc-9", name: "Museum", district: "Eixample", time: "10:00", completed: true }, 3)).toEqual({
      id: "loc-9",
      name: "Museum",
      district: "Eixample",
      time: "10:00",
      completed: true,
    });

    expect(normalizeLocation({ name: "Cafe", district: "   ", time: "   ", completed: false }, 4)).toEqual({
      id: "location-5",
      name: "Cafe",
      district: "",
      time: "",
      completed: false,
    });

    expect(normalizeLocation({ name: "   ", completed: false }, 1)).toEqual({
      id: "location-2",
      name: "Untitled stop",
      district: "",
      time: "",
      completed: false,
    });

    expect(normalizeDay({ locations: [{ completed: 1 }, { completed: true }] }, 1)).toEqual({
      id: "day-2",
      label: "Day 2",
      title: "Planning in progress",
      note: "",
      locations: [
        { id: "location-1", name: "Untitled stop", district: "", time: "", completed: false },
        { id: "location-2", name: "Untitled stop", district: "", time: "", completed: true },
      ],
    });

    expect(normalizeDay({ title: "   ", locations: [] }, 0)).toEqual({
      id: "day-1",
      label: "Day 1",
      title: "Planning in progress",
      note: "",
      locations: [],
    });
  });

  it("counts real empty days but excludes explicit placeholders from trip day totals", () => {
    expect(
      getTripProgress([
        {
          id: "day-0",
          label: "Day 0",
          title: "Placeholder",
          isPlaceholder: true,
          locations: [{ id: "loc-0", name: "Hidden placeholder stop", district: "Transit", completed: true }],
        },
        { id: "day-1", label: "Day 1", title: "Flexible arrival", locations: [] },
        {
          id: "day-2",
          label: "Day 2",
          title: "Arrival",
          locations: [
            { id: "loc-1", completed: true },
            { id: "loc-2", completed: false },
          ],
        },
      ]),
    ).toEqual({
      completedCount: 1,
      totalCount: 2,
      percent: 50,
      completedDays: 0,
      totalDays: 2,
    });
  });

  it("skips explicit placeholder day locations when collecting map highlights", () => {
    expect(getMapHighlights(placeholderDays, mapPlaces)).toEqual([
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
      { label: "Ciutat Vella", value: "Tapas crawl" },
    ]);
  });

  it("omits blank location names from map highlights", () => {
    expect(
      getMapHighlights(
        [
          {
            id: "day-1",
            locations: [
              { id: "loc-1", name: "   ", district: "Transit", completed: true },
              { id: "loc-2", name: "\t", district: "Eixample", completed: false },
            ],
          },
        ],
        mapPlaces,
      ),
    ).toEqual([
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
      { label: "Ciutat Vella", value: "Tapas crawl" },
    ]);
  });
});
