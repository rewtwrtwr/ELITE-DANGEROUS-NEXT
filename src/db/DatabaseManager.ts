/**
 * Database Manager - Native SQLite (better-sqlite3) Singleton
 *
 * Features:
 * - Direct disk storage (no in-memory)
 * - Immediate persistence
 * - WAL mode for performance
 * - Transactions support
 * - Sync operations (no async/await needed)
 *
 * @example
 * ```typescript
 * import { dbManager } from './DatabaseManager.js';
 * dbManager.init();
 * const db = dbManager.getDatabase();
 * dbManager.close();
 * ```
 */

import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

// Configuration
const DB_FILENAME = "elite.db";
const DB_DIR = path.join(process.cwd(), "data");
// Use TEST_DB_PATH environment variable if set (for testing), otherwise use default path
const DB_PATH = process.env.TEST_DB_PATH || path.join(DB_DIR, DB_FILENAME);

export class DatabaseManager {
  private db: DatabaseType | null = null;
  private initialized = false;
  private isShuttingDown = false;
  private currentDbPath: string | null = null;

  /**
   * Initialize database connection with WAL mode and schema creation
   *
   * Sync operation - no async/await needed.
   * Creates data directory if not exists.
   * Enables WAL mode, 64MB cache, and foreign keys.
   * Runs schema migrations for backward compatibility.
   *
   * @throws {Error} If database cannot be opened or created
   *
   * @example
   * ```typescript
   * dbManager.init();
   * console.log(dbManager.isInitialized()); // true
   * ```
   */
  init(): void {
    if (this.initialized) {
      // For in-memory databases, always recreate to ensure clean state
      const dbPath = process.env.TEST_DB_PATH;
      if (dbPath === ":memory:") {
        this.close();
        // Continue to reinitialize
      } else {
        logger.warn("Database", "Already initialized");
        return;
      }
    }

    logger.info("Database", "Initializing better-sqlite3...");

    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
      logger.debug("Database", `Created data directory: ${DB_DIR}`);
    }

    // Get database path
    const dbPath = process.env.TEST_DB_PATH || path.join(DB_DIR, DB_FILENAME);

    // Open database (auto-creates if not exists)
    this.db = new Database(dbPath);

    // Enable WAL mode for better performance
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("cache_size = -64000"); // 64MB cache
    this.db.pragma("temp_store = memory");
    this.db.pragma("busy_timeout = 5000");
    this.db.pragma("foreign_keys = ON");

    // Create tables
    this.createTables();
    this.initialized = true;

