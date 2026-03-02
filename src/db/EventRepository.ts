/**
 * Event Repository - CRUD operations for events
 * Using better-sqlite3 API
 */

import { dbManager } from './DatabaseManager.js';
import {
  EliteEvent,
  EventStats,
  PaginatedEvents,
  CursorPaginationResult,
} from '../types/elite.js';
import { logger } from '../utils/logger.js';
import type Database from 'better-sqlite3';

export interface ParsedEventData {
  filename?: string;
  timestamp: string;
  event: string;
  commander?: string;
  system_name?: string;
  station_name?: string;
  body?: string;
  raw_json: string;
}

class EventRepository {
  /**
   * Generate deterministic event_id from timestamp, event type and unique key
   * Must be deterministic: same log line always produces same event_id
   */
  generateEventId(data: ParsedEventData): string {
    const timestamp = data.timestamp || '';
    const event = data.event || 'Unknown';
    const base = `${timestamp}_${event}`;

    try {
      // Try to extract unique key from common events
      let uniqueKey = '';

      // Try to parse raw_json first
      if (data.raw_json) {
        try {
          const parsed = JSON.parse(data.raw_json);
          if (parsed.Name) uniqueKey = parsed.Name;
          else if (parsed.StarSystem) uniqueKey = parsed.StarSystem;
          else if (parsed.BodyName) uniqueKey = parsed.BodyName;
          else if (parsed.StationName) uniqueKey = parsed.StationName;
          else if (parsed.MissionName) uniqueKey = parsed.MissionName;
        } catch {
          // JSON parsing failed, try fallback approach
          uniqueKey = '';
        }
      }

      // If no unique key from JSON, try from parsed data fields
      if (!uniqueKey) {
        if (data.system_name) uniqueKey = data.system_name;
        else if (data.station_name) uniqueKey = data.station_name;
        else if (data.body) uniqueKey = data.body;
      }

      return uniqueKey ? `${base}_${uniqueKey}` : base;
    } catch {
      // If everything fails, use base with random suffix for uniqueness
      return `${base}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  /**
   * Convert parsed event data to EliteEvent format
   */
  toEliteEvent(data: ParsedEventData): EliteEvent {
    const event_id = this.generateEventId(data);

    // Ensure raw_json is valid JSON string
    let raw_json = data.raw_json;
    try {
      // Try to parse to validate JSON
      if (raw_json) JSON.parse(raw_json);
    } catch {
      // If invalid, create valid JSON from data
      const eventData: Record<string, unknown> = {
        timestamp: data.timestamp,
        event: data.event,
        ...(data.commander && { commander: data.commander }),
        ...(data.system_name && { system_name: data.system_name }),
        ...(data.station_name && { station_name: data.station_name }),
        ...(data.body && { body: data.body }),
      };
      raw_json = JSON.stringify(eventData);
    }

    return {
      event_id,
      timestamp: data.timestamp,
      event_type: data.event,
      commander: data.commander,
      system_name: data.system_name,
      station_name: data.station_name,
      body: data.body,
      raw_json,
    };
  }

  /**
   * Clean event data - replace undefined with null for SQLite compatibility
   */
  private cleanEventData(event: EliteEvent): EliteEvent {
    return {
      event_id: event.event_id ?? null,
      timestamp: event.timestamp ?? null,
      event_type: event.event_type ?? null,
      commander: event.commander ?? null,
      system_name: event.system_name ?? null,
      station_name: event.station_name ?? null,
      body: event.body ?? null,
      raw_json: event.raw_json ?? null,
    };
  }

  /**
   * Insert a single event
   */
  insertEvent(data: ParsedEventData): string | null {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return null;
    }

    const event = this.toEliteEvent(data);

    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO events
        (event_id, timestamp, event_type, commander, system_name, station_name, body, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const cleaned = this.cleanEventData(event);
      const result = stmt.run(
        cleaned.event_id,
        cleaned.timestamp,
        cleaned.event_type,
        cleaned.commander,
        cleaned.system_name,
        cleaned.station_name,
        cleaned.body,
        cleaned.raw_json
      );

      return result.changes > 0 ? event.event_id : null;
    } catch (error) {
      logger.error('Repository', 'Error inserting event', {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.event_id,
      });
      return null;
    }
  }

  /**
   * Insert multiple events in a batch using transaction
   */
  insertEvents(dataList: ParsedEventData[]): number {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return 0;
    }

    try {
      const transaction = db.transaction((events: ParsedEventData[]) => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO events
          (event_id, timestamp, event_type, commander, system_name, station_name, body, raw_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const data of events) {
          const event = this.toEliteEvent(data);
          const cleaned = this.cleanEventData(event);
          stmt.run(
            cleaned.event_id,
            cleaned.timestamp,
            cleaned.event_type,
            cleaned.commander,
            cleaned.system_name,
            cleaned.station_name,
            cleaned.body,
            cleaned.raw_json
          );
        }
      });

      transaction(dataList);
      return dataList.length;
    } catch (error) {
      logger.error('Repository', 'Error inserting events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Get paginated events (legacy support)
   */
  getEvents(limit = 50, offset = 0): PaginatedEvents {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return { events: [], total: 0, limit, offset };
    }

    try {
      // Get total count
      const totalRow = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      const total = totalRow.count;

      // Get paginated events
      const stmt = db.prepare(`
        SELECT id, event_id, timestamp, event_type, commander, system_name,
               station_name, body, raw_json, created_at
        FROM events
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);

      const rows = stmt.all(limit, offset) as Array<Record<string, unknown>>;

      const events: EliteEvent[] = rows.map(row => ({
        event_id: row.event_id as string,
        timestamp: row.timestamp as string,
        event_type: row.event_type as string,
        commander: row.commander as string | undefined,
        system_name: row.system_name as string | undefined,
        station_name: row.station_name as string | undefined,
        body: row.body as string | undefined,
        raw_json: row.raw_json as string,
        created_at: row.created_at as string | undefined,
      }));

      return { events, total, limit, offset };
    } catch (error) {
      logger.error('Repository', 'Error getting events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { events: [], total: 0, limit, offset };
    }
  }

