/**
 * DatabaseManager - SQLite wrapper for Elite Dangerous Journal events
 * Handles connection, CRUD operations, and persistence
 */

import fs from 'fs';
import path from 'path';
import { initializeDatabase, saveDatabase, getDatabasePath } from './init-db.js';
import type { Database } from 'sql.js';

// Types
export interface JournalEvent {
  id?: number;
  event_id: string;
  timestamp: string;
  event_type: string;
  raw_data: string;
  created_at?: string;
}

export interface CommanderStats {
  id?: number;
  cmdr_name: string;
  credits: number;
  last_system: string | null;
  updated_at?: string;
}

export interface EventFilter {
  eventType?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

// Configuration
const MAX_STARTUP_EVENTS = 1000;

class DatabaseManager {
  private db: Database | null = null;
  private initialized = false;
  private dbPath: string = '';

  /**
   * Connect to database - initializes sql.js and creates/opens DB
   * @param customPath - Optional custom path for database file
   */
  async connect(customPath?: string): Promise<Database> {
    if (this.initialized && this.db) {
      return this.db;
    }

    console.log('[DB] Connecting to database...');

    try {
      // Use custom path or get from environment
      this.dbPath = customPath || getDatabasePath();
      console.log('[DB] Using database path:', this.dbPath);

      this.db = await initializeDatabase(this.dbPath);
      this.initialized = true;

      // Load last 1000 events at startup
      await this.loadRecentEvents(MAX_STARTUP_EVENTS);

      return this.db;
    } catch (error) {
      console.error('[DB] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Load recent events into memory cache (last 1000 by default)
   * Called automatically on startup
   */
  async loadRecentEvents(limit: number = MAX_STARTUP_EVENTS): Promise<JournalEvent[]> {
    if (!this.db) {
      console.warn('[DB] Cannot load events: database not connected');
      return [];
    }

    console.log('[DB] Loading last', limit, 'events from database...');

    try {
      const stmt = this.db.prepare(`
        SELECT id, event_id, timestamp, event_type, raw_data, created_at
        FROM events
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      stmt.bind([limit]);

      const events: JournalEvent[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as unknown as JournalEvent;
        events.push(row);
      }
      stmt.free();

      console.log('[DB] Loaded', events.length, 'events into memory cache');
      return events;
    } catch (error) {
      console.error('[DB] Error loading recent events:', error);
      return [];
    }
  }

  /**
   * Save a single event to the database
   * Uses INSERT OR IGNORE to prevent duplicates
   */
  async saveEvent(event: JournalEvent): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      this.db.run('BEGIN IMMEDIATE');

      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO events
        (event_id, timestamp, event_type, raw_data)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run([event.event_id, event.timestamp, event.event_type, event.raw_data]);

      stmt.free();
      this.db.run('COMMIT');
    } catch (error) {
      try {
        this.db.run('ROLLBACK');
      } catch {}
      console.error('[DB] Error saving event:', error);
      throw error;
    }
  }

  /**
   * Save multiple events in a single transaction (bulk insert)
   * Optimized for performance - ~1000 events/hour in normal gameplay
   */
  async saveEvents(events: JournalEvent[]): Promise<number> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    if (events.length === 0) {
      return 0;
    }

    let insertedCount = 0;

    try {
      this.db.run('BEGIN IMMEDIATE');

      for (const event of events) {
        const stmt = this.db.prepare(`
          INSERT OR IGNORE INTO events
          (event_id, timestamp, event_type, raw_data)
          VALUES (?, ?, ?, ?)
        `);

        stmt.run([event.event_id, event.timestamp, event.event_type, event.raw_data]);

        stmt.free();
      }

      // Get number of changes
      const result = this.db.exec('SELECT changes()');
      insertedCount = (result[0]?.values[0]?.[0] as number) || events.length;

      this.db.run('COMMIT');

      console.log('[DB] Bulk inserted', insertedCount, 'events');
      return insertedCount;
    } catch (error) {
      try {
        this.db.run('ROLLBACK');
      } catch {}
      console.error('[DB] Error in bulk insert:', error);
      throw error;
    }
  }

  /**
   * Get recent events with optional filtering
   */
  async getRecentEvents(limit: number = 100, offset: number = 0): Promise<JournalEvent[]> {
    if (!this.db) {
      console.warn('[DB] Database not connected');
      return [];
    }

    try {
      const stmt = this.db.prepare(`
        SELECT id, event_id, timestamp, event_type, raw_data, created_at
        FROM events
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);

      stmt.bind([limit, offset]);

      const events: JournalEvent[] = [];
      while (stmt.step()) {
        events.push(stmt.getAsObject() as unknown as JournalEvent);
      }
      stmt.free();

      return events;
    } catch (error) {
      console.error('[DB] Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get events with filters
   */
  async getEvents(filter: EventFilter): Promise<JournalEvent[]> {
    if (!this.db) {
      return [];
    }

    let sql = 'SELECT * FROM events WHERE 1=1';
    const params: (string | number)[] = [];

    if (filter.eventType) {
      sql += ' AND event_type = ?';
      params.push(filter.eventType);
    }

    if (filter.startTime) {
      sql += ' AND timestamp >= ?';
      params.push(filter.startTime);
    }

    if (filter.endTime) {
      sql += ' AND timestamp <= ?';
      params.push(filter.endTime);
    }

    sql += ' ORDER BY timestamp DESC';

    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    if (filter.offset) {
      sql += ' OFFSET ?';
      params.push(filter.offset);
    }

    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }

      const events: JournalEvent[] = [];
      while (stmt.step()) {
        events.push(stmt.getAsObject() as unknown as JournalEvent);
      }
      stmt.free();

      return events;
    } catch (error) {
      console.error('[DB] Error getting filtered events:', error);
      return [];
    }
  }

  /**
   * Get commander stats
   */
  async getStats(cmdrName: string = 'default'): Promise<CommanderStats | null> {
    if (!this.db) {
      return null;
    }

    try {
      const stmt = this.db.prepare(`
        SELECT id, cmdr_name, credits, last_system, updated_at
        FROM stats
        WHERE cmdr_name = ?
        LIMIT 1
      `);

      stmt.bind([cmdrName]);

      if (stmt.step()) {
        const stats = stmt.getAsObject() as unknown as CommanderStats;
        stmt.free();
        return stats;
      }

      stmt.free();
      return null;
    } catch (error) {
      console.error('[DB] Error getting stats:', error);
      return null;
    }
  }

  /**
   * Update commander stats
   */
  async updateStats(cmdrName: string, credits: number, lastSystem: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      this.db.run(
        `
        INSERT INTO stats (cmdr_name, credits, last_system, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(cmdr_name) DO UPDATE SET
          credits = excluded.credits,
          last_system = excluded.last_system,
          updated_at = datetime('now')
      `,
        [cmdrName, credits, lastSystem]
      );
    } catch (error) {
      console.error('[DB] Error updating stats:', error);
      throw error;
    }
  }

  /**
   * Get total event count
   */
  async getEventCount(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const result = this.db.exec('SELECT COUNT(*) FROM events');
      return (result[0]?.values[0]?.[0] as number) || 0;
    } catch (error) {
      console.error('[DB] Error getting event count:', error);
      return 0;
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string, limit: number = 100): Promise<JournalEvent[]> {
    if (!this.db) {
      return [];
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM events
        WHERE event_type = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      stmt.bind([eventType, limit]);

      const events: JournalEvent[] = [];
      while (stmt.step()) {
        events.push(stmt.getAsObject() as unknown as JournalEvent);
      }
      stmt.free();

      return events;
    } catch (error) {
      console.error('[DB] Error getting events by type:', error);
      return [];
    }
  }

  /**
   * Persist database to disk
   * Should be called periodically or on shutdown
   */
  persist(): void {
    if (!this.db) {
      console.warn('[DB] Cannot persist: database not connected');
      return;
    }

    try {
      saveDatabase(this.db, this.dbPath);
      console.log('[DB] Database persisted to disk');
    } catch (error) {
      console.error('[DB] Error persisting database:', error);
    }
  }

  /**
   * Close database connection
   * Persists data before closing
   */
  async close(): Promise<void> {
    if (!this.db) {
      console.log('[DB] Database already closed');
      return;
    }

    console.log('[DB] Closing database...');

    try {
      // Persist any pending changes
      this.persist();

      this.db.close();
      this.db = null;
      this.initialized = false;

      console.log('[DB] Database closed');
    } catch (error) {
      console.error('[DB] Error closing database:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Get raw database instance (for advanced queries)
   */
  getDatabase(): Database | null {
    return this.db;
  }

  /**
   * Get current database path
   */
  getDbPath(): string {
    return this.dbPath;
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();
