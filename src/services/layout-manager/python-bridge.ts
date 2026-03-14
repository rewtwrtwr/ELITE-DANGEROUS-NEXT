/**
 * Python Bridge for Layout Manager
 * 
 * Spawns Python subprocess and communicates via JSON over stdin/stdout.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface PythonBridgeCommand {
  command: string;
  name?: string;
  language?: 'English' | 'Russian';
}

export interface PythonBridgeResponse {
  success: boolean;
  error?: string;
  message?: string;
  processes?: Array<{ name: string; language: string; layoutId: number }>;
  running?: boolean;
  currentProcess?: string | null;
  currentLayout?: number;
  loadedConfigs?: number;
}

export interface PythonBridgeStatus {
  type: 'status';
  event: string;
  args: unknown[];
  timestamp: number;
}

export class PythonBridge extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private buffer = '';
  private ready = false;
  private commandQueue: Array<{
    command: PythonBridgeCommand;
    resolve: (response: PythonBridgeResponse) => void;
    reject: (error: Error) => void;
  }> = [];
  private pendingCommand: {
    command: PythonBridgeCommand;
    resolve: (response: PythonBridgeResponse) => void;
    reject: (error: Error) => void;
  } | null = null;

  private readonly pythonPath: string;

  constructor(pythonPath: string = 'python') {
    super();
    this.pythonPath = pythonPath;
  }

  /**
   * Start Python subprocess
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Path is relative to project root (builds/ELITE-DANGEROUS-NEXT/)
      const cliPath = path.join(__dirname, '..', '..', '..', 'layout-manager', 'cli.py');
      
      this.pythonProcess = spawn(this.pythonPath, [cliPath, '--stdin'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.pythonProcess.stdout?.on('data', (data: Buffer) => {
        this.handleOutput(data.toString());
      });

      this.pythonProcess.stderr?.on('data', (data: Buffer) => {
        console.error('[Python Bridge Error]:', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`[Python Bridge] Process exited with code ${code}`);
        this.ready = false;
        this.emit('close', code);
        
        // Reject pending command if any
        if (this.pendingCommand) {
          this.pendingCommand.reject(new Error('Python process closed'));
          this.pendingCommand = null;
        }
      });

      this.pythonProcess.on('error', (error) => {
        console.error('[Python Bridge] Process error:', error);
        reject(error);
      });

      // Wait for ready signal (timeout 5 seconds)
      const timeout = setTimeout(() => {
        reject(new Error('Python bridge timeout - failed to start'));
      }, 5000);

      this.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Stop Python subprocess
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pythonProcess) {
        this.pythonProcess.kill();
        this.pythonProcess = null;
        this.ready = false;
      }
      resolve();
    });
  }

  /**
   * Send command and wait for response
   */
  async send(command: PythonBridgeCommand): Promise<PythonBridgeResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ready || !this.pythonProcess) {
        reject(new Error('Python bridge not ready'));
        return;
      }

      this.pendingCommand = { command, resolve, reject };
      
      const jsonData = JSON.stringify(command) + '\n';
      console.log('[Python Bridge] Sending:', jsonData);
      
      this.pythonProcess.stdin?.write(jsonData, (err) => {
        if (err) {
          console.error('[Python Bridge] Write error:', err);
          reject(err);
        }
      });
      
      // Timeout after 5 seconds
      const pendingCmd = this.pendingCommand;
      setTimeout(() => {
        if (this.pendingCommand === pendingCmd) {
          console.error('[Python Bridge] Command timeout:', command.command);
          this.pendingCommand = null;
          reject(new Error(`Command timeout: ${command.command}`));
        }
      }, 5000);
    });
  }

  /**
   * Handle output from Python process
   */
  private handleOutput(output: string): void {
    this.buffer += output;
    console.log('[Python Bridge] Raw output:', output);
    
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      console.log('[Python Bridge] Processing line:', line);
      
      try {
        const data = JSON.parse(line);
        console.log('[Python Bridge] Parsed JSON:', data);
        
        if (data.type === 'status' && data.event === 'ready') {
          console.log('[Python Bridge] Python ready!');
          this.ready = true;
          this.emit('ready');
        } else if (data.type === 'status') {
          console.log('[Python Bridge] Status event:', data.event);
          this.emit('status', data);
        } else if (data.command) {
          // This is a command response
          console.log('[Python Bridge] Command response:', data.command, data.success);
          if (this.pendingCommand) {
            const { resolve, reject } = this.pendingCommand;
            this.pendingCommand = null;
            
            if (data.success) {
              console.log('[Python Bridge] Resolving with success');
              resolve(data);
            } else {
              console.log('[Python Bridge] Rejecting with error:', data.error);
              reject(new Error(data.error || 'Command failed'));
            }
          } else {
            console.warn('[Python Bridge] No pending command for response');
          }
        }
      } catch (error) {
        console.error('[Python Bridge] Failed to parse output:', line, error);
      }
    }
  }

  /**
   * Check if Python bridge is ready
   */
  isReady(): boolean {
    return this.ready && this.pythonProcess !== null;
  }
}
