/**
 * Layout Manager Settings
 * 
 * Persistent settings storage for Layout Manager.
 * Stored in data/layout-settings.json
 */

import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'layout-settings.json');

export interface LayoutSettings {
  autoStart: boolean;
  lastProfile: string;
  hotkeys: {
    switchToRussian: string;
    switchToEnglish: string;
  };
}

const DEFAULT_SETTINGS: LayoutSettings = {
  autoStart: false,
  lastProfile: 'default',
  hotkeys: {
    switchToRussian: 'Ctrl+Alt+R',
    switchToEnglish: 'Ctrl+Alt+E',
  },
};

/**
 * Load settings from file
 */
export function loadSettings(): LayoutSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load layout settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to file
 */
export function saveSettings(settings: Partial<LayoutSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    
    // Ensure data directory exists
    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save layout settings:', error);
  }
}

/**
 * Get autoStart setting
 */
export function getAutoStart(): boolean {
  return loadSettings().autoStart;
}

/**
 * Set autoStart setting
 */
export function setAutoStart(enabled: boolean): void {
  saveSettings({ autoStart: enabled });
}
