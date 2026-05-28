"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "../../../lib/api/client";

/**
 * useRatedHistory — fetches paginated rated trip summaries with detail caching.
 *
 * Filters (destination, durationDays, season) cause a list-cache clear and reset
 * to page 1. Detail cache persists across filter changes.
 *
 * agencyId changes clear both caches and reset state.
 *
 * @param {object} opts
 * @param {string} opts.agencyId - required; when changed, clears all caches
 * @param {object} [opts.filters={}] - { destination?: string, durationDays?: number, season?: 'spring'|'summer'|'fall'|'winter' }
 *
 * @returns {{
 *   trips: Array<{id, destination, duration, rating, ...}>,
 *   isLoading: boolean,
 *   hasMore: boolean,
 *   loadMore: () => void,
 *   getDetail: (tripId: string) => Promise<RatedItinerary>,
 *   error: Error | null,
 *   refetch: () => void
 * }}
 */
export function useRatedHistory({ agencyId, filters = {} }) {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Track current page (1-indexed) for pagination.
  const currentPageRef = useRef(1);

  // Map<tripId, Promise<RatedItinerary>> for detail caching.
  const detailCacheRef = useRef(new Map());

  // AbortController for cancelling in-flight list requests.
  const abortControllerRef = useRef(null);

  // Track previous agencyId and filter string to detect changes.
  const prevAgencyIdRef = useRef(null);
  const prevFiltersRef = useRef("");

  // State refs to access latest values in async context without re-creating callbacks.
  const agencyIdRef = useRef(agencyId);
  const filtersRef = useRef(filters);

  // Keep refs in sync with current props.
  useEffect(() => {
    agencyIdRef.current = agencyId;
    filtersRef.current = filters;
  }, [agencyId, filters]);

  /**
   * Internal fetch for list — called by public methods and effects.
   */
  const doFetchList = useCallback(
    async (page, append = false) => {
      const currentAgencyId = agencyIdRef.current;
      const currentFilters = filtersRef.current;

      if (!currentAgencyId) return;

      setIsLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
        });
        if (currentFilters.destination)
          params.set("destination", currentFilters.destination);
        if (currentFilters.durationDays !== undefined)
          params.set(
            "durationDays",
            currentFilters.durationDays.toString()
          );
        if (currentFilters.season) params.set("season", currentFilters.season);

        const result = await fetchApi(
          `/agencies/${currentAgencyId}/rated-history?${params.toString()}`,
          {
            signal: abortControllerRef.current.signal,
          }
        );

        if (abortControllerRef.current?.signal.aborted) return;

        const newTrips = result.trips || [];
        setTrips((prev) => (append ? [...prev, ...newTrips] : newTrips));
        setHasMore(result.hasMore ?? false);
        currentPageRef.current = page;
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * getDetail — cached detail fetch.
   */
  const getDetail = useCallback(
    (tripId) => {
      const currentAgencyId = agencyIdRef.current;
      if (!currentAgencyId || !tripId) {
        return Promise.reject(new Error("agencyId and tripId required"));
      }

      const cached = detailCacheRef.current.get(tripId);
      if (cached) {
        return cached;
      }

      const promise = fetchApi(
        `/agencies/${currentAgencyId}/rated-history/${tripId}`
      )
        .then((result) => {
          return result.itinerary;
        })
        .catch((err) => {
          detailCacheRef.current.delete(tripId);
          throw err;
        });

      detailCacheRef.current.set(tripId, promise);
      return promise;
    },
    []
  );

  /**
   * loadMore — append next page if hasMore and not already loading.
   */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    doFetchList(currentPageRef.current + 1, true);
  }, [hasMore, isLoading, doFetchList]);

  /**
   * refetch — reset to page 1 and re-fetch (keeps trips visible).
   */
  const refetch = useCallback(() => {
    currentPageRef.current = 1;
    setHasMore(true);
    doFetchList(1, false);
  }, [doFetchList]);

  /**
   * Main effect: detect agencyId or filter changes.
   */
  useEffect(() => {
    if (!agencyId) return;

    const newFilterString = JSON.stringify(filters);
    const agencyChanged = prevAgencyIdRef.current !== agencyId;
    const filtersChanged = prevFiltersRef.current !== newFilterString;

    // agencyId change: clear both caches.
    if (agencyChanged) {
      detailCacheRef.current.clear();
      setTrips([]);
      currentPageRef.current = 1;
      setHasMore(true);
      setError(null);
      prevAgencyIdRef.current = agencyId;
      prevFiltersRef.current = newFilterString;
      doFetchList(1, false);
      return;
    }

    // Filters change: clear list cache only.
    if (filtersChanged) {
      setTrips([]);
      currentPageRef.current = 1;
      setHasMore(true);
      setError(null);
      prevFiltersRef.current = newFilterString;
      doFetchList(1, false);
      return;
    }

    // Initial mount: fetch.
    if (!prevAgencyIdRef.current) {
      prevAgencyIdRef.current = agencyId;
      prevFiltersRef.current = newFilterString;
      doFetchList(1, false);
    }
  }, [agencyId, filters, doFetchList]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    trips,
    isLoading,
    hasMore,
    loadMore,
    getDetail,
    error,
    refetch,
  };
}

export default useRatedHistory;
