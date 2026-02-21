/**
 * Database Manager - SQLite (sql.js) Singleton
 *
 * Features:
 * - In-memory sql.js database with periodic persistence
 * - Dirty flag to track unsaved changes
 * - Safe write: write to temp file → atomic rename
 * - Auto-save every 30 seconds if dirty
 * - Load from disk on startup
 * - Integration with native logger
 */

import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import fs from "fs";
import path from "path";

// Import logger (will be initialized in index.ts)
import { logger } from "../utils/logger.js";

// Configuration
const DB_FILENAME = "elite.db";
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, DB_FILENAME);
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const EVENT_COUNT_FOR_SAVE = 100; // Save every 100 new events

class DatabaseManager {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private initialized = false;
  private saveInterval: NodeJS.Timeout | null = null;

  // Dirty flag - tracks if there are unsaved changes
  private isDirty = false;
  private eventCountSinceLastSave = 0;

  // Track if shutdown is in progress
  private isShuttingDown = false;

  async init(): Promise<void> {
    if (this.initialized) {
      logger.warn("Database", "Already initialized");
      return;
    }

    logger.info("Database", "Initializing sql.js...");

    // Dynamic import for sql.js
    const SqlJs = (await import("sql.js")).default;
    this.SQL = await SqlJs();

    // Try to load existing database from disk
    const loadedFromDisk = await this.loadFromDisk();

    if (!loadedFromDisk) {
      logger.info("Database", "Creating new in-memory database");
      this.db = new this.SQL.Database();
    }

    // Create tables (handles both new DB and migrations for existing)
    this.createTables();
    this.initialized = true;

    // Start periodic persistence
    this.schedulePersistence(AUTO_SAVE_INTERVAL);

    logger.info("Database", "Database initialized successfully", {
      loadedFromDisk,
      dbPath: DB_PATH,
    });
  }