    logger.info("Database", "Database initialized successfully", {
      path: DB_PATH,
    });
  }

  /**
   * Create database schema
   */
  private createTables(): void {
    if (!this.db) throw new Error("Database not initialized");

    // Events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        commander TEXT,
        system_name TEXT,
        station_name TEXT,
        body TEXT,
        raw_json TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Indexes for fast queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_timestamp
        ON events(timestamp DESC)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_type
        ON events(event_type)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_event_id
        ON events(event_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_type_timestamp
        ON events(event_type, timestamp DESC)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_system
        ON events(system_name, timestamp DESC)
    `);

    // Run schema migrations for backward compatibility
    this.runMigrations();

    logger.debug("Database", "Tables and indexes created");
  }

  /**
   * Run schema migrations to add missing columns to existing database
   */
  private runMigrations(): void {
    if (!this.db) return;

    // Get existing columns
    const result = this.db.pragma("table_info('events')") as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>;

    const existingColumns = new Set(result.map((col) => col.name));

    // Migration: Add commander column if missing
    if (!existingColumns.has("commander")) {
      logger.info("Database", "Migration: Adding 'commander' column");
      this.db.exec("ALTER TABLE events ADD COLUMN commander TEXT");
    }

    // Migration: Add system_name column if missing
    if (!existingColumns.has("system_name")) {
      logger.info("Database", "Migration: Adding 'system_name' column");
      this.db.exec("ALTER TABLE events ADD COLUMN system_name TEXT");
    }

    // Migration: Add station_name column if missing
    if (!existingColumns.has("station_name")) {
      logger.info("Database", "Migration: Adding 'station_name' column");
      this.db.exec("ALTER TABLE events ADD COLUMN station_name TEXT");
    }

    // Migration: Add body column if missing
    if (!existingColumns.has("body")) {
      logger.info("Database", "Migration: Adding 'body' column");
      this.db.exec("ALTER TABLE events ADD COLUMN body TEXT");
    }

    // Migration: Add raw_json column if missing
    if (!existingColumns.has("raw_json")) {
      logger.info("Database", "Migration: Adding 'raw_json' column");
      this.db.exec(
        "ALTER TABLE events ADD COLUMN raw_json TEXT NOT NULL DEFAULT '{}'",
      );
    }

    // Migration: Add created_at column if missing
    if (!existingColumns.has("created_at")) {
      logger.info("Database", "Migration: Adding 'created_at' column");
      this.db.exec(
        "ALTER TABLE events ADD COLUMN created_at TEXT DEFAULT (datetime('now'))",
      );
    }

    logger.debug("Database", "Schema migrations completed");
  }

  /**
   * Get database instance
   *
   * @returns {DatabaseType | null} Database instance or null if not initialized
   *
   * @example
   * ```typescript
   * const db = dbManager.getDatabase();
   * if (db) {
   *   const stmt = db.prepare('SELECT * FROM events');
   * }
   * ```
   */
  getDatabase(): DatabaseType | null {
    return this.db;
  }

  /**
   * Check if database is initialized
   *
   * @returns {boolean} True if database is ready for operations
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Execute raw SQL statement (for DDL operations)
   *
   * @param {string} sql - SQL statement to execute
   * @throws {Error} If database not initialized
   */
  exec(sql: string): void {
    if (!this.db) throw new Error("Database not initialized");
    this.db.exec(sql);
  }

  /**
   * Prepare a SQL statement for execution
   *
   * @param {string} sql - SQL statement to prepare
   * @returns {import('better-sqlite3').Statement} Prepared statement
   * @throws {Error} If database not initialized
   */
  prepare(sql: string): import("better-sqlite3").Statement {
    if (!this.db) throw new Error("Database not initialized");
    return this.db.prepare(sql);
  }

  /**
   * Execute a function within a database transaction
   *
   * All database operations in the function are atomic - either all succeed or all fail.
   *
   * @template T - Return type of the transaction function
   * @param {() => T} fn - Function to execute within transaction
   * @returns {T} Result of the transaction function
   * @throws {Error} If database not initialized
   */
  transaction<T>(fn: () => T): T {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  /**
   * Close database connection with WAL checkpoint
   *
   * Performs a passive WAL checkpoint to ensure all data is written to main database file.
   * Safe to call multiple times - subsequent calls are no-ops.
   */
  close(): void {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info("Database", "Closing database...");

    if (this.db) {
      try {
        // Checkpoint WAL to main database
        this.db.pragma("wal_checkpoint(PASSIVE)");
        this.db.close();
      } catch (error) {
        logger.error("Database", "Error during database close", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      this.db = null;
      this.initialized = false;
    }

    logger.info("Database", "Database closed successfully");
  }

  /**
   * Reset singleton state for testing
   * Allows re-initialization with new TEST_DB_PATH
   */
  resetForTesting(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch (e) {
        // Ignore
      }
      this.db = null;
    }
    this.initialized = false;
  }

  /**
   * Reset singleton state and delete database file for testing
   * Ensures complete isolation between tests
   */
  resetForTestingWithCleanup(): void {
    const dbPath = this.currentDbPath;

    if (this.db) {
      try {
        this.db.close();
      } catch (e) {
        // Ignore
      }
      this.db = null;
    }
    this.initialized = false;
    this.currentDbPath = null;

    // Delete database files if path is known
    if (dbPath) {
      try {
        fs.unlinkSync(dbPath);
        fs.unlinkSync(dbPath + "-wal");
        fs.unlinkSync(dbPath + "-shm");
      } catch (e) {
        // Ignore deletion errors
      }
    }
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();

// Export class for testing
export { DatabaseManager as DatabaseManagerClass };
