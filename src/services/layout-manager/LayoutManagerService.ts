/**
 * Layout Manager Service
 * 
 * Main service class that manages keyboard layout switching.
 * Uses Python subprocess for reliable Windows API calls.
 */

import { EventEmitter } from 'events';
import { PythonBridge, type PythonBridgeResponse } from './python-bridge.js';
import type { LayoutManagerStatus } from './types.js';

export class LayoutManagerService extends EventEmitter {
  private pythonBridge: PythonBridge;
  private config: Record<string, { language: string; layoutId: number }> = {};
  private running: boolean = false;

  constructor(pythonPath: string = 'python') {
    super();
    this.pythonBridge = new PythonBridge(pythonPath);
  }

  /**
   * Initialize service - start Python bridge
   */
  async initialize(): Promise<void> {
    try {
      await this.pythonBridge.start();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Load configuration from Python
   */
  async loadConfig(): Promise<void> {
    try {
      const response = await this.pythonBridge.send({ command: 'get_config' });
      if (response.processes) {
        this.config = {};
        for (const proc of response.processes) {
          this.config[proc.name] = {
            language: proc.language,
            layoutId: proc.layoutId,
          };
        }
        this.emit('config:loaded', Object.keys(this.config).length);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Add process to configuration
   */
  async addProcess(processName: string, language: 'English' | 'Russian'): Promise<boolean> {
    try {
      const response = await this.pythonBridge.send({
        command: 'add_process',
        name: processName,
        language,
      });
      
      if (response.success) {
        await this.loadConfig(); // Reload config
        this.emit('process:added', processName, language);
        return true;
      }
      return false;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Remove process from configuration
   */
  async removeProcess(processName: string): Promise<boolean> {
    try {
      const response = await this.pythonBridge.send({
        command: 'remove_process',
        name: processName,
      });
      
      if (response.success) {
        await this.loadConfig(); // Reload config
        this.emit('process:removed', processName);
        return true;
      }
      return false;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Get all configured processes
   */
  getAllProcesses(): Array<{ name: string; language: string; layoutId: number }> {
    return Object.entries(this.config).map(([name, config]) => ({
      name,
      language: config.language,
      layoutId: config.layoutId,
    }));
  }

  /**
   * Start layout monitor
   */
  async start(): Promise<void> {
    try {
      await this.pythonBridge.send({ command: 'start_monitor' });
      this.running = true;
      this.emit('started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop layout monitor
   */
  async stop(): Promise<void> {
    try {
      await this.pythonBridge.send({ command: 'stop_monitor' });
      this.running = false;
      this.emit('stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if monitor is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get current status
   */
  async getStatus(): Promise<LayoutManagerStatus> {
    try {
      const response = await this.pythonBridge.send({ command: 'get_status' });
      return {
        running: response.running ?? false,
        currentProcess: response.currentProcess ?? null,
        currentLayout: response.currentLayout ?? 0,
        loadedConfigs: response.loadedConfigs ?? 0,
      };
    } catch (error) {
      this.emit('error', error);
      return {
        running: false,
        currentProcess: null,
        currentLayout: 0,
        loadedConfigs: 0,
      };
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.running) {
      await this.stop();
    }
    await this.pythonBridge.stop();
    this.emit('shutdown');
  }

  /**
   * Get switch history
   */
  async getHistory(limit: number = 100): Promise<Array<{ timestamp: string; process: string; from: string; to: string }>> {
    try {
      const response = await this.pythonBridge.send({ command: 'get_history', limit });
      return response.history || [];
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }
}
