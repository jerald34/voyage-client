"use client";

import { useMemo } from "react";

import { initialMapPlaces } from "../data/prototype/trip-dashboard.js";
import { getDayProgress, getTripProgress } from "../lib/trip-dashboard/progress.js";
import { getMapHighlights, getNextActiveDay } from "../lib/trip-dashboard/selectors.js";

function getSafeDays(days) {
  return Array.isArray(days) ? days : [];
}

function updateDayLocations(day, updater) {
  const locations = Array.isArray(day?.locations) ? day.locations : [];

  return {
    ...day,
    locations: locations.map(updater),
  };
}

export function useTripDashboard({ days, setDays, tripBrief, mapPlaces = initialMapPlaces }) {
  const dashboardDays = useMemo(
    () =>
      getSafeDays(days).map((day) => ({
        ...day,
        progress: getDayProgress(day),
      })),
    [days],
  );

  const tripProgress = useMemo(() => getTripProgress(dashboardDays), [dashboardDays]);
  const nextActiveDay = useMemo(() => getNextActiveDay(dashboardDays), [dashboardDays]);
  const mapHighlights = useMemo(() => getMapHighlights(dashboardDays, mapPlaces), [dashboardDays, mapPlaces]);

  function toggleLocationComplete(dayId, locationId) {
    setDays((currentDays) =>
      getSafeDays(currentDays).map((day) => {
        if (day?.id !== dayId) {
          return day;
        }

        return updateDayLocations(day, (location) =>
          location?.id !== locationId
            ? location
            : {
                ...location,
                completed: !location.completed,
              },
        );
      }),
    );
  }

  function markDayDone(dayId) {
    setDays((currentDays) =>
      getSafeDays(currentDays).map((day) => {
        if (day?.id !== dayId) {
          return day;
        }

        return updateDayLocations(day, (location) => ({
          ...location,
          completed: true,
        }));
      }),
    );
  }

  return {
    tripBrief,
    days: dashboardDays,
    tripProgress,
    nextActiveDay,
    mapHighlights,
    toggleLocationComplete,
    markDayDone,
  };
}

export default useTripDashboard;
