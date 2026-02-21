/**
 * Database Initialization - Dynamic sql.js import
 * Handles edge cases: missing folder, wasm loading, corrupted DB
 */

import fs from 'fs';
import path from 'path';
import type { Database } from 'sql.js';

// Default configuration
const DEFAULT_DB_DIR = path.join(process.cwd(), 'data');
const DEFAULT_DB_NAME = 'elite.db';

/**
 * Get database path - evaluates at call time, not module load time
 * Supports runtime override via process.env.ELITE_DB_PATH or ELITE_DB_NAME
 */
export function getDatabasePath(): string {
  // Allow override via environment variable
  if (process.env.ELITE_DB_PATH) {
    return process.env.ELITE_DB_PATH;
  }

  const dbName = process.env.ELITE_DB_NAME || DEFAULT_DB_NAME;
  return path.join(DEFAULT_DB_DIR, dbName);
}

/**
 * Ensure data directory exists
 * Edge case 1: Missing folder
 */
function ensureDataDir(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[DB] Created data directory:', dir);
  }
}

/**
 * Validate database file integrity
 * Edge case 3: Corrupted DB
 */
function validateDatabase(db: Database): boolean {
  try {
    // Quick integrity check - try a simple query
    db.exec('SELECT 1');
    return true;
  } catch (error) {
    console.error('[DB] Database validation failed:', error);
    return false;
  }
}

/**
 * Initialize sql.js with dynamic import
 * Edge case 2: WASM not loaded
 */
async function loadSqlJs(): Promise<typeof import('sql.js')> {
  try {
    // Dynamic import - this is required for ESM compatibility
    const sqlJsModule = await import('sql.js');

    // Initialize sql.js - this loads the WASM file
    const SQL = await sqlJsModule.default({
      // Locate WASM file - sql.js will look in node_modules/sql.js/dist
      locateFile: (file: string) => {
        // In production, WASM might be in a different location
        const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
        if (fs.existsSync(wasmPath)) {
          return wasmPath;
        }
        // Fallback - let sql.js handle it
        return file;
      },
    });

    return SQL;
  } catch (error) {
    console.error('[DB] Failed to load sql.js WASM:', error);
    throw new Error('sql.js WASM initialization failed - check that sql.js is properly installed');
  }
}

/**
 * Load existing database or create new one
 */
function loadOrCreateDatabase(SQL: typeof import('sql.js'), dbPath: string): Database {
  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      const db = new SQL.Database(fileBuffer);

      if (!validateDatabase(db)) {
        console.warn('[DB] Existing database corrupted, creating new one');
        db.close();
        return new SQL.Database();
      }

      console.log('[DB] Loaded existing database from:', dbPath);
      return db;
    } catch (error) {
      console.warn('[DB] Failed to load existing database, creating new one:', error);
      return new SQL.Database();
    }
  }

  console.log('[DB] Creating new database at:', dbPath);
  return new SQL.Database();
}

/**
 * Initialize the database - main export
 * Creates tables and indexes if they don't exist
 * @param customPath - Optional custom path for database file
 */
export async function initializeDatabase(customPath?: string): Promise<Database> {
  // Get path at runtime, not module load time
  const dbPath = customPath || getDatabasePath();

  console.log('[DB] Initializing database...');
  console.log('[DB] Database path:', dbPath);

  // Ensure data directory exists
  ensureDataDir(dbPath);

  // Load sql.js with dynamic import
  const SQL = await loadSqlJs();

  // Load or create database
  const db = loadOrCreateDatabase(SQL, dbPath);

  // Create tables
  createSchema(db);

  console.log('[DB] Database initialized successfully');
  return db;
}

/**
 * Create database schema - tables and indexes
 */
function createSchema(db: Database): void {
  console.log('[DB] Creating schema...');

  // Events table - main journal events storage
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      timestamp DATETIME NOT NULL,
      event_type TEXT NOT NULL,
      raw_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stats table - commander statistics
  db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cmdr_name TEXT UNIQUE NOT NULL,
      credits INTEGER DEFAULT 0,
      last_system TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`);

  console.log('[DB] Schema created/verified');
}

/**
 * Save database to disk
 * @param db - The database instance to save
 * @param customPath - Optional custom path (defaults to getDatabasePath())
 */
export function saveDatabase(db: Database, customPath?: string): void {
  const savePath = customPath || getDatabasePath();

  try {
    const data = db.export();
    const buffer = Buffer.from(data);

    // Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(savePath, buffer);
    console.log('[DB] Saved database:', savePath, '-', buffer.length, 'bytes');
  } catch (error) {
    console.error('[DB] Failed to save database:', error);
    throw error;
  }
}
