/**
 * Event Repository - CRUD operations for events
 * With logger integration
 */

import { dbManager } from "./DatabaseManager.js";
import {
  EliteEvent,
  EventStats,
  PaginatedEvents,
  CursorPaginationResult,
} from "../types/elite.js";
import { logger } from "../utils/logger.js";

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
    const timestamp = data.timestamp || "";
    const event = data.event || "Unknown";
    const base = `${timestamp}_${event}`;

    try {
      // Try to extract unique key from common events
      let uniqueKey = "";
      
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
          uniqueKey = "";
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
   * Clean event data - replace undefined with null for sql.js compatibility
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
      logger.error("Repository", "Database not initialized");
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
      stmt.bind([
        cleaned.event_id,
        cleaned.timestamp,
        cleaned.event_type,
        cleaned.commander,
        cleaned.system_name,
        cleaned.station_name,
        cleaned.body,
        cleaned.raw_json,
      ]);
      stmt.step();
      stmt.free();

      const changes = db.getRowsModified();
      if (changes > 0) {
        return event.event_id;
      }
      return null;
    } catch (error) {
      logger.error("Repository", "Error inserting event", {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.event_id,
      });
      return null;
    }
  }

  /**
   * Insert multiple events in a batch
   */
  insertEvents(dataList: ParsedEventData[]): number {
    const db = dbManager.getDatabase();
    if (!db) {
      logger.error("Repository", "Database not initialized");
      return 0;
    }

    let insertedCount = 0;

    try {
      db.run("BEGIN TRANSACTION");

      for (const data of dataList) {
        const event = this.toEliteEvent(data);

        const stmt = db.prepare(`
          INSERT OR REPLACE INTO events
          (event_id, timestamp, event_type, commander, system_name, station_name, body, raw_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const cleaned = this.cleanEventData(event);
        stmt.bind([
          cleaned.event_id,
          cleaned.timestamp,
          cleaned.event_type,
          cleaned.commander,
          cleaned.system_name,
          cleaned.station_name,
          cleaned.body,
          cleaned.raw_json,
        ]);
        stmt.step();
        stmt.free();
        insertedCount++;
      }

      db.run("COMMIT");
      return insertedCount;
    } catch (error) {
      db.run("ROLLBACK");
      logger.error("Repository", "Error inserting events", {
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
      logger.error("Repository", "Database not initialized");
      return { events: [], total: 0, limit, offset };
    }

    try {
      // Get total count
      const countResult = db.exec("SELECT COUNT(*) as count FROM events");
      const total = (countResult[0]?.values[0]?.[0] as number) || 0;

      // Get paginated events
      const stmt = db.prepare(`
        SELECT id, event_id, timestamp, event_type, commander, system_name,
               station_name, body, raw_json, created_at
        FROM events
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);
      stmt.bind([limit, offset]);

      const events: EliteEvent[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        events.push({
          event_id: row.event_id as string,
          timestamp: row.timestamp as string,
          event_type: row.event_type as string,
          commander: row.commander as string | undefined,
          system_name: row.system_name as string | undefined,
          station_name: row.station_name as string | undefined,
          body: row.body as string | undefined,
          raw_json: row.raw_json as string,
          created_at: row.created_at as string | undefined,
        });
      }
      stmt.free();

      return { events, total, limit, offset };
    } catch (error) {
      logger.error("Repository", "Error getting events", {
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
      logger.error("Repository", "Database not initialized");
      return { data: [], nextCursor: null, hasMore: false, total: 0 };
    }

    try {
      // Get total count
      const countResult = db.exec("SELECT COUNT(*) as count FROM events");
      const total = (countResult[0]?.values[0]?.[0] as number) || 0;

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
        stmt.bind([cursor, limit + 1]); // Fetch one extra to check hasMore

        while (stmt.step()) {
          const row = stmt.getAsObject();
          events.push({
            event_id: row.event_id as string,
            timestamp: row.timestamp as string,
            event_type: row.event_type as string,
            commander: row.commander as string | undefined,
            system_name: row.system_name as string | undefined,
            station_name: row.station_name as string | undefined,
            body: row.body as string | undefined,
            raw_json: row.raw_json as string,
            created_at: row.created_at as string | undefined,
          });
        }
        stmt.free();
      } else {
        // Initial load: get newest events
        const stmt = db.prepare(`
          SELECT id, event_id, timestamp, event_type, commander, system_name,
                 station_name, body, raw_json, created_at
          FROM events
          ORDER BY timestamp DESC
          LIMIT ?
        `);
        stmt.bind([limit + 1]);

        while (stmt.step()) {
          const row = stmt.getAsObject();
          events.push({
            event_id: row.event_id as string,
            timestamp: row.timestamp as string,
            event_type: row.event_type as string,
            commander: row.commander as string | undefined,
            system_name: row.system_name as string | undefined,
            station_name: row.station_name as string | undefined,
            body: row.body as string | undefined,
            raw_json: row.raw_json as string,
            created_at: row.created_at as string | undefined,
          });
        }
        stmt.free();
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
      logger.error("Repository", "Error getting events by cursor", {
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
      logger.error("Repository", "Database not initialized");
      return null;
    }

    try {
      const sql = eventType
        ? `SELECT id, event_id, timestamp, event_type, commander, system_name,
                  station_name, body, raw_json, created_at
           FROM events
           WHERE event_type = ?
           ORDER BY timestamp DESC
           LIMIT 1`
        : `SELECT id, event_id, timestamp, event_type, commander, system_name,
                  station_name, body, raw_json, created_at
           FROM events
           ORDER BY timestamp DESC
           LIMIT 1`;

      const stmt = eventType ? db.prepare(sql) : db.prepare(sql);
      if (eventType) {
        stmt.bind([eventType]);
      }

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
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
      }

      stmt.free();
      return null;
    } catch (error) {
      logger.error("Repository", "Error getting latest event", {
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
      logger.error("Repository", "Database not initialized");
      return 0;
    }

    try {
      const result = db.exec("SELECT COUNT(*) as count FROM events");
      return (result[0]?.values[0]?.[0] as number) || 0;
    } catch (error) {
      logger.error("Repository", "Error counting events", {
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
      logger.error("Repository", "Database not initialized");
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
      const typeResult = db.exec(`
        SELECT event_type, COUNT(*) as count
        FROM events
        GROUP BY event_type
      `);

      const eventsByType: Record<string, number> = {};
      if (typeResult[0]?.values) {
        for (const row of typeResult[0].values) {
          eventsByType[row[0] as string] = row[1] as number;
        }
      }

      // Get unique systems count
      const systemsResult = db.exec(`
        SELECT COUNT(DISTINCT system_name) as count
        FROM events
        WHERE system_name IS NOT NULL AND system_name != ''
      `);

      const uniqueSystems = (systemsResult[0]?.values[0]?.[0] as number) || 0;

      // Get first and last event timestamps
      const firstResult = db.exec(`
        SELECT MIN(timestamp) as first, MAX(timestamp) as last
        FROM events
      `);

      const firstEvent = firstResult[0]?.values[0]?.[0] as string | null;
      const lastEvent = firstResult[0]?.values[0]?.[1] as string | null;

      return {
        totalEvents,
        eventsByType,
        uniqueSystems,
        firstEvent,
        lastEvent,
      };
    } catch (error) {
      logger.error("Repository", "Error getting stats", {
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
      logger.error("Repository", "Database not initialized");
      return { data: [], total: 0 };
    }

    try {
      // Get total count
      const countResult = db.exec("SELECT COUNT(*) as count FROM events");
      const total = (countResult[0]?.values[0]?.[0] as number) || 0;

      // Build query with optional limit
      let query = `
        SELECT id, event_id, timestamp, event_type, commander, system_name,
               station_name, body, raw_json, created_at
        FROM events
        ORDER BY timestamp DESC
      `;

      if (limit && limit > 0) {
        query += ` LIMIT ${limit}`;
      }

      const stmt = db.prepare(query);

      const events: EliteEvent[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        events.push({
          event_id: row.event_id as string,
          timestamp: row.timestamp as string,
          event_type: row.event_type as string,
          commander: row.commander as string | undefined,
          system_name: row.system_name as string | undefined,
          station_name: row.station_name as string | undefined,
          body: row.body as string | undefined,
          raw_json: row.raw_json as string,
          created_at: row.created_at as string | undefined,
        });
      }
      stmt.free();

      logger.info(
        "Repository",
        `Loaded ${events.length} events${limit && limit > 0 ? ` (limited to ${limit})` : " (all events)"}`,
      );
      return { data: events, total };
    } catch (error) {
      logger.error("Repository", "Error getting all events", {
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
      logger.error("Repository", "Database not initialized");
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

      let migratedCount = 0;
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
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
        
        // Update the event with valid JSON
        const updateStmt = db.prepare(`
          UPDATE events SET raw_json = ? WHERE event_id = ?
        `);
        updateStmt.bind([raw_json, eventId]);
        updateStmt.step();
        updateStmt.free();
        
        migratedCount++;
      }
      
      stmt.free();
      
      if (migratedCount > 0) {
        logger.info("Repository", `Migrated ${migratedCount} old events to new format`);
      }
      
      return migratedCount;
    } catch (error) {
      logger.error("Repository", "Error migrating old events", {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }
}

// Singleton instance
export const eventRepository = new EventRepository();
