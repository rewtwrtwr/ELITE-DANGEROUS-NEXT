/**
 * Layout Config Panel
 * 
 * Main UI component for managing layout manager configurations.
 */

import type { FC, KeyboardEvent, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';
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
      setFormError(err instanceof Error ? err.message : 'Failed to add process');
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
      </div>

      {/* Process List */}
      <div className="layout-process-list">
        <h3 className="list-title">Configured Processes</h3>
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

      {/* Help Text */}
      <div className="layout-help">
        <h4>How it works:</h4>
        <ul>
          <li>Add process names (must end with .exe)</li>
          <li>Select the language for each process</li>
          <li>Click &quot;Start Monitor&quot; to enable automatic switching</li>
          <li>When you switch to a configured process, the layout will automatically change</li>
        </ul>
      </div>
    </div>
  );
};
