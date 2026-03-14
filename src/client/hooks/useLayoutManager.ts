/**
 * Layout Manager Hook
 * 
 * React hook for managing layout manager state and operations.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as layoutManagerApi from '../api/layout-manager.js';
import type { LayoutProcess, LayoutManagerStatus } from '../api/layout-manager.js';

interface UseLayoutManagerResult {
  // State
  processes: LayoutProcess[];
  status: LayoutManagerStatus | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshProcesses: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  addProcess: (name: string, language: 'English' | 'Russian') => Promise<void>;
  updateProcess: (name: string, language: 'English' | 'Russian') => Promise<void>;
  deleteProcess: (name: string) => Promise<void>;
  startMonitor: () => Promise<void>;
  stopMonitor: () => Promise<void>;
  importConfigs: (configs: LayoutProcess[]) => Promise<void>;
  exportConfigs: () => Promise<LayoutProcess[]>;
  
  // Computed
  isRunning: boolean;
  currentProcess: string | null;
  currentLayout: number;
}

export function useLayoutManager(): UseLayoutManagerResult {
  const [processes, setProcesses] = useState<LayoutProcess[]>([]);
  const [status, setStatus] = useState<LayoutManagerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Refresh processes list
   */
  const refreshProcesses = useCallback(async () => {
    try {
      const data = await layoutManagerApi.getAllLayoutConfigs();
      setProcesses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch processes');
    }
  }, []);

  /**
   * Refresh status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const data = await layoutManagerApi.getMonitorStatus();
      setStatus(data);
    } catch (err) {
      // Silently fail for status updates
      console.warn('Failed to fetch layout manager status:', err);
    }
  }, []);

  /**
   * Add new process
   */
  const addProcess = useCallback(async (name: string, language: 'English' | 'Russian') => {
    await layoutManagerApi.addLayoutConfig(name, language);
    await refreshProcesses();
  }, [refreshProcesses]);

  /**
   * Update process
   */
  const updateProcess = useCallback(async (name: string, language: 'English' | 'Russian') => {
    await layoutManagerApi.updateLayoutConfig(name, language);
    await refreshProcesses();
  }, [refreshProcesses]);

  /**
   * Delete process
   */
  const deleteProcess = useCallback(async (name: string) => {
    await layoutManagerApi.deleteLayoutConfig(name);
    await refreshProcesses();
  }, [refreshProcesses]);

  /**
   * Start monitor
   */
  const startMonitorAction = useCallback(async () => {
    await layoutManagerApi.startMonitor();
    await refreshStatus();
  }, [refreshStatus]);

  /**
   * Stop monitor
   */
  const stopMonitorAction = useCallback(async () => {
    await layoutManagerApi.stopMonitor();
    await refreshStatus();
  }, [refreshStatus]);

  /**
   * Import configs
   */
  const importConfigs = useCallback(async (configs: LayoutProcess[]) => {
    await layoutManagerApi.importLayoutConfigs(configs);
    await refreshProcesses();
  }, [refreshProcesses]);

  /**
   * Export configs
   */
  const exportConfigs = useCallback(async () => {
    return await layoutManagerApi.exportLayoutConfigs();
  }, []);

  // Initial load
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await Promise.all([refreshProcesses(), refreshStatus()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [refreshProcesses, refreshStatus]);

  // Poll status every 5 seconds when running
  useEffect(() => {
    if (status?.running) {
      statusIntervalRef.current = setInterval(refreshStatus, 5000);
    }
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [status?.running, refreshStatus]);

  return {
    // State
    processes,
    status,
    loading,
    error,
    
    // Actions
    refreshProcesses,
    refreshStatus,
    addProcess,
    updateProcess,
    deleteProcess,
    startMonitor: startMonitorAction,
    stopMonitor: stopMonitorAction,
    importConfigs,
    exportConfigs,
    
    // Computed
    isRunning: status?.running ?? false,
    currentProcess: status?.currentProcess ?? null,
    currentLayout: status?.currentLayout ?? 0,
  };
}
