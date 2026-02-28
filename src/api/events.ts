/**
 * Events API - History and Search Endpoints
 * API для истории событий и поиска
 */

import { Router, Request, Response } from 'express';
import { eventRepository } from '../db/EventRepository.js';
import { EVENTS_CATALOG } from '../data/events-catalog.js';
import { logger } from '../utils/logger.js';
import { EliteEvent } from '../types/elite.js';

const router = Router();

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface EventWithMetadata extends EliteEvent {
  metadata?: {
    category?: string;
    label?: string;
    labelEn?: string;
    icon?: string;
    description?: string;
    descriptionEn?: string;
  };
}

interface RelatedEventsResponse {
  before: EliteEvent[];
  after: EliteEvent[];
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validatePaginationParams(req: Request): { limit: number; offset: number } {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 50, 1),
    1000
  );
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
  return { limit, offset };
}

function validateDateParam(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function validateEventType(eventType: string | undefined): string | null {
  if (!eventType) return null;
  // Check if event type exists in catalog
  if (EVENTS_CATALOG[eventType]) {
    return eventType;
  }
  return null;
}

// ============================================================================
// GET /api/v1/events/history - Get paginated event history
// ============================================================================

router.get('/history', (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { limit, offset } = validatePaginationParams(req);
    const eventType = validateEventType(req.query.eventType as string);
    const startDate = validateDateParam(req.query.startDate as string);
    const endDate = validateDateParam(req.query.endDate as string);

    logger.info('EventsAPI', 'Fetching event history', {
      limit,
      offset,
      eventType,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    const db = eventRepository['dbManager'].getDatabase();
    if (!db) {
      const response: ApiResponse = {
        success: false,
        data: [],
        error: 'Database not initialized',
      };
      return res.status(500).json(response);
    }

    // Build WHERE clause
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (eventType) {
      conditions.push('event_type = ?');
      params.push(eventType);
    }

    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(startDate.toISOString());
    }

    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM events ${whereClause}`;
    const countResult = db.exec(countQuery);
    const total = (countResult[0]?.values[0]?.[0] as number) || 0;

    // Get paginated events
    const eventsQuery = `
      SELECT id, event_id, timestamp, event_type, commander, system_name,
             station_name, body, raw_json, created_at
      FROM events
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    const stmt = db.prepare(eventsQuery);
    stmt.bind([...params, limit, offset]);

    const events: EventWithMetadata[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const event: EventWithMetadata = {
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

      // Add metadata from catalog
      const catalogEntry = EVENTS_CATALOG[event.event_type];
      if (catalogEntry) {
        event.metadata = {
          category: catalogEntry.category,
          label: catalogEntry.label,
          labelEn: catalogEntry.labelEn,
          icon: catalogEntry.icon,
          description: catalogEntry.description,
          descriptionEn: catalogEntry.descriptionEn,
        };
      }

      events.push(event);
    }
    stmt.free();

    const hasMore = offset + limit < total;
    const duration = Date.now() - startTime;

    logger.info('EventsAPI', 'Event history fetched successfully', {
      count: events.length,
      total,
      duration: `${duration}ms`,
    });

    const response: ApiResponse<EventWithMetadata[]> = {
      success: true,
      data: events,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('EventsAPI', 'Error fetching event history', {
      error: errorMessage,
    });

    const response: ApiResponse = {
      success: false,
      data: [],
      error: 'Failed to fetch event history',
    };

    res.status(500).json(response);
  }
});

// ============================================================================
// GET /api/v1/events/:id - Get event details by ID
// ============================================================================

router.get('/:id', (req: Request, res: Response) => {
  const startTime = Date.now();
  const eventId = req.params.id;

  try {
    logger.info('EventsAPI', 'Fetching event by ID', { eventId });

    const db = eventRepository['dbManager'].getDatabase();
    if (!db) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: 'Database not initialized',
      };
      return res.status(500).json(response);
    }

    const stmt = db.prepare(`
      SELECT id, event_id, timestamp, event_type, commander, system_name,
             station_name, body, raw_json, created_at
      FROM events
      WHERE event_id = ?
      LIMIT 1
    `);
    stmt.bind([eventId]);

    let event: EventWithMetadata | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      event = {
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

      // Add metadata from catalog
      const catalogEntry = EVENTS_CATALOG[event.event_type];
      if (catalogEntry) {
        event.metadata = {
          category: catalogEntry.category,
          label: catalogEntry.label,
          labelEn: catalogEntry.labelEn,
          icon: catalogEntry.icon,
          description: catalogEntry.description,
          descriptionEn: catalogEntry.descriptionEn,
        };
      }
    }
    stmt.free();

    if (!event) {
      logger.warn('EventsAPI', 'Event not found', { eventId });
      const response: ApiResponse = {
        success: false,
        data: null,
        error: 'Event not found',
      };
      return res.status(404).json(response);
    }

    const duration = Date.now() - startTime;
    logger.info('EventsAPI', 'Event fetched successfully', {
      eventId,
      duration: `${duration}ms`,
    });

    const response: ApiResponse<EventWithMetadata> = {
      success: true,
      data: event,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('EventsAPI', 'Error fetching event by ID', {
      eventId,
      error: errorMessage,
    });

    const response: ApiResponse = {
      success: false,
      data: null,
      error: 'Failed to fetch event',
    };

    res.status(500).json(response);
  }
});

// ============================================================================
// GET /api/v1/events/:id/related - Get related events (before/after)
// ============================================================================

router.get('/:id/related', (req: Request, res: Response) => {
  const startTime = Date.now();
  const eventId = req.params.id;
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 10, 1),
    100
  );

  try {
    logger.info('EventsAPI', 'Fetching related events', { eventId, limit });

    const db = eventRepository['dbManager'].getDatabase();
    if (!db) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: 'Database not initialized',
      };
      return res.status(500).json(response);
    }

    // First, get the target event to find its timestamp
    const targetStmt = db.prepare(`
      SELECT timestamp, event_type
      FROM events
      WHERE event_id = ?
      LIMIT 1
    `);
    targetStmt.bind([eventId]);

    let targetTimestamp: string | null = null;
    let targetEventType: string | null = null;

    if (targetStmt.step()) {
      const row = targetStmt.getAsObject();
      targetTimestamp = row.timestamp as string;
      targetEventType = row.event_type as string;
    }
    targetStmt.free();

    if (!targetTimestamp) {
      logger.warn('EventsAPI', 'Event not found for related events', { eventId });
      const response: ApiResponse = {
        success: false,
        data: null,
        error: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Get events before (older than target)
    const beforeStmt = db.prepare(`
      SELECT id, event_id, timestamp, event_type, commander, system_name,
             station_name, body, raw_json, created_at
      FROM events
      WHERE timestamp < ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    beforeStmt.bind([targetTimestamp, limit]);

    const beforeEvents: EliteEvent[] = [];
    while (beforeStmt.step()) {
      const row = beforeStmt.getAsObject();
      beforeEvents.push({
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
    beforeStmt.free();

    // Get events after (newer than target)
    const afterStmt = db.prepare(`
      SELECT id, event_id, timestamp, event_type, commander, system_name,
             station_name, body, raw_json, created_at
      FROM events
      WHERE timestamp > ?
      ORDER BY timestamp ASC
      LIMIT ?
    `);
    afterStmt.bind([targetTimestamp, limit]);

    const afterEvents: EliteEvent[] = [];
    while (afterStmt.step()) {
      const row = afterStmt.getAsObject();
      afterEvents.push({
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
    afterStmt.free();

    const duration = Date.now() - startTime;
    logger.info('EventsAPI', 'Related events fetched successfully', {
      eventId,
      beforeCount: beforeEvents.length,
      afterCount: afterEvents.length,
      duration: `${duration}ms`,
    });

    const response: ApiResponse<RelatedEventsResponse> = {
      success: true,
      data: {
        before: beforeEvents,
        after: afterEvents,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('EventsAPI', 'Error fetching related events', {
      eventId,
      error: errorMessage,
    });

    const response: ApiResponse = {
      success: false,
      data: null,
      error: 'Failed to fetch related events',
    };

    res.status(500).json(response);
  }
});

// ============================================================================
// GET /api/v1/events/types - Get all event types
// ============================================================================

router.get('/types', (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    logger.info('EventsAPI', 'Fetching event types');

    const db = eventRepository['dbManager'].getDatabase();
    if (!db) {
      const response: ApiResponse = {
        success: false,
        data: [],
        error: 'Database not initialized',
      };
      return res.status(500).json(response);
    }

    // Get event types from database with counts
    const typeResult = db.exec(`
      SELECT event_type, COUNT(*) as count
      FROM events
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const eventTypes: Array<{
      type: string;
      count: number;
      metadata?: {
        category: string;
        label: string;
        labelEn: string;
        icon: string;
        description: string;
        descriptionEn: string;
      };
    }> = [];

    if (typeResult[0]?.values) {
      for (const row of typeResult[0].values) {
        const eventType = row[0] as string;
        const count = row[1] as number;
        const catalogEntry = EVENTS_CATALOG[eventType];

        eventTypes.push({
          type: eventType,
          count,
          metadata: catalogEntry ? {
            category: catalogEntry.category,
            label: catalogEntry.label,
            labelEn: catalogEntry.labelEn,
            icon: catalogEntry.icon,
            description: catalogEntry.description,
            descriptionEn: catalogEntry.descriptionEn,
          } : undefined,
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('EventsAPI', 'Event types fetched successfully', {
      count: eventTypes.length,
      duration: `${duration}ms`,
    });

    const response: ApiResponse<typeof eventTypes> = {
      success: true,
      data: eventTypes,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('EventsAPI', 'Error fetching event types', {
      error: errorMessage,
    });

    const response: ApiResponse = {
      success: false,
      data: [],
      error: 'Failed to fetch event types',
    };

    res.status(500).json(response);
  }
});

// ============================================================================
// GET /api/v1/events/search - Search events by keywords
// ============================================================================

router.get('/search', (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { limit, offset } = validatePaginationParams(req);
    const query = (req.query.query as string || '').trim();

    if (!query) {
      const response: ApiResponse = {
        success: false,
        data: [],
        error: 'Search query is required',
      };
      return res.status(400).json(response);
    }

    logger.info('EventsAPI', 'Searching events', {
      query,
      limit,
      offset,
    });

    const db = eventRepository['dbManager'].getDatabase();
    if (!db) {
      const response: ApiResponse = {
        success: false,
        data: [],
        error: 'Database not initialized',
      };
      return res.status(500).json(response);
    }

    // Build search query - search in multiple fields
    const searchPattern = `%${query}%`;
    const searchStmt = db.prepare(`
      SELECT id, event_id, timestamp, event_type, commander, system_name,
             station_name, body, raw_json, created_at
      FROM events
      WHERE event_type LIKE ?
         OR system_name LIKE ?
         OR station_name LIKE ?
         OR body LIKE ?
         OR commander LIKE ?
         OR raw_json LIKE ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    searchStmt.bind([
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
      offset,
    ]);

    const events: EventWithMetadata[] = [];
    while (searchStmt.step()) {
      const row = searchStmt.getAsObject();
      const event: EventWithMetadata = {
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

      // Add metadata from catalog
      const catalogEntry = EVENTS_CATALOG[event.event_type];
      if (catalogEntry) {
        event.metadata = {
          category: catalogEntry.category,
          label: catalogEntry.label,
          labelEn: catalogEntry.labelEn,
          icon: catalogEntry.icon,
          description: catalogEntry.description,
          descriptionEn: catalogEntry.descriptionEn,
        };
      }

      events.push(event);
    }
    searchStmt.free();

    // Get total count for pagination
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM events
      WHERE event_type LIKE ?
         OR system_name LIKE ?
         OR station_name LIKE ?
         OR body LIKE ?
         OR commander LIKE ?
         OR raw_json LIKE ?
    `);
    countStmt.bind([
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    ]);

    let total = 0;
    if (countStmt.step()) {
      const row = countStmt.getAsObject();
      total = (row.count as number) || 0;
    }
    countStmt.free();

    const hasMore = offset + limit < total;
    const duration = Date.now() - startTime;

    logger.info('EventsAPI', 'Search completed successfully', {
      query,
      count: events.length,
      total,
      duration: `${duration}ms`,
    });

    const response: ApiResponse<EventWithMetadata[]> = {
      success: true,
      data: events,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('EventsAPI', 'Error searching events', {
      error: errorMessage,
    });

    const response: ApiResponse = {
      success: false,
      data: [],
      error: 'Failed to search events',
    };

    res.status(500).json(response);
  }
});

export default router;
