/**
 * useStats Hook
 * Хук для реалтайм статистики через WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EventStats } from '../types/events.js';
// Logger removed for client-side

interface StatsUpdate {
  stats: EventStats;
  lastEventTime: string | null;
  isGameRunning: boolean;
  timestamp: string;
}

interface UseStatsOptions {
  autoConnect?: boolean;
  updateInterval?: number; // ms
  onGameRunningChange?: (isRunning: boolean) => void;
}

interface UseStatsReturn {
  stats: EventStats | null;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  isGameRunning: boolean;
  lastEventTime: string | null;
  lastUpdate: Date | null;
  latency: number | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function useStats(options: UseStatsOptions = {}): UseStatsReturn {
  const { autoConnect = true, updateInterval = 5000, onGameRunningChange } = options;

  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPongTimeRef = useRef<number>(0);

  const connect = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('[useStats] WebSocket connected');
        
        // Start ping interval for latency measurement
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            lastPongTimeRef.current = performance.now();
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 5000);
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          // Calculate latency for ping responses
          if (data.type === 'pong') {
            const now = performance.now();
            const latencyMs = Math.round(now - lastPongTimeRef.current);
            setLatency(latencyMs);
            return;
          }

          if (data.type === 'stats:update') {
            const update: StatsUpdate = data;
            setStats(update.stats);
            setIsGameRunning(update.isGameRunning);
            setLastEventTime(update.lastEventTime);
            setLastUpdate(new Date(update.timestamp));

            if (onGameRunningChange) {
              onGameRunningChange(update.isGameRunning);
            }
          }
        } catch (err) {
          console.error('[useStats] Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = event => {
        setIsConnected(false);
        console.log('[useStats] WebSocket closed:', event.code, event.reason);

        // Reconnect after 5 seconds
        if (autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[useStats] Reconnecting...');
            connect();
          }, 5000);
        }
      };

      ws.onerror = err => {
        console.error('[useStats] WebSocket error:', err);
        setError(new Error('WebSocket connection failed'));
      };
    } catch (err) {
      console.error('[useStats] Failed to create WebSocket:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [autoConnect, onGameRunningChange]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setIsConnected(false);
    setLoading(false);
    setLatency(null);
  }, []);

  // Fallback: HTTP polling if WebSocket not available
  const pollStats = useCallback(async () => {
    try {
      const response = await fetch('/api/events/stats');

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setIsGameRunning(data.isGameRunning);
        setLastEventTime(data.lastEventTime);
        setLastUpdate(new Date());
        setLoading(false);

        if (onGameRunningChange) {
          onGameRunningChange(data.isGameRunning);
        }
      }
    } catch (err) {
      console.error('[useStats] HTTP polling failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [onGameRunningChange]);

  // Initial connect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Also setup HTTP polling as fallback
    statsIntervalRef.current = setInterval(pollStats, updateInterval);

    return () => {
      disconnect();
    };
  }, []);

  return {
    stats,
    loading,
    error,
    isConnected,
    isGameRunning,
    lastEventTime,
    lastUpdate,
    latency,
    reconnect: connect,
    disconnect,
  };
}

export default useStats;
