/**
 * useProgressLoader Hook - Optimized for All-Events Loading
 *
 * Changes from previous version:
 * 1. Load ALL events at startup (for accurate stats)
 * 2. Store all events in memory
 * 3. Calculate stats from ALL events
 * 4. Display only first 50 in UI
 * 5. "Load more" button shows next 50 from memory (no API call)
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { EDEvent, EventStats } from "../types/events.js";

interface UseProgressLoaderOptions {
  /** How many events to show initially in UI */
  initialDisplayCount?: number;
  /** How many more events to show per "load more" click */
  loadMoreCount?: number;
}

interface UseProgressLoaderReturn {
  totalCount: number;
  loading: boolean;
  loadingProgress: number;
  loadingStatus: string;
  loadedCount: number;
  error: Error | null;
  hasMore: boolean;
  /** Events to display (subset of allEvents based on displayCount) */
  virtualItems: EDEvent[];
  /** How many events are currently visible in UI */
  visibleCount: number;
  /** Load more events (from memory, no API call) */
  loadMore: () => void;
  /** Refresh/reload all events */
  refresh: () => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** ALL loaded events (for stats calculation) */
  allEvents: EDEvent[];
  /** Stats calculated from ALL events */
  calculatedStats: EventStats | null;
}

interface AllEventsResponse {
  success: boolean;
  data: any[];
  total: number;
}

const transformEvent = (e: any): EDEvent => {
  let parsedData = {};
  if (e.raw_json) {
    try {
      parsedData = JSON.parse(e.raw_json);
    } catch (err) {
      console.warn(`[useProgressLoader] Failed to parse raw_json for event ${e.event_id || e.id}:`, err);
      parsedData = e.data || {};
    }
  } else {
    parsedData = e.data || {};
  }

  return {
    id: e.event_id || e.id || "",
    timestamp: String(e.timestamp || ""),
    event: e.event_type || e.event || "",
    data: parsedData,
    rawLine: e.raw_json,
  };
};

/**
 * Calculate stats from all events (same logic as backend)
 */
function calculateClientStats(events: EDEvent[]): EventStats {
  const eventsByType: Record<string, number> = {};
  const systems = new Set<string>();

  for (const event of events) {
    // Count by type
    eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;

    // Track unique systems from event data
    const starSystem = event.data?.StarSystem as string | undefined;
    const system = event.data?.System as string | undefined;
    if (starSystem) {
      systems.add(starSystem);
    }
    if (system) {
      systems.add(system);
    }
  }

  // Get first and last timestamps
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Calculate category counts (same as backend)
  const JUMP_EVENTS = [
    "SupercruiseEntry",
    "SupercruiseExit",
    "FSDJump",
    "StartJump",
  ];
  const COMBAT_EVENTS = [
    "Bounty",
    "CapShipBond",
    "FactionKillBond",
    "Died",
    "Interdicted",
  ];
  const TRADING_EVENTS = ["MarketBuy", "MarketSell", "Trade"];
  const EXPLORATION_EVENTS = [
    "Scan",
    "FSSDiscoveryScan",
    "SellExplorationData",
  ];

  let jumps = 0,
    combat = 0,
    trading = 0,
    exploration = 0;
  for (const [eventType, count] of Object.entries(eventsByType)) {
    if (JUMP_EVENTS.includes(eventType)) jumps += count;
    else if (COMBAT_EVENTS.includes(eventType)) combat += count;
    else if (TRADING_EVENTS.includes(eventType)) trading += count;
    else if (EXPLORATION_EVENTS.includes(eventType)) exploration += count;
  }

  return {
    totalEvents: events.length,
    jumps,
    combat,
    trading,
    exploration,
    mining: 0,
    totalJumps: jumps,
    tradingCredits: 0,
    explorationCredits: 0,
    combatCredits: 0,
    missions: 0,
    engineering: 0,
  };
}

