import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DatabaseManagerClass } from '../../db/DatabaseManager.js';
import * as fs from 'fs';
import * as path from 'path';

describe('DatabaseManager', () => {
  let dbManagerInstance: DatabaseManagerClass;
  let dbPath: string;

  beforeEach(() => {
    // Create unique in-memory database for each test
    dbPath = ':memory:';
    process.env.TEST_DB_PATH = dbPath;
    dbManagerInstance = new DatabaseManagerClass();
    dbManagerInstance.init();
  });

  afterEach(() => {
    try {
      dbManagerInstance.close();
    } catch (e) {
      // Ignore close errors
    }
  });

  describe('init()', () => {
    it('should create database', () => {
      expect(dbManagerInstance.isInitialized()).toBe(true);
    });

    it('should load schema from data/schema.sql', () => {
      const database = dbManagerInstance.getDatabase();
      expect(database).toBeTruthy();

      const result = database!.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").all();
      expect(result.length).toBe(1);
    });

    it('should set isInitialized to true', () => {
      expect(dbManagerInstance.isInitialized()).toBe(true);
    });

    it('should handle double initialization gracefully', () => {
      dbManagerInstance.init();
      expect(dbManagerInstance.isInitialized()).toBe(true);
    });
  });

  describe('isInitialized()', () => {
    it('should return true after init', () => {
      expect(dbManagerInstance.isInitialized()).toBe(true);
    });
  });

  describe('close()', () => {
    it('should close database connection', () => {
      expect(dbManagerInstance.isInitialized()).toBe(true);
      dbManagerInstance.close();
      expect(dbManagerInstance.isInitialized()).toBe(false);
    });

    it('should complete without error', () => {
      expect(() => dbManagerInstance.close()).not.toThrow();
    });
  });

  describe('getDatabase()', () => {
    it('should return database instance after init', () => {
      const database = dbManagerInstance.getDatabase();
      expect(database).toBeTruthy();
    });
  });

  describe('exec()', () => {
    it('should execute SQL', () => {
      dbManagerInstance.exec("INSERT INTO events (event_id, timestamp, event_type, raw_json) VALUES ('test-exec-unique', '2026-02-28T12:00:00.000Z', 'Test', '{}')");
      const database = dbManagerInstance.getDatabase();
      const result = database!.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      expect(result.count).toBe(1);
    });

    it('should throw if not initialized', () => {
      dbManagerInstance.close();
      expect(() => dbManagerInstance.exec('SELECT 1')).toThrow('Database not initialized');
    });
  });

  describe('prepare()', () => {
    it('should prepare a statement', () => {
      const stmt = dbManagerInstance.prepare('SELECT 1');
      expect(stmt).toBeTruthy();
    });

    it('should throw if not initialized', () => {
      dbManagerInstance.close();
      expect(() => dbManagerInstance.prepare('SELECT 1')).toThrow('Database not initialized');
    });
  });

  describe('transaction()', () => {
    it('should execute a transaction', () => {
      const result = dbManagerInstance.transaction(() => {
        const database = dbManagerInstance.getDatabase()!;
        database.prepare("INSERT INTO events (event_id, timestamp, event_type, raw_json) VALUES (?, ?, ?, ?)").run(
          'tx-test-unique-1',
          '2026-02-28T12:00:00.000Z',
          'Test',
          '{}'
        );
        database.prepare("INSERT INTO events (event_id, timestamp, event_type, raw_json) VALUES (?, ?, ?, ?)").run(
          'tx-test-unique-2',
          '2026-02-28T12:01:00.000Z',
          'Test',
          '{}'
        );
        return 'success';
      });

      expect(result).toBe('success');
      const count = dbManagerInstance.getDatabase()!.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      expect(count.count).toBe(2);
    });

    it('should rollback on error', () => {
      expect(() => {
        dbManagerInstance.transaction(() => {
          const database = dbManagerInstance.getDatabase()!;
          database.prepare("INSERT INTO events (event_id, timestamp, event_type, raw_json) VALUES (?, ?, ?, ?)").run(
            'tx-rollback-unique',
            '2026-02-28T12:00:00.000Z',
            'Test',
            '{}'
          );
          throw new Error('Rollback test');
        });
      }).toThrow('Rollback test');

      const count = dbManagerInstance.getDatabase()!.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      expect(count.count).toBe(0);
    });
  });
});
