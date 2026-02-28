/**
 * useEvents Hook
 * Cursor-based pagination for infinite scroll with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { EDEvent, CursorPaginationResponse } from "../types/events.js";

interface UseEventsOptions {
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseEventsReturn {
  events: EDEvent[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  cursor: string | null;
  total: number;
  isLive: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { pageSize = 50, autoLoad = true } = options;

  const [events, setEvents] = useState<EDEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastEventTimeRef = useRef<string>("");

  // Transform backend event to frontend format with robust JSON parsing
  const transformEvent = (e: any): EDEvent => {
    let parsedData = {};
    let rawJsonString = "";
    
    try {
      // Handle both raw_json and parsed_data (legacy) fields
      const rawJson = e.raw_json || e.parsed_data || "";
      rawJsonString = rawJson;
      
      if (rawJson) {
        try {
          parsedData = JSON.parse(rawJson);
        } catch (parseError) {
          console.warn(`Failed to parse JSON for event ${e.event_id || e.id}:`, parseError);
          // Try to extract data from other fields as fallback
          parsedData = e.data || {};
        }
      } else {
        parsedData = e.data || {};
      }
    } catch (error) {
      console.error(`Error transforming event ${e.event_id || e.id}:`, error);
      parsedData = {};
    }

    return {
      id: e.event_id || e.id || "",
      timestamp: e.timestamp,
      event: e.event_type || e.event,
      data: parsedData,
      rawLine: rawJsonString,
    };
  };

  // Fetch initial events (newest)
  const fetchInitialEvents = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Load limited events at startup (500) - balance between speed and usability
      // This prevents DOM overload with 80K+ events
      const url = "/api/v1/events?limit=500";
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data) {
        throw new Error("Invalid response format");
      }

      const transformedEvents = data.data.map(transformEvent);

      // Load initial batch - infinite scroll will load more as user scrolls
      setEvents(transformedEvents);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setTotal(data.total);
      console.log(
        `Loaded ${transformedEvents.length} events (more: ${data.hasMore})`,
      );

      // Initialize lastEventTimeRef
      if (transformedEvents.length > 0) {
        lastEventTimeRef.current = transformedEvents[0].timestamp;
      }

      return data;
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Fetch more events (older, for infinite scroll)
  const fetchMoreEvents = useCallback(
    async (cursorValue: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoadingMore(true);

      try {
        const url = `/api/v1/events?cursor=${encodeURIComponent(cursorValue)}&limit=${pageSize}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data: CursorPaginationResponse = await response.json();

        if (!data.data) {
          throw new Error("Invalid response format");
        }

        const newEvents = data.data.map(transformEvent);

        // Append new events to existing list
        setEvents((prev) => {
          const totalCount = prev.length + newEvents.length;
          console.log(
            `Loaded ${newEvents.length} more events (total: ${totalCount})${data.hasMore ? " (more available)" : " (all loaded)"}`,
          );
          return [...prev, ...newEvents];
        });
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);

        return data;
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
        return null;
      } finally {
        setLoadingMore(false);
      }
    },
    [pageSize],
  );

  // Load more handler for infinite scroll
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) {
      return;
    }
    await fetchMoreEvents(cursor);
  }, [hasMore, loadingMore, cursor, fetchMoreEvents]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetchInitialEvents();
  }, [fetchInitialEvents]);

  // Poll for new real-time events
  const pollForNewEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/events?limit=1");

      if (!response.ok) {
        return;
      }

      const data: CursorPaginationResponse = await response.json();

      if (data.data && data.data.length > 0) {
        const latestEvent = data.data[0] as any;
        const latestTimestamp = latestEvent.timestamp;

        // Check if it's a new event
        if (
          latestTimestamp !== lastEventTimeRef.current &&
          lastEventTimeRef.current
        ) {
          console.log(
            "[useEvents] New event detected:",
            latestEvent.event_type,
          );

          const newEvent = transformEvent(latestEvent);
          setEvents((prev) => [newEvent, ...prev.slice(0, pageSize - 1)]);
          setTotal((prev) => prev + 1);
        }

        lastEventTimeRef.current = latestTimestamp;
      }
    } catch (err) {
      console.error("[useEvents] Polling error:", err);
    }
  }, [pageSize]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    console.log("[useEvents] Starting polling");
    setIsLive(true);
    pollForNewEvents();
    pollingIntervalRef.current = setInterval(pollForNewEvents, 3000);
  }, [pollForNewEvents]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsLive(false);
  }, []);

  // Initial load and polling
  useEffect(() => {
    if (autoLoad) {
      fetchInitialEvents().then((data) => {
        if (data) {
          startPolling();
        }
      });
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopPolling();
    };
  }, [autoLoad, fetchInitialEvents, startPolling, stopPolling]);

  return {
    events,
    loading,
    loadingMore,
    error,
    hasMore,
    cursor,
    total,
    isLive,
    loadMore,
    refresh,
  };
}

export default useEvents;
