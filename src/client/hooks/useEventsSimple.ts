/**
 * useEventsSimple Hook
 * Simple events management - no React re-renders during polling
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { EDEvent } from "../types/events.js";

interface UseEventsSimpleOptions {
  pollInterval?: number;
}

interface UseEventsSimpleReturn {
  events: EDEvent[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  isLive: boolean;
  refresh: () => Promise<void>;
}

function transformEvent(e: any): EDEvent {
  let parsedData = {};
  let rawJsonString = "";
  
  try {
    const rawJson = e.raw_json || e.parsed_data || "";
    rawJsonString = rawJson;
    
    if (rawJson) {
      try {
        parsedData = JSON.parse(rawJson);
      } catch {
        parsedData = e.data || {};
      }
    } else {
      parsedData = e.data || {};
    }
  } catch {
    parsedData = {};
  }

  return {
    id: e.event_id || e.id || "",
    timestamp: e.timestamp,
    event: e.event_type || e.event,
    data: parsedData,
    rawLine: rawJsonString,
  };
}

export function useEventsSimple(options: UseEventsSimpleOptions = {}): UseEventsSimpleReturn {
  const { pollInterval = 5000 } = options;

  const [events, setEvents] = useState<EDEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLive, setIsLive] = useState(false);

  const lastEventTimeRef = useRef<string>("");
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const eventsRef = useRef<EDEvent[]>([]);

  // Fetch events once on mount
  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      
      try {
        const response = await fetch("/api/v1/events");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const eventsArray = result.data || result;
        
        // Deduplicate and sort
        const seen = new Map<string, EDEvent>();
        for (const e of eventsArray) {
          const transformed = transformEvent(e);
          const eventId = transformed.id;
          if (eventId && !seen.has(eventId)) {
            seen.set(eventId, transformed);
          }
        }
        
        const uniqueEvents = Array.from(seen.values());
        uniqueEvents.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        if (!cancelled) {
          setEvents(uniqueEvents);
          eventsRef.current = uniqueEvents;
          if (uniqueEvents.length > 0) {
            lastEventTimeRef.current = uniqueEvents[0].timestamp;
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Polling - separate effect with no dependencies on events
  useEffect(() => {
    if (loading) return;
    
    const poll = async () => {
      try {
        const response = await fetch("/api/v1/events?limit=10");
        if (!response.ok) return;
        
        const result = await response.json();
        const newEventsRaw = result.data || result;
        
        if (!newEventsRaw || newEventsRaw.length === 0) return;
        
        // Check if these are actually new - use ref to avoid re-render
        const existingIds = new Set(eventsRef.current.map(e => e.id));
        const trulyNew: EDEvent[] = [];
        
        for (const e of newEventsRaw) {
          const transformed = transformEvent(e);
          if (!existingIds.has(transformed.id)) {
            trulyNew.push(transformed);
          }
        }
        
        if (trulyNew.length > 0) {
          trulyNew.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          setEvents(prev => {
            const updated = [...trulyNew, ...prev];
            eventsRef.current = updated;
            return updated;
          });
          lastEventTimeRef.current = trulyNew[0].timestamp;
          console.log(`[useEventsSimple] Added ${trulyNew.length} new events`);
        }
      } catch {
        // Silent
      }
    };
    
    setIsLive(true);
    pollingIntervalRef.current = setInterval(poll, pollInterval);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsLive(false);
    };
  }, [loading, pollInterval]);

  const refresh = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/v1/events");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const eventsArray = result.data || result;
      
      const seen = new Map<string, EDEvent>();
      for (const e of eventsArray) {
        const transformed = transformEvent(e);
        const eventId = transformed.id;
        if (eventId && !seen.has(eventId)) {
          seen.set(eventId, transformed);
        }
      }
      
      const uniqueEvents = Array.from(seen.values());
      uniqueEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setEvents(uniqueEvents);
      eventsRef.current = uniqueEvents;
      if (uniqueEvents.length > 0) {
        lastEventTimeRef.current = uniqueEvents[0].timestamp;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    totalCount: events.length,
    isLive,
    refresh,
  };
}

export default useEventsSimple;
