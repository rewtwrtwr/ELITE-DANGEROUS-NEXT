/**
 * Layout Manager Service
 * 
 * Main service class that manages keyboard layout switching.
 */

import { EventEmitter } from 'events';
import { 
  getCurrentLayout, 
  switchLayout, 
  getActiveProcessName,
  LAYOUT_IDS 
} from './windows-api.js';
import { loadConfig, saveConfig, type LayoutConfig, type ProcessConfig } from './layout-config.js';
import type { LayoutManagerStatus } from './types.js';

export class LayoutManagerService extends EventEmitter {
  private config: LayoutConfig = {};
  private configFile: string;
  private running: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private currentProcess: string | null = null;
  private lastLayoutSwitch: number = 0;
  private readonly SWITCH_COOLDOWN = 1000; // 1 second cooldown

  constructor(configFile: string = 'data/layout-manager-config.ini') {
    super();
    this.configFile = configFile;
  }

  /**
   * Load configuration from file
   */
  loadConfig(): void {
    this.config = loadConfig(this.configFile);
    this.emit('config:loaded', Object.keys(this.config).length);
  }

  /**
   * Save configuration to file
   */
  saveConfig(): void {
    saveConfig(this.config, this.configFile);
    this.emit('config:saved');
  }

  /**
   * Add process to configuration
   */
  addProcess(processName: string, language: 'English' | 'Russian'): boolean {
    // Validate process name
    if (!processName.toLowerCase().endsWith('.exe')) {
      return false;
    }

    // Check for duplicates
    const normalizedName = this.normalizeProcessName(processName);
    if (this.config[normalizedName]) {
      return false;
    }

    // Add to config
    this.config[normalizedName] = {
      language,
      layoutId: language === 'Russian' ? LAYOUT_IDS.Russian : LAYOUT_IDS.English,
    };

    this.emit('process:added', normalizedName, language);
    return true;
  }

  /**
   * Remove process from configuration
   */
  removeProcess(processName: string): boolean {
    const normalizedName = this.normalizeProcessName(processName);
    if (this.config[normalizedName]) {
      delete this.config[normalizedName];
      this.emit('process:removed', normalizedName);
      return true;
    }
    return false;
  }

  /**
   * Update process configuration
   */
  updateProcess(processName: string, language: 'English' | 'Russian'): boolean {
    const normalizedName = this.normalizeProcessName(processName);
    if (this.config[normalizedName]) {
      this.config[normalizedName] = {
        language,
        layoutId: language === 'Russian' ? LAYOUT_IDS.Russian : LAYOUT_IDS.English,
      };
      this.emit('process:updated', normalizedName, language);
      return true;
    }
    return false;
  }

  /**
   * Get all configured processes
   */
  getAllProcesses(): Array<{ name: string; language: 'English' | 'Russian'; layoutId: number }> {
    return Object.entries(this.config).map(([name, config]) => ({
      name,
      language: config.language,
      layoutId: config.layoutId,
    }));
  }

  /**
   * Get configuration for a specific process
   */
  getProcessConfig(processName: string): ProcessConfig | null {
    const normalizedName = this.normalizeProcessName(processName);
    return this.config[normalizedName] || null;
  }

  /**
   * Start background monitor
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.loadConfig();
    
    // Start monitoring loop (500ms interval)
    this.monitorInterval = setInterval(() => {
      this.monitorLoop();
    }, 500);

    this.emit('started');
  }

  /**
   * Stop background monitor
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.running = false;
    this.currentProcess = null;
    this.emit('stopped');
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
    return {
      running: this.running,
      currentProcess: this.currentProcess,
      currentLayout: await getCurrentLayout(),
      loadedConfigs: Object.keys(this.config).length,
    };
  }

  /**
   * Manually switch layout for a specific process
   */
  forceSwitch(processName: string): boolean {
    const config = this.getProcessConfig(processName);
    if (!config) {
      return false;
    }

    switchLayout(config.layoutId);
    this.emit('layout:switched', processName, config.language);
    return true;
  }

  /**
   * Internal: Monitor loop
   */
  private async monitorLoop(): Promise<void> {
    try {
      // Get active process name
      const processName = await getActiveProcessName();
      
      if (!processName) {
        return;
      }

      const normalizedName = this.normalizeProcessName(processName);

      // Check if process is in config
      const config = this.config[normalizedName];
      if (!config) {
        return;
      }

      // Check cooldown
      const now = Date.now();
      if (now - this.lastLayoutSwitch < this.SWITCH_COOLDOWN) {
        return;
      }

      // Get current layout
      const currentLayout = await getCurrentLayout();

      // Switch if different
      if (currentLayout !== config.layoutId) {
        switchLayout(config.layoutId);
        this.lastLayoutSwitch = now;
        this.currentProcess = normalizedName;
        this.emit('layout:auto-switched', normalizedName, config.language);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Normalize process name (lowercase)
   */
  private normalizeProcessName(name: string): string {
    return name.toLowerCase();
  }
}
