/**
 * Layout Manager Types
 */

export interface LayoutConfig {
  [processName: string]: ProcessConfig;
}

export interface ProcessConfig {
  language: 'English' | 'Russian';
  layoutId: number; // Hex layout ID (e.g., 0x4090409)
}

export interface LayoutManagerStatus {
  running: boolean;
  currentProcess: string | null;
  currentLayout: number;
  loadedConfigs: number;
}

export interface WindowsApiFunctions {
  getForegroundWindow(): number;
  getWindowThreadProcessId(hwnd: number): { threadId: number; processId: number };
  getKeyboardLayout(hwnd: number): number;
  postMessageW(hwnd: number, msg: number, wParam: number, lParam: number): boolean;
  getProcessNameByPid(pid: number): Promise<string>;
}
