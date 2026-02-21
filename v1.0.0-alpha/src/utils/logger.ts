/**
 * Native Logger with Rotation
 * No external dependencies - uses fs.createWriteStream + manual formatting
 *
 * Features:
 * - 4 log levels: ERROR, WARN, INFO, DEBUG
 * - Rotation: 5 files × 10MB = 100MB max
 * - Append mode (survives restarts)
 * - Format: [ISO_TIMESTAMP] [LEVEL] [MODULE] message
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE_BASE = "elite";
const LOG_EXTENSION = ".log";
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const SHUTDOWN_TIMEOUT = 5000;

// ============================================================================
// State
// ============================================================================

let currentLogFile: string | null = null;
let currentStream: fs.WriteStream | null = null;
let currentFileSize = 0;
let isShuttingDown = false;
let logLevel: LogLevel = LogLevel.INFO;

// ============================================================================
// Helpers
// ============================================================================

function getTimestamp(): string {
  return new Date().toISOString();
}

function getLogFilePath(index: number): string {
  return path.join(LOG_DIR, `${LOG_FILE_BASE}-${index}${LOG_EXTENSION}`);
}

function getCurrentLogFilePath(): string {
  if (!currentLogFile) {
    currentLogFile = getLogFilePath(1);
  }
  return currentLogFile;
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function rotateLogsIfNeeded(): void {
  const currentPath = getCurrentLogFilePath();

  if (currentStream && fs.existsSync(currentPath)) {
    currentFileSize = fs.statSync(currentPath).size;
  }

  if (currentFileSize >= MAX_FILE_SIZE) {
    rotateLogs();
  }
}

function rotateLogs(): void {
  // Close current stream
  if (currentStream) {
    currentStream.end();
    currentStream = null;
  }

  // Rotate: elite-5.log <- elite-4.log <- ... <- elite-1.log
  // Delete elite-5.log if it exists
  const oldestFile = getLogFilePath(MAX_FILES);
  if (fs.existsSync(oldestFile)) {
    fs.unlinkSync(oldestFile);
  }

  // Shift each file down
  for (let i = MAX_FILES - 1; i >= 1; i--) {
    const currentPath = getLogFilePath(i);
    const nextPath = getLogFilePath(i + 1);

    if (fs.existsSync(currentPath)) {
      fs.renameSync(currentPath, nextPath);
    }
  }

  // Reset current file
  currentLogFile = getLogFilePath(1);
  currentFileSize = 0;

  // Open new stream
  ensureLogDir();
  currentStream = fs.createWriteStream(currentLogFile, { flags: "a" });
}

function openLogStream(): void {
  ensureLogDir();

  // Find the most recent log file or create new one
  let latestFile = 1;
  let latestSize = 0;

  for (let i = 1; i <= MAX_FILES; i++) {
    const filePath = getLogFilePath(i);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > latestSize) {
        latestSize = stats.size;
        latestFile = i;
      }
    }
  }

  currentLogFile = getLogFilePath(latestFile);

  // If latest file is full, start from 1
  if (latestSize >= MAX_FILE_SIZE) {
    currentLogFile = getLogFilePath(1);
  }

  currentStream = fs.createWriteStream(currentLogFile, { flags: "a" });

  // Get initial size
  if (fs.existsSync(currentLogFile)) {
    currentFileSize = fs.statSync(currentLogFile).size;
  }
}

function formatMessage(
  level: LogLevel,
  module: string,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const timestamp = getTimestamp();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] [${module}] ${message}${metaStr}\n`;
}

function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const currentLevelIndex = levels.indexOf(logLevel);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= currentLevelIndex;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize logger - must be called before first log
 */
export function initLogger(options?: { level?: LogLevel }): void {
  if (options?.level) {
    logLevel = options.level;
  }

  openLogStream();

  // Handle rotation check on interval
  setInterval(() => {
    rotateLogsIfNeeded();
  }, 60000); // Check every minute

  // Note: SIGINT/SIGTERM handling is done by the main app (index.ts)
  // This ensures proper shutdown sequence: DB save -> Socket.IO close -> HTTP close -> logger close
  // We only handle uncaught exceptions here as a last resort

  process.on("uncaughtException", (err) => {
    isShuttingDown = true;
    error("Logger", `Uncaught Exception: ${err.message}`, { stack: err.stack });
    flushAndExit(1, "uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    isShuttingDown = true;
    error("Logger", `Unhandled Rejection: ${reason}`);
    flushAndExit(1, "unhandledRejection");
  });

  // Log initialization
  info("Logger", "Logger initialized", {
    logDir: LOG_DIR,
    level: logLevel,
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
  });
}

function flushLogs(): void {
  // WriteStream doesn't have flush() - rely on 'finish' event or end()
  // This is handled by closeLogger() which calls currentStream.end()
}

function flushAndExit(code: number, signal: string): void {
  error("Logger", `Received ${signal}, flushing logs and exiting`);
  flushLogs();

  setTimeout(() => {
    process.exit(code);
  }, SHUTDOWN_TIMEOUT);
}

/**
 * Set log level
 */
export function setLogLevel(level: LogLevel): void {
  logLevel = level;
  info("Logger", `Log level changed to ${level}`);
}

/**
 * Debug level logging
 */
export function debug(
  module: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (!shouldLog(LogLevel.DEBUG)) return;

  const formatted = formatMessage(LogLevel.DEBUG, module, message, meta);

  if (currentStream && !isShuttingDown) {
    currentStream.write(formatted);
    rotateLogsIfNeeded();
  }

  // Also log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.log(formatted.trim());
  }
}

/**
 * Info level logging
 */
export function info(
  module: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (!shouldLog(LogLevel.INFO)) return;

  const formatted = formatMessage(LogLevel.INFO, module, message, meta);

  if (currentStream && !isShuttingDown) {
    currentStream.write(formatted);
    rotateLogsIfNeeded();
  }

  console.log(formatted.trim());
}

/**
 * Warning level logging
 */
export function warn(
  module: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (!shouldLog(LogLevel.WARN)) return;

  const formatted = formatMessage(LogLevel.WARN, module, message, meta);

  if (currentStream && !isShuttingDown) {
    currentStream.write(formatted);
    rotateLogsIfNeeded();
  }

  console.warn(formatted.trim());
}

/**
 * Error level logging
 */
export function error(
  module: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (!shouldLog(LogLevel.ERROR)) return;

  const formatted = formatMessage(LogLevel.ERROR, module, message, context);

  if (currentStream && !isShuttingDown) {
    currentStream.write(formatted);
    rotateLogsIfNeeded();
  }

  console.error(formatted.trim());
}

/**
 * Close logger - call on shutdown
 */
export function closeLogger(): Promise<void> {
  return new Promise((resolve) => {
    info("Logger", "Graceful shutdown completed");
    flushLogs();

    if (currentStream) {
      currentStream.end(() => {
        currentStream = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// ============================================================================
// Convenience logger object
// ============================================================================

export const logger = {
  init: initLogger,
  setLevel: setLogLevel,
  debug,
  info,
  warn,
  error,
  close: closeLogger,
  LogLevel,
};

export default logger;
