/**
 * Layout Manager Types
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

export interface LayoutConfigMap {
  [processName: string]: LayoutProcess;
}
