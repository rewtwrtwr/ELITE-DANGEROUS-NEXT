import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Server } from 'http';
import { dbManager } from '../../db/DatabaseManager.js';
import { eventRepository } from '../../db/EventRepository.js';
import { createMockEvents, toParsedEventData } from '../utils/mocks.js';

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/v1/status', (req, res) => {
    res.json({
      server: { version: '1.0.0-beta', uptime: process.uptime() },
      database: { connected: dbManager.isInitialized(), eventCount: eventRepository.count() },
    });
  });

  app.get('/api/v1/events', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      const result = eventRepository.getEvents(limit, offset);
      res.json({
        events: result.events,
        pagination: { limit: result.limit, offset: result.offset, total: result.total, hasMore: result.offset + result.events.length < result.total },
      });
    } catch (error) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/v1/events/count', (req, res) => {
    try {
      const count = eventRepository.count();
      res.json({ count, lastUpdated: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/v1/stats', (req, res) => {
    try {
      const stats = eventRepository.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/v1/journal/status', (req, res) => {
    res.json({ watching: false, path: null, filesLoaded: 0, lastEventTime: null });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
  });

  return { app };
}

describe('REST API Integration', () => {
  let app: express.Application;
  let server: Server;

  beforeEach(() => {
    process.env.TEST_DB_PATH = ':memory:';
    dbManager.init();
    const testApp = createTestApp();
    app = testApp.app;
    server = app.listen(0);
  });

  afterEach((done) => {
    server.close(() => {
      try {
        dbManager.close();
      } catch (e) {
        // Ignore
      }
      done();
    });
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(server).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/status', () => {
    it('should return 200 with server status', async () => {
      const response = await request(server).get('/api/v1/status');
      expect(response.status).toBe(200);
      expect(response.body.server).toBeDefined();
      expect(response.body.server.version).toBe('1.0.0-beta');
      expect(response.body.database).toBeDefined();
      expect(response.body.database.connected).toBe(true);
    });

    it('should include database event count', async () => {
      const mockEvents = createMockEvents(5);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
      const response = await request(server).get('/api/v1/status');
      expect(response.body.database.eventCount).toBe(5);
    });
  });

  describe('GET /api/v1/events', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(20);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return 200 with events array', async () => {
      const response = await request(server).get('/api/v1/events');
      expect(response.status).toBe(200);
      expect(response.body.events).toBeDefined();
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should return paginated results with default limit', async () => {
      const response = await request(server).get('/api/v1/events');
      expect(response.body.events.length).toBeLessThanOrEqual(50);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.total).toBe(20);
    });

    it('should respect limit parameter', async () => {
      const response = await request(server).get('/api/v1/events?limit=5');
      expect(response.body.events.length).toBe(5);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should cap limit at 500', async () => {
      const response = await request(server).get('/api/v1/events?limit=1000');
      expect(response.body.pagination.limit).toBe(500);
    });

    it('should handle offset parameter', async () => {
      const response1 = await request(server).get('/api/v1/events?limit=5&offset=0');
      const response2 = await request(server).get('/api/v1/events?limit=5&offset=5');
      expect(response1.body.events[0].event_id).not.toBe(response2.body.events[0].event_id);
      expect(response1.body.pagination.offset).toBe(0);
      expect(response2.body.pagination.offset).toBe(5);
    });

    it('should return hasMore flag', async () => {
      const response = await request(server).get('/api/v1/events?limit=5');
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should return events ordered by timestamp DESC', async () => {
      const response = await request(server).get('/api/v1/events?limit=5');
      expect(response.body.events[0].timestamp).toBe('2026-02-28T00:19:00.000Z');
    });
  });

  describe('GET /api/v1/events/count', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(15);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return 200 with event count', async () => {
      const response = await request(server).get('/api/v1/events/count');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(15);
      expect(response.body.lastUpdated).toBeDefined();
    });

    it('should return 0 for empty database', async () => {
      dbManager.close();
      dbManager.init();
      const testApp = createTestApp();
      const newServer = testApp.app.listen(0);
      const response = await request(newServer).get('/api/v1/events/count');
      expect(response.body.count).toBe(0);
      await new Promise<void>((resolve) => newServer.close(() => resolve()));
      dbManager.close();
    });
  });

  describe('GET /api/v1/stats', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents(10);
      const parsedEvents = mockEvents.map(toParsedEventData);
      eventRepository.insertEvents(parsedEvents);
    });

    it('should return 200 with statistics', async () => {
      const response = await request(server).get('/api/v1/stats');
      expect(response.status).toBe(200);
      expect(response.body.totalEvents).toBe(10);
    });

    it('should include eventsByType breakdown', async () => {
      const response = await request(server).get('/api/v1/stats');
      expect(response.body.eventsByType).toBeDefined();
      expect(response.body.eventsByType.FSDJump).toBe(5);
      expect(response.body.eventsByType.Docked).toBe(5);
    });

    it('should include unique systems count', async () => {
      const response = await request(server).get('/api/v1/stats');
      expect(response.body.uniqueSystems).toBeGreaterThan(0);
    });

    it('should include first and last event timestamps', async () => {
      const response = await request(server).get('/api/v1/stats');
      expect(response.body.firstEvent).toBeTruthy();
      expect(response.body.lastEvent).toBeTruthy();
    });
  });

  describe('GET /api/v1/journal/status', () => {
    it('should return 200 with journal status', async () => {
      const response = await request(server).get('/api/v1/journal/status');
      expect(response.status).toBe(200);
      expect(response.body.watching).toBeDefined();
      expect(response.body.filesLoaded).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(server).get('/unknown-route');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 404 for unknown API routes', async () => {
      const response = await request(server).get('/api/v1/unknown');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NOT_FOUND');
    });
  });
});