  /**
   * Get events with cursor-based pagination (for infinite scroll)
   * Uses timestamp as cursor for efficient pagination
   */
  getEventsByCursor(
    cursor: string | null,
    limit: number = 50,
  ): CursorPaginationResult {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return { data: [], nextCursor: null, hasMore: false, total: 0 };
    }

    try {
      // Get total count
      const totalRow = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      const total = totalRow.count;

      let events: EliteEvent[] = [];
      let nextCursor: string | null = null;
      let hasMore = false;

      if (cursor) {
        // Cursor-based query: get events older than cursor timestamp
        const stmt = db.prepare(`
          SELECT id, event_id, timestamp, event_type, commander, system_name,
                 station_name, body, raw_json, created_at
          FROM events
          WHERE timestamp < ?
          ORDER BY timestamp DESC
          LIMIT ?
        `);

        const rows = stmt.all(cursor, limit + 1) as Array<Record<string, unknown>>;
        events = rows.map(row => ({
          event_id: row.event_id as string,
          timestamp: row.timestamp as string,
          event_type: row.event_type as string,
          commander: row.commander as string | undefined,
          system_name: row.system_name as string | undefined,
          station_name: row.station_name as string | undefined,
          body: row.body as string | undefined,
          raw_json: row.raw_json as string,
          created_at: row.created_at as string | undefined,
        }));
      } else {
        // Initial load: get newest events
        const stmt = db.prepare(`
          SELECT id, event_id, timestamp, event_type, commander, system_name,
                 station_name, body, raw_json, created_at
          FROM events
          ORDER BY timestamp DESC
          LIMIT ?
        `);

        const rows = stmt.all(limit + 1) as Array<Record<string, unknown>>;
        events = rows.map(row => ({
          event_id: row.event_id as string,
          timestamp: row.timestamp as string,
          event_type: row.event_type as string,
          commander: row.commander as string | undefined,
          system_name: row.system_name as string | undefined,
          station_name: row.station_name as string | undefined,
          body: row.body as string | undefined,
          raw_json: row.raw_json as string,
          created_at: row.created_at as string | undefined,
        }));
      }

      // Check if there are more events
      if (events.length > limit) {
        events = events.slice(0, limit); // Remove the extra event
        hasMore = true;
        nextCursor = events[events.length - 1]?.timestamp || null;
      } else {
        hasMore = false;
        nextCursor = null;
      }

      return { data: events, nextCursor, hasMore, total };
    } catch (error) {
      logger.error('Repository', 'Error getting events by cursor', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { data: [], nextCursor: null, hasMore: false, total: 0 };
    }
  }

  /**
   * Get latest event, optionally filtered by type
   */
  getLatestEvent(eventType?: string): EliteEvent | null {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return null;
    }

