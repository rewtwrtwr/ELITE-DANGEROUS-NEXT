/**
 * Layout Manager API Client
 * 
 * Client methods for interacting with Layout Manager API endpoints.
 */

export interface LayoutProcess {
  name: string;
  language: 'English' | 'Russian';
  layoutId: number;
}

export interface LayoutManagerStatus {
  running: boolean;
  currentProcess: string | null;
  currentLayout: number;
  loadedConfigs: number;
}

export interface ApiError {
  error: string;
  message: string;
}

const BASE_URL = '/api/v1/layout-manager';

/**
 * Get all configured processes
 */
export async function getAllLayoutConfigs(): Promise<LayoutProcess[]> {
  console.log('[Layout API] Fetching all configs...');
  const response = await fetch(`${BASE_URL}/config`);
  console.log('[Layout API] Response status:', response.status);

  if (!response.ok) {
    const error: ApiError = await response.json();
    console.error('[Layout API] Error:', error);
    throw new Error(error.message || 'Failed to fetch layout configs');
  }

  const data = await response.json();
  console.log('[Layout API] Received configs:', data);
  return data.processes || [];
}

/**
 * Get configuration for a specific process
 */
export async function getLayoutConfig(processName: string): Promise<LayoutProcess | null> {
  const response = await fetch(`${BASE_URL}/config/${encodeURIComponent(processName)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch layout config');
  }
  
  return response.json();
}

/**
 * Add new process to configuration
 */
export async function addLayoutConfig(
  processName: string,
  language: 'English' | 'Russian'
): Promise<void> {
  const response = await fetch(`${BASE_URL}/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ processName, language }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to add process');
  }
}

/**
 * Update existing process configuration
 */
export async function updateLayoutConfig(
  processName: string,
  language: 'English' | 'Russian'
): Promise<void> {
  const response = await fetch(`${BASE_URL}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ processName, language }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update process');
  }
}

/**
 * Remove process from configuration
 */
export async function deleteLayoutConfig(processName: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/config/${encodeURIComponent(processName)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete process');
  }
}

/**
 * Import multiple configurations at once
 */
export async function importLayoutConfigs(configs: LayoutProcess[]): Promise<void> {
  const response = await fetch(`${BASE_URL}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ configs }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to import configs');
  }
}

/**
 * Export all configurations
 */
export async function exportLayoutConfigs(): Promise<LayoutProcess[]> {
  const response = await fetch(`${BASE_URL}/export`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to export configs');
  }
  
  return response.json();
}

/**
 * Start layout monitor
 */
export async function startMonitor(): Promise<void> {
  const response = await fetch(`${BASE_URL}/start`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to start monitor');
  }
}

/**
 * Stop layout monitor
 */
export async function stopMonitor(): Promise<void> {
  const response = await fetch(`${BASE_URL}/stop`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to stop monitor');
  }
}

/**
 * Get current monitor status
 */
export async function getMonitorStatus(): Promise<LayoutManagerStatus> {
  const response = await fetch(`${BASE_URL}/status`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to get status');
  }
  
  return response.json();
}
