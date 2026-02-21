/**
 * useWebSocket Hook
 * Socket.IO client for real-time events from Elite Dangerous server
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { EDEvent } from '../types/events.js';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  onEvent?: (event: EDEvent) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  error: Error | null;
  lastEvent: EDEvent | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    onEvent,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<EDEvent | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socketUrl = window.location.origin;
      console.log('[useWebSocket] Connecting to:', socketUrl);

      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectInterval,
        reconnectionDelayMax: 30000,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[useWebSocket] Connected, socket id:', socket.id);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      });

      socket.on('disconnect', (reason) => {
        console.log('[useWebSocket] Disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('[useWebSocket] Connection error:', err.message);
        setError(new Error(err.message));
      });

      socket.on('journal:event', (data: { timestamp: string; event: string; data: Record<string, unknown> }) => {
        console.log('[useWebSocket] Received journal:event:', data.event);
        
        const edEvent: EDEvent = {
          id: crypto.randomUUID(),
          timestamp: data.timestamp || new Date().toISOString(),
          event: data.event,
          data: data.data,
          rawLine: JSON.stringify(data.data),
        };
        
        setLastEvent(edEvent);
        onEvent?.(edEvent);
      });

      socket.on('stats:update', (data: { stats: Record<string, unknown>; lastEventTime: string | null; timestamp: string }) => {
        console.log('[useWebSocket] Received stats:update');
      });

      socket.on('backfill:complete', (data: { totalEvents: number }) => {
        console.log('[useWebSocket] Backfill complete, total events:', data.totalEvents);
      });

      socket.on('error', (err) => {
        console.error('[useWebSocket] Socket error:', err);
      });

    } catch (err) {
      console.error('[useWebSocket] Failed to create socket:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [onEvent, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    error,
    lastEvent,
    connect,
    disconnect,
  };
}

export default useWebSocket;