export function useProgressLoader(
  options: UseProgressLoaderOptions = {},
): UseProgressLoaderReturn {
  const { initialDisplayCount = 50, loadMoreCount = 50 } = options;

  const [allEvents, setAllEvents] = useState<EDEvent[]>([]);
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Подготовка...");
  const [error, setError] = useState<Error | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const isLoadingRef = useRef(false);

  // Calculate hasMore based on displayCount vs total loaded
  const hasMore = useMemo(() => displayCount < allEvents.length, [displayCount, allEvents.length]);

  // Calculate visible count (what's shown in UI)
  const visibleCount = Math.min(displayCount, allEvents.length);

  // Get events to display (first N events based on displayCount)
  const virtualItems = useMemo(
    () => allEvents.slice(0, displayCount),
    [allEvents, displayCount],
  );

  // Calculate stats from ALL events
  const calculatedStats = useMemo(() => {
    if (allEvents.length === 0) return null;
    return calculateClientStats(allEvents);
  }, [allEvents]);

  // Reset handler
  const reset = useCallback(() => {
    setAllEvents([]);
    setDisplayCount(initialDisplayCount);
    setLoading(false);
    setLoadingProgress(0);
    setLoadingStatus("Подготовка...");
    setLoadedCount(0);
    setError(null);
    setIsInitialLoadComplete(false);
    isLoadingRef.current = false;
  }, [initialDisplayCount]);

  // Load ALL events at startup
  const loadAllEvents = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      setLoadingStatus("Сканирование журнала...");

      // Get total count first
      const countResponse = await fetch("/api/v1/events/count");
      if (!countResponse.ok) {
        throw new Error(`Failed to get count: ${countResponse.status}`);
      }
      const countData = await countResponse.json();
      const total = countData.count || 0;

      console.log(`[useProgressLoader] Total events in DB: ${total}`);

      if (total === 0) {
        setLoadingStatus("Нет событий для загрузки");
        setLoadingProgress(100);
        setLoading(false);
        isLoadingRef.current = false;
        setIsInitialLoadComplete(true);
        return;
      }

      setLoadingStatus("Загрузка всех событий...");

      // Request to /api/v1/events WITHOUT limit parameter
      // Backend returns ALL events when no limit is provided
      const response = await fetch("/api/v1/events");

      if (!response.ok) {
        throw new Error(`Load failed: ${response.status}`);
      }

      const result = await response.json();

      // Handle both formats: { data: [...] } or direct array
      const eventsArray = result.data || result;

      if (eventsArray && eventsArray.length > 0) {
        const transformed = eventsArray.map(transformEvent);
        setAllEvents(transformed);
        setLoadedCount(transformed.length);

        // Progress is 100% since we loaded all available
        setLoadingProgress(100);

        console.log(
          `[useProgressLoader] Loaded ALL ${transformed.length} events (no limit)`,
        );

        setLoadingStatus(
          `Загружено ${transformed.length.toLocaleString()} событий`,
        );
      }

      setIsInitialLoadComplete(true);
      setLoading(false);
      isLoadingRef.current = false;
    } catch (err) {
      console.error("[useProgressLoader] Error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoadingStatus("Ошибка загрузки");
      setLoading(false);
      isLoadingRef.current = false;
      setIsInitialLoadComplete(true); // Allow UI to show partial data
    }
  }, []);

  // "Load more" - just show more from memory, NO API call
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;

    const newDisplayCount = Math.min(displayCount + loadMoreCount, allEvents.length);
    
    console.log(`[useProgressLoader] LoadMore: displaying ${newDisplayCount} events (was ${displayCount})`, {
      allEventsLength: allEvents.length,
      hasMore,
      firstEvent: allEvents[0]?.timestamp,
      lastEvent: allEvents[allEvents.length - 1]?.timestamp
    });

    setDisplayCount(newDisplayCount);
  }, [hasMore, loading, loadMoreCount, allEvents.length, displayCount]);

  // Refresh handler
  const refresh = useCallback(async () => {
    reset();
    await loadAllEvents();
  }, [reset, loadAllEvents]);

  // Initial load on mount
  useEffect(() => {
    loadAllEvents();
  }, []);

  return {
    totalCount: allEvents.length,
    loading,
    loadingProgress,
    loadingStatus,
    loadedCount: allEvents.length,
    error,
    hasMore,
    virtualItems,
    visibleCount,
    loadMore,
    refresh,
    reset,
    allEvents,
    calculatedStats,
  };
}

export default useProgressLoader;
