/**
 * Layout Config Panel
 * 
 * Main UI component for managing layout manager configurations.
 */

import type { FC, KeyboardEvent, ChangeEvent } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useLayoutManager } from '../../hooks/useLayoutManager.js';
import type { LayoutProcess } from '../../api/layout-manager.js';
import './LayoutConfigPanel.css';

export const LayoutConfigPanel: FC = () => {
  const {
    processes,
    status,
    loading,
    error,
    refreshProcesses,
    refreshStatus,
    addProcess,
    deleteProcess,
    startMonitor,
    stopMonitor,
    isRunning,
    currentProcess,
  } = useLayoutManager();

  // Form state
  const [processName, setProcessName] = useState('');
  const [language, setLanguage] = useState<'English' | 'Russian'>('English');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [history, setHistory] = useState<Array<{ timestamp: string; process: string; from: string; to: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load autoStart setting on mount
  useEffect(() => {
    fetch('/api/v1/layout-manager/settings/auto-start')
      .then(res => res.json())
      .then(data => setAutoStart(data.enabled))
      .catch(err => console.error('Failed to load autoStart setting:', err));
  }, []);

  /**
   * Handle toggle autoStart
   */
  const handleToggleAutoStart = useCallback(async () => {
    const newValue = !autoStart;
    try {
      const response = await fetch('/api/v1/layout-manager/settings/auto-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      });
      
      if (response.ok) {
        setAutoStart(newValue);
        setSuccessMessage(newValue ? 'Auto-start enabled' : 'Auto-start disabled');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle autoStart:', err);
    }
  }, [autoStart]);

  /**
   * Load history
   */
  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/layout-manager/history?limit=50');
      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  /**
   * Format timestamp
   */
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  }, []);

  /**
   * Switch to Russian layout
   */
  const switchToRussian = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/layout-manager/switch/russian', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.switched) {
        setSuccessMessage('Switched to Russian');
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    } catch (err) {
      console.error('Failed to switch to Russian:', err);
    }
  }, []);

  /**
   * Switch to English layout
   */
  const switchToEnglish = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/layout-manager/switch/english', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.switched) {
        setSuccessMessage('Switched to English');
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    } catch (err) {
      console.error('Failed to switch to English:', err);
    }
  }, []);

  // Global hotkey listener
  useEffect(() => {
    const handleGlobalHotkey = (event: KeyboardEvent) => {
      // Ctrl+Alt+R → Russian
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        switchToRussian();
      }
      // Ctrl+Alt+E → English
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        switchToEnglish();
      }
    };

    window.addEventListener('keydown', handleGlobalHotkey);
    return () => window.removeEventListener('keydown', handleGlobalHotkey);
  }, [switchToRussian, switchToEnglish]);

  /**
   * Validate process name
   */
  const validateProcessName = useCallback((name: string): boolean => {
    if (!name.trim()) {
      setFormError('Process name is required');
      return false;
    }
    if (!name.toLowerCase().endsWith('.exe')) {
      setFormError('Process name must end with .exe');
      return false;
    }
    if (processes.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setFormError('Process already exists');
      return false;
    }
    setFormError(null);
    return true;
  }, [processes]);

  /**
   * Handle add process
   */
  const handleAddProcess = useCallback(async () => {
    if (!validateProcessName(processName)) {
      return;
    }

    try {
      await addProcess(processName.trim(), language);
      setProcessName('');
      setSuccessMessage(`Added ${processName} with ${language} layout`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add process';
      if (message.includes('already exists')) {
        setFormError('Process already exists - delete it first or choose different name');
      } else {
        setFormError(message);
      }
    }
  }, [processName, language, addProcess, validateProcessName]);

  /**
   * Handle delete process
   */
  const handleDeleteProcess = useCallback(async (name: string) => {
    try {
      await deleteProcess(name);
      setSuccessMessage(`Removed ${name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete process');
    }
  }, [deleteProcess]);

  /**
   * Handle start/stop monitor
   */
  const handleToggleMonitor = useCallback(async () => {
    try {
      if (isRunning) {
        await stopMonitor();
        setSuccessMessage('Layout monitor stopped');
      } else {
        await startMonitor();
        setSuccessMessage('Layout monitor started');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to toggle monitor');
    }
  }, [isRunning, startMonitor, stopMonitor]);

  /**
   * Handle key press (Enter to add)
   */
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddProcess();
    }
  }, [handleAddProcess]);

  if (loading) {
    return (
      <div className="layout-config-panel">
        <div className="layout-loading">Loading layout manager...</div>
      </div>
    );
  }

  return (
    <div className="layout-config-panel">
      <div className="layout-header">
        <h2 className="layout-title">Layout Manager</h2>
        <div className={`layout-status ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-indicator" />
          {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>

      {error && (
        <div className="layout-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="layout-success">
          {successMessage}
        </div>
      )}

      {/* Current Status */}
      <div className="layout-status-panel">
        <div className="status-item">
          <span className="status-label">Current Process:</span>
          <span className="status-value">{currentProcess || 'None'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Configured Processes:</span>
          <span className="status-value">{processes.length}</span>
        </div>
      </div>

      {/* Add Process Form */}
      <div className="layout-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="processName" className="form-label">
              Process Name
            </label>
            <input
              id="processName"
              type="text"
              className="form-input"
              value={processName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setProcessName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="EliteDangerous64.exe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="language" className="form-label">
              Language
            </label>
            <select
              id="language"
              className="form-select"
              value={language}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as 'English' | 'Russian')}
            >
              <option value="English">English (US)</option>
              <option value="Russian">Russian</option>
            </select>
          </div>
        </div>

        {formError && (
          <div className="form-error">{formError}</div>
        )}

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleAddProcess}
            disabled={!processName || !!formError}
          >
            Add Process
          </button>
          <button
            className={`btn ${isRunning ? 'btn-danger' : 'btn-success'}`}
            onClick={handleToggleMonitor}
          >
            {isRunning ? 'Stop Monitor' : 'Start Monitor'}
          </button>
        </div>
        
        <div className="form-row" style={{ marginTop: '15px' }}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="autoStart"
              type="checkbox"
              checked={autoStart}
              onChange={handleToggleAutoStart}
              style={{ width: 'auto', margin: 0 }}
            />
            <label htmlFor="autoStart" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Auto-start monitoring on app launch
            </label>
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="layout-process-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 className="list-title" style={{ margin: 0 }}>Configured Processes</h3>
          <button
            className="btn btn-primary"
            onClick={() => {
              loadHistory();
              setShowHistory(true);
            }}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            📜 View History
          </button>
        </div>
        {processes.length === 0 ? (
          <div className="empty-state">
            No processes configured. Add your first process above.
          </div>
        ) : (
          <table className="process-table">
            <thead>
              <tr>
                <th className="table-header">Process Name</th>
                <th className="table-header">Language</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process) => (
                <tr key={process.name} className="table-row">
                  <td className="table-cell">{process.name}</td>
                  <td className="table-cell">{process.language}</td>
                  <td className="table-cell">
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteProcess(process.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="layout-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="layout-modal" style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#00a8ff' }}>Switch History</h3>
              <button
                className="btn btn-small btn-danger"
                onClick={() => setShowHistory(false)}
                style={{ padding: '6px 12px' }}
              >
                ✕ Close
              </button>
            </div>
            {history.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                No switch history yet. Switches will be logged here when monitor is running.
              </div>
            ) : (
              <table className="process-table">
                <thead>
                  <tr>
                    <th className="table-header">Time</th>
                    <th className="table-header">Process</th>
                    <th className="table-header">Switch</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell" style={{ fontSize: '12px' }}>
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="table-cell">{entry.process}</td>
                      <td className="table-cell">
                        <span style={{ color: '#ff4444' }}>{entry.from}</span>
                        <span style={{ margin: '0 8px' }}>→</span>
                        <span style={{ color: '#00ff88' }}>{entry.to}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="layout-help">
        <h4>How it works:</h4>
        <ul>
          <li>Add process names (must end with .exe)</li>
          <li>Select the language for each process</li>
          <li>Click &quot;Start Monitor&quot; to enable automatic switching</li>
          <li>When you switch to a configured process, the layout will automatically change</li>
        </ul>
        <h4>⌨️ Hotkeys:</h4>
        <ul>
          <li><kbd style={{ backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', color: '#00ff88' }}>Ctrl+Alt+R</kbd> → Switch to Russian</li>
          <li><kbd style={{ backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', color: '#00ff88' }}>Ctrl+Alt+E</kbd> → Switch to English</li>
        </ul>
      </div>
    </div>
  );
};