  private createTables(): void {
    if (!this.db) throw new Error("Database not initialized");

    // Events table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        timestamp DATETIME NOT NULL,
        event_type TEXT NOT NULL,
        commander TEXT,
        system_name TEXT,
        station_name TEXT,
        body TEXT,
        raw_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schema migration: Add missing columns to existing database
    this.runMigrations();

    // Indexes for fast queries
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC)`,
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`,
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id)`,
    );

    logger.debug("Database", "Tables created/verified");
  }

  /**
   * Run schema migrations to add missing columns
   */
  private runMigrations(): void {
    if (!this.db) return;

    // Get existing columns
    const result = this.db.exec("PRAGMA table_info(events)");
    const existingColumns = new Set<string>();

    if (result[0]?.values) {
      for (const row of result[0].values) {
        existingColumns.add(row[1] as string);
      }
    }

    // Migration: Add commander column if missing
    if (!existingColumns.has("commander")) {
      logger.info("Database", "Migration: Adding 'commander' column");
      this.db.run("ALTER TABLE events ADD COLUMN commander TEXT");
      this.markDirty();
    }

    // Migration: Add system_name column if missing
    if (!existingColumns.has("system_name")) {
      logger.info("Database", "Migration: Adding 'system_name' column");
      this.db.run("ALTER TABLE events ADD COLUMN system_name TEXT");
      this.markDirty();
    }

    // Migration: Add station_name column if missing
    if (!existingColumns.has("station_name")) {
      logger.info("Database", "Migration: Adding 'station_name' column");
      this.db.run("ALTER TABLE events ADD COLUMN station_name TEXT");
      this.markDirty();
    }

    // Migration: Add body column if missing
    if (!existingColumns.has("body")) {
      logger.info("Database", "Migration: Adding 'body' column");
      this.db.run("ALTER TABLE events ADD COLUMN body TEXT");
      this.markDirty();
    }

    // Migration: Add raw_json column if missing
    if (!existingColumns.has("raw_json")) {
      logger.info("Database", "Migration: Adding 'raw_json' column");
      this.db.run(
        "ALTER TABLE events ADD COLUMN raw_json TEXT NOT NULL DEFAULT '{}'",
      );
      this.markDirty();
    }

    // Migration: Add created_at column if missing
    if (!existingColumns.has("created_at")) {
      logger.info("Database", "Migration: Adding 'created_at' column");
      this.db.run(
        "ALTER TABLE events ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
      );
      this.markDirty();
    }

    logger.debug("Database", "Schema migrations completed");
  }

  /**
   * Load database from disk if file exists
   * Returns true if loaded successfully, false if creating new
   */
  async loadFromDisk(): Promise<boolean> {
    if (!this.SQL) {
      logger.error("Database", "SQL.js not initialized, cannot load from disk");
      return false;
    }

    if (!fs.existsSync(DB_PATH)) {
      logger.info("Database", "No existing database file, will create new");
      return false;
    }

    try {
      logger.info("Database", "Loading existing database from disk", {
        path: DB_PATH,
      });

      const fileBuffer = fs.readFileSync(DB_PATH);
      this.db = new this.SQL.Database(fileBuffer);

      // Verify database is valid by running a simple query
      const result = this.db.exec("SELECT COUNT(*) as count FROM events");
      const eventCount = (result[0]?.values[0]?.[0] as number) || 0;

      logger.info("Database", `Loaded ${eventCount} events from disk`);
      return true;
    } catch (error) {
      logger.error(
        "Database",
        "Failed to load database from disk, creating new",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      // If loading fails, create new database
      this.db = new this.SQL.Database();
      return false;
    }
  }

  /**
   * Export database to disk with safe write (temp → rename)
   * Only writes if isDirty flag is true
   */
  async persist(): Promise<void> {
    if (!this.db) {
      logger.error("Database", "Cannot persist: database not initialized");
      return;
    }

    if (!this.isDirty) {
      logger.debug("Database", "Skipping persist: no unsaved changes");
      return;
    }

    if (this.isShuttingDown) {
      logger.debug("Database", "Skipping persist: shutdown in progress");
      return;
    }

    await this.exportToDisk();
  }

  /**
   * Export database to disk - write to temp file then atomic rename
   */
  async exportToDisk(): Promise<void> {
    if (!this.db) {
      logger.error("Database", "Cannot export: database not initialized");
      return;
    }

    try {
      // Ensure directory exists
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
        logger.debug("Database", `Created data directory: ${DB_DIR}`);
      }

      // Export to Uint8Array
      const data = this.db.export();
      const buffer = Buffer.from(data);

      // Safe write: write to temp file, then rename
      const tempPath = DB_PATH + ".tmp";
      const backupPath = DB_PATH + ".backup";

      // Write to temp file
      fs.writeFileSync(tempPath, buffer);

      // If existing DB exists, create backup
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, backupPath);
      }

      // Atomic rename (overwrites existing)
      fs.renameSync(tempPath, DB_PATH);

      // Clean up backup after successful write
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }

      // Reset dirty flag
      this.isDirty = false;

      logger.info("Database", `Persisted database to ${DB_PATH}`, {
        sizeBytes: buffer.length,
        eventCount: this.eventCountSinceLastSave,
      });
    } catch (error) {
      logger.error("Database", "Failed to export database to disk", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Schedule periodic persistence
   * Only saves if isDirty flag is true
   */
  schedulePersistence(intervalMs: number): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    this.saveInterval = setInterval(() => {
      this.persist();
    }, intervalMs);

    // Don't prevent exit
    this.saveInterval.unref();

    logger.info("Database", `Scheduled persistence every ${intervalMs}ms`);
  }

  /**
   * Mark database as dirty (has unsaved changes)
   */
  markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Check if database has unsaved changes
   */
  getIsDirty(): boolean {
    return this.isDirty;
  }

  exec(sql: string): void {
    if (!this.db) throw new Error("Database not initialized");
    this.db.run(sql);
    this.markDirty();
  }

  prepare(sql: string): Database {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  /**
   * Legacy save method - calls persist
   */
  save(): void {
    // Make it async but don't wait
    this.persist().catch((err) => {
      logger.error("Database", "Auto-save failed", { error: err.message });
    });
  }

  /**
   * Close database - save to disk first
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.isShuttingDown = true;

      logger.info("Database", "Closing database...");

      if (this.saveInterval) {
        clearInterval(this.saveInterval);
        this.saveInterval = null;
      }

      if (!this.db) {
        logger.debug("Database", "Database already closed");
        this.initialized = false;
        resolve();
        return;
      }

      // Final persist before closing
      this.persist()
        .then(() => {
          this.db?.close();
          this.db = null;
          this.initialized = false;
          logger.info("Database", "Database closed successfully");
          resolve();
        })
        .catch((error) => {
          logger.error("Database", "Error during final save", {
            error: error instanceof Error ? error.message : String(error),
          });
          this.db?.close();
          this.db = null;
          this.initialized = false;
          resolve();
        });
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getDatabase(): Database | null {
    return this.db;
  }

  /**
   * Increment event count and mark as dirty
   */
  incrementEventCount(): number {
    this.isDirty = true;
    return ++this.eventCountSinceLastSave;
  }

  getEventCountSinceLastSave(): number {
    return this.eventCountSinceLastSave;
  }

  /**
   * Reset event counter after save
   */
  resetEventCount(): void {
    this.eventCountSinceLastSave = 0;
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();
