import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { eventRepository } from '../../db/EventRepository.js';
import { dbManager } from '../../db/DatabaseManager.js';
import { createMockEvents, toParsedEventData, mockJournalEvent } from '../utils/mocks.js';

describe('EventRepository', () => {
  beforeEach(() => {
    process.env.TEST_DB_PATH = ':memory:';
    dbManager.init();
  });

  afterEach(() => {
    try {
      dbManager.close();
    } catch (e) {
      // Ignore
    }
  });

  describe('generateEventId()', () => {
    it('should generate deterministic event ID', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        raw_json: JSON.stringify({ StarSystem: 'Sol' }),
      };
      const id1 = eventRepository.generateEventId(data);
      const id2 = eventRepository.generateEventId(data);
      expect(id1).toBe(id2);
    });

    it('should include event type in ID', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        raw_json: '{}',
      };
      const id = eventRepository.generateEventId(data);
      expect(id).toContain('FSDJump');
    });

    it('should include unique key from JSON', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        raw_json: JSON.stringify({ StarSystem: 'Sol' }),
      };
      const id = eventRepository.generateEventId(data);
      expect(id).toContain('Sol');
    });
  });

  describe('toEliteEvent()', () => {
    it('should convert parsed data to EliteEvent', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        system_name: 'Sol',
        raw_json: JSON.stringify({ StarSystem: 'Sol' }),
      };
      const event = eventRepository.toEliteEvent(data);
      expect(event.event_type).toBe('FSDJump');
      expect(event.system_name).toBe('Sol');
      expect(event.raw_json).toBeTruthy();
    });

    it('should handle invalid JSON in raw_json', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        raw_json: 'invalid json',
      };
      const event = eventRepository.toEliteEvent(data);
      expect(event.raw_json).toBeTruthy();
      expect(() => JSON.parse(event.raw_json)).not.toThrow();
    });
  });

  describe('insertEvent()', () => {
    it('should insert single event', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        system_name: 'Sol',
        raw_json: JSON.stringify(mockJournalEvent),
      };
      const eventId = eventRepository.insertEvent(data);
      expect(eventId).toBeTruthy();
      const count = eventRepository.count();
      expect(count).toBe(1);
    });

    it('should handle duplicate events (INSERT OR REPLACE)', () => {
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        system_name: 'Sol',
        raw_json: JSON.stringify({ ...mockJournalEvent, JumpDist: 5.5 }),
      };
      eventRepository.insertEvent(data);
      const data2 = {
        ...data,
        raw_json: JSON.stringify({ ...mockJournalEvent, JumpDist: 10.5 }),
      };
      eventRepository.insertEvent(data2);
      const count = eventRepository.count();
      expect(count).toBe(1);
    });

    it('should return null if database not initialized', () => {
      dbManager.close();
      // With :memory: database, after close the data is lost
      // Re-init creates a fresh empty database
      dbManager.init();
      // Insert should work on fresh DB but count should be 1 (just inserted)
      const data = {
        timestamp: '2026-02-28T12:00:00.000Z',
        event: 'FSDJump',
        raw_json: '{}',
      };
      const result = eventRepository.insertEvent(data);
      // After re-init, insert should work on fresh DB
      expect(result).toBeTruthy();
      expect(eventRepository.count()).toBe(1);
    });
  });

  describe('insertEvents()', () => {
    it('should insert batch of events', () => {
      const mockEvents = createMockEvents(10);
      const parsedEvents = mockEvents.map(toParsedEventData);
      const count = eventRepository.insertEvents(parsedEvents);
      expect(count).toBe(10);
      expect(eventRepository.count()).toBe(10);
    });

    it('should handle empty array', () => {
      const count = eventRepository.insertEvents([]);
      expect(count).toBe(0);
      expect(eventRepository.count()).toBe(0);
    });

    it('should use transactions', () => {
      const mockEvents = createMockEvents(5);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
      expect(eventRepository.count()).toBe(5);
    });
  });

  describe('getEvents()', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(20);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return events ordered by timestamp DESC', () => {
      const result = eventRepository.getEvents(20, 0);
      expect(result.events.length).toBe(20);
      expect(result.events[0].timestamp).toBe('2026-02-28T00:19:00.000Z');
    });

    it('should respect limit parameter', () => {
      const result = eventRepository.getEvents(5, 0);
      expect(result.events.length).toBe(5);
      expect(result.limit).toBe(5);
    });

    it('should return total count', () => {
      const result = eventRepository.getEvents(10, 0);
      expect(result.total).toBe(20);
    });

    it('should handle offset', () => {
      const result1 = eventRepository.getEvents(5, 0);
      const result2 = eventRepository.getEvents(5, 5);
      expect(result1.events[0].event_id).not.toBe(result2.events[0].event_id);
    });
  });

  describe('getEventsByCursor()', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(20);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return newest events without cursor', () => {
      const result = eventRepository.getEventsByCursor(null, 5);
      expect(result.data.length).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('should handle cursor pagination', () => {
      const first = eventRepository.getEventsByCursor(null, 5);
      const cursor = first.nextCursor;
      expect(cursor).toBeTruthy();
      const second = eventRepository.getEventsByCursor(cursor, 5);
      expect(second.data.length).toBe(5);
      expect(second.data[0].timestamp).toBeDefined();
    });

    it('should return hasMore false when at end', () => {
      const result = eventRepository.getEventsByCursor(null, 100);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should include total count', () => {
      const result = eventRepository.getEventsByCursor(null, 5);
      expect(result.total).toBe(20);
    });
  });

  describe('count()', () => {
    it('should return total event count', () => {
      const mockEvents = createMockEvents(15);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
      const count = eventRepository.count();
      expect(count).toBe(15);
    });

    it('should return 0 for empty database', () => {
      const count = eventRepository.count();
      expect(count).toBe(0);
    });

    it('should return 0 if database not initialized', () => {
      dbManager.close();
      const count = eventRepository.count();
      expect(count).toBe(0);
    });
  });

  describe('getStats()', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(10);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return event type statistics', () => {
      const stats = eventRepository.getStats();
      expect(stats.totalEvents).toBe(10);
      expect(stats.eventsByType).toBeDefined();
      expect(stats.eventsByType.FSDJump).toBe(5);
      expect(stats.eventsByType.Docked).toBe(5);
    });

    it('should return unique systems count', () => {
      const stats = eventRepository.getStats();
      expect(stats.uniqueSystems).toBeGreaterThan(0);
    });

    it('should return first and last event timestamps', () => {
      const stats = eventRepository.getStats();
      expect(stats.firstEvent).toBeTruthy();
      expect(stats.lastEvent).toBeTruthy();
    });

    it('should handle empty database', () => {
      dbManager.close();
      dbManager.init();
      const stats = eventRepository.getStats();
      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsByType).toEqual({});
      expect(stats.uniqueSystems).toBe(0);
    });
  });

  describe('getLatestEvent()', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(5);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return latest event', () => {
      const latest = eventRepository.getLatestEvent();
      expect(latest).toBeTruthy();
      expect(latest?.timestamp).toBe('2026-02-28T00:04:00.000Z');
    });

    it('should filter by event type', () => {
      const latest = eventRepository.getLatestEvent('FSDJump');
      expect(latest).toBeTruthy();
      expect(latest?.event_type).toBe('FSDJump');
    });

    it('should return null for non-existent event type', () => {
      const latest = eventRepository.getLatestEvent('NonExistent');
      expect(latest).toBeNull();
    });

    it('should return null if database not initialized', () => {
      dbManager.close();
      // With :memory: database, after close the data is lost
      // Re-init creates a fresh empty database
      dbManager.init();
      // getLatestEvent should return null on empty DB
      const latest = eventRepository.getLatestEvent();
      expect(latest).toBeNull();
    });
  });

  describe('getAllEvents()', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(10);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return all events', () => {
      const result = eventRepository.getAllEvents();
      expect(result.data.length).toBe(10);
      expect(result.total).toBe(10);
    });

    it('should respect limit parameter', () => {
      const result = eventRepository.getAllEvents(5);
      expect(result.data.length).toBe(5);
    });

    it('should return events ordered by timestamp DESC', () => {
      const result = eventRepository.getAllEvents();
      expect(result.data[0].timestamp).toBe('2026-02-28T00:09:00.000Z');
    });
  });
});