    try {
      let row: Record<string, unknown>;

      if (eventType) {
        row = db.prepare(`
          SELECT id, event_id, timestamp, event_type, commander, system_name,
                 station_name, body, raw_json, created_at
          FROM events
          WHERE event_type = ?
          ORDER BY timestamp DESC
          LIMIT 1
        `).get(eventType) as Record<string, unknown>;
      } else {
        row = db.prepare(`
          SELECT id, event_id, timestamp, event_type, commander, system_name,
                 station_name, body, raw_json, created_at
          FROM events
          ORDER BY timestamp DESC
          LIMIT 1
        `).get() as Record<string, unknown>;
      }

      if (!row) {
        return null;
      }

      return {
        event_id: row.event_id as string,
        timestamp: row.timestamp as string,
        event_type: row.event_type as string,
        commander: row.commander as string | undefined,
        system_name: row.system_name as string | undefined,
        station_name: row.station_name as string | undefined,
        body: row.body as string | undefined,
        raw_json: row.raw_json as string,
        created_at: row.created_at as string | undefined,
      };
    } catch (error) {
      logger.error('Repository', 'Error getting latest event', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get total event count
   */
  count(): number {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return 0;
    }

    try {
      const row = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      return row.count;
    } catch (error) {
      logger.error('Repository', 'Error counting events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Get event statistics
   */
  getStats(): EventStats {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return {
        totalEvents: 0,
        eventsByType: {},
        uniqueSystems: 0,
        firstEvent: null,
        lastEvent: null,
      };
    }

    try {
      const totalEvents = this.count();

      // Get events by type
      const typeRows = db.prepare(`
        SELECT event_type, COUNT(*) as count
        FROM events
        GROUP BY event_type
      `).all() as Array<{ event_type: string; count: number }>;

      const eventsByType: Record<string, number> = {};
      for (const row of typeRows) {
        eventsByType[row.event_type] = row.count;
      }

      // Get unique systems count
      const systemsRow = db.prepare(`
        SELECT COUNT(DISTINCT system_name) as count
        FROM events
        WHERE system_name IS NOT NULL AND system_name != ''
      `).get() as { count: number };

      const uniqueSystems = systemsRow?.count || 0;

      // Get first and last event timestamps
      const timeRow = db.prepare(`
        SELECT MIN(timestamp) as first, MAX(timestamp) as last
        FROM events
      `).get() as { first: string | null; last: string | null };

      const firstEvent = timeRow?.first || null;
      const lastEvent = timeRow?.last || null;

      return {
        totalEvents,
        eventsByType,
        uniqueSystems,
        firstEvent,
        lastEvent,
      };
    } catch (error) {
      logger.error('Repository', 'Error getting stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalEvents: 0,
        eventsByType: {},
        uniqueSystems: 0,
        firstEvent: null,
        lastEvent: null,
      };
    }
  }

  /**
   * Get ALL events without pagination (for initial load)
   * Returns all events sorted by timestamp DESC
   * @param limit Optional maximum number of events to return
   */
  getAllEvents(limit?: number): { data: EliteEvent[]; total: number } {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return { data: [], total: 0 };
    }

    try {
      // Get total count
      const totalRow = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      const total = totalRow.count;

      // Build query with optional limit (parameterized to prevent SQL injection)
      const baseQuery = `
        SELECT id, event_id, timestamp, event_type, commander, system_name,
               station_name, body, raw_json, created_at
        FROM events
        ORDER BY timestamp DESC
      `;

      let rows: Array<Record<string, unknown>>;
      if (limit && limit > 0) {
        // Use parameterized query instead of string interpolation
        const stmt = db.prepare(baseQuery + ' LIMIT ?');
        rows = stmt.all(limit) as Array<Record<string, unknown>>;
      } else {
        const stmt = db.prepare(baseQuery);
        rows = stmt.all() as Array<Record<string, unknown>>;
      }

      const events: EliteEvent[] = rows.map(row => ({
        event_id: row.event_id as string,
        timestamp: row.timestamp as string,
        event_type: row.event_type as string,
        commander: row.commander as string | undefined,
        system_name: row.system_name as string | undefined,
        station_name: row.station_name as string | undefined,
        body: row.body as string | undefined,
        raw_json: row.raw_json as string,
        created_at: row.created_at as string | undefined,
      }));

      logger.info(
        'Repository',
        `Loaded ${events.length} events${limit && limit > 0 ? ` (limited to ${limit})` : ' (all events)'}`,
      );
      return { data: events, total };
    } catch (error) {
      logger.error('Repository', 'Error getting all events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { data: [], total: 0 };
    }
  }

  /**
   * Migrate old events to new format (backward compatibility)
   * Converts events with parsed_data to raw_json format
   */
  migrateOldEvents(): number {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error('Repository', 'Database not initialized');
      return 0;
    }

    try {
      // Find events that need migration (missing raw_json or have old format)
      const stmt = db.prepare(`
        SELECT id, event_id, timestamp, event_type, commander, system_name,
               station_name, body, raw_json
        FROM events
        WHERE raw_json IS NULL OR raw_json = '' OR raw_json LIKE '%parsed_data%'
      `);

      const rows = stmt.all() as Array<Record<string, unknown>>;
      let migratedCount = 0;

      const updateStmt = db.prepare(`
        UPDATE events SET raw_json = ? WHERE event_id = ?
      `);

      for (const row of rows) {
        const eventId = row.event_id as string;

        // Try to reconstruct raw_json from available data
        const eventData: Record<string, unknown> = {
          timestamp: row.timestamp as string,
          event: row.event_type as string,
          ...(row.commander && { commander: row.commander }),
          ...(row.system_name && { system_name: row.system_name }),
          ...(row.station_name && { station_name: row.station_name }),
          ...(row.body && { body: row.body }),
        };

        const raw_json = JSON.stringify(eventData);
        updateStmt.run(raw_json, eventId);
        migratedCount++;
      }

      if (migratedCount > 0) {
        logger.info('Repository', `Migrated ${migratedCount} old events to new format`);
      }

      return migratedCount;
    } catch (error) {
      logger.error('Repository', 'Error migrating old events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }
}

// Singleton instance
export const eventRepository = new EventRepository();

// Export class for testing
export { EventRepository as EventRepositoryClass };
