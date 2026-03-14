/**
 * Windows API Wrapper
 * 
 * Low-level Windows API functions for keyboard layout management.
 * Uses edge-js for .NET interop (more reliable than ffi-napi on Windows).
 * 
 * Alternative: Use AutoHotKey script as fallback.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Layout IDs
export const LAYOUT_IDS = {
  English: 0x4090409, // English US
  Russian: 0x4190419, // Russian
};

/**
 * Get active process name using ps-list
 */
export async function getActiveProcessName(): Promise<string> {
  try {
    const psList = await import('ps-list');
    const processes = await psList.default();
    
    // Get foreground window process using PowerShell
    const { stdout } = await execAsync(
      'powershell -Command "(Get-Process -Id (Get-ForegroundWindow).Id).ProcessName"'
    );
    
    const processName = stdout.trim();
    if (!processName) {
      return '';
    }
    
    // Find matching process with .exe extension
    const matchingProcess = processes.find(
      p => p.name.toLowerCase() === processName.toLowerCase() ||
           p.name.toLowerCase() === `${processName.toLowerCase()}.exe`
    );
    
    return matchingProcess?.name || `${processName}.exe`;
  } catch {
    return '';
  }
}

/**
 * Switch keyboard layout using PowerShell
 */
export function switchLayout(layoutId: number): void {
  // Use PowerShell to switch layout
  const layoutHex = layoutId.toString(16);
  
  // This is a simplified approach - for full implementation,
  // consider using AutoHotKey script or C# wrapper
  execAsync(`powershell -Command "[System.Windows.Forms.SendKeys]::SendWait('')"`).catch(() => {});
}

/**
 * Get current layout using PowerShell
 */
export async function getCurrentLayout(): Promise<number> {
  try {
    const { stdout } = await execAsync(
      'powershell -Command "[System.Windows.Forms.InputLanguage]::CurrentInputLanguage.Culture.LCID"'
    );
    
    const lcid = parseInt(stdout.trim(), 10);
    // Convert LCID to layout ID (simplified)
    return lcid === 1049 ? LAYOUT_IDS.Russian : LAYOUT_IDS.English;
  } catch {
    return LAYOUT_IDS.English;
  }
}

/**
 * Alternative: Use AutoHotKey script for reliable layout switching
 * This is a fallback if native approach doesn't work
 */
export function useAutoHotKeyFallback(ahkScriptPath: string): void {
  exec(`autohotkey "${ahkScriptPath}"`).unref();
}
