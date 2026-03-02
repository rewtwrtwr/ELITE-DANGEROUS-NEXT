/**
 * Test Database Utilities
 * Supports both in-memory (:memory:) and file-based databases
 */

import { DatabaseManagerClass } from '../../db/DatabaseManager.js';
import { EventRepositoryClass } from '../../db/EventRepository.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get database path based on test type
 * - unit tests: :memory: (fast, isolated, no persistence)
 * - integration tests: unique file path (tests persistence)
 */
export function getTestDatabasePath(suiteName: string): string {
  const testType = process.env.TEST_TYPE || 'unit';
  
  if (testType === 'unit') {
    return ':memory:';
  }
  
  // Integration tests use unique file paths
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  const uniqueId = `test-${suiteName}-${timestamp}-${random}`;
  return path.join(process.cwd(), 'data', `${uniqueId}.db`);
}

/**
 * Create isolated database instance for testing
 */
export function createTestDatabase(suiteName: string = 'default') {
  const dbPath = getTestDatabasePath(suiteName);
  
  // Override DB path for this instance
  const originalEnv = process.env.TEST_DB_PATH;
  process.env.TEST_DB_PATH = dbPath;
  
  // Create new instances
  const dbManager = new DatabaseManagerClass();
  const eventRepository = new EventRepositoryClass();
  
  // Initialize database
  dbManager.init();
  
  // Return cleanup function
  return {
    dbManager,
    eventRepository,
    dbPath,
    isMemory: dbPath === ':memory:',
    cleanup: async () => {
      // Close database
      try {
        dbManager.close();
      } catch (e) {
        // Ignore close errors
      }
      
      // Restore original env
      process.env.TEST_DB_PATH = originalEnv;
      
      // Remove database files only for file-based tests
      if (dbPath !== ':memory:') {
        await cleanupDatabaseFiles(dbPath);
      }
    },
  };
}

/**
 * Cleanup database files (main, WAL, SHM) with retry for Windows
 */
export async function cleanupDatabaseFiles(dbPath: string): Promise<void> {
  const filesToRemove = [
    dbPath,
    dbPath + '-wal',
    dbPath + '-shm',
    dbPath + '.backup',
    dbPath + '.tmp',
  ];

  // Retry logic for Windows file locking
  for (let attempt = 0; attempt < 3; attempt++) {
    let allDeleted = true;
    
    for (const file of filesToRemove) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (e) {
        // File might still be locked, wait and retry
        allDeleted = false;
      }
    }
    
    if (allDeleted) {
      return;
    }
    
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
  }
  
  // Final attempt - ignore failures for temp files
  for (const file of filesToRemove) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (e) {
      // Ignore final failures
    }
  }
}

/**
 * Setup test database with Jest hooks
 * Use at the TOP of describe() block
 * 
 * @param suiteName - Name of test suite for file naming (ignored for unit tests)
 */
export interface TestDatabaseSetup {
  getDbManager: () => DatabaseManagerClass;
  getEventRepository: () => EventRepositoryClass;
  getDbPath: () => string;
  isMemory: boolean;
  cleanup: () => Promise<void>;
}

export function setupTestDatabase(suiteName: string = 'default'): TestDatabaseSetup {
  let dbManager: DatabaseManagerClass;
  let eventRepository: EventRepositoryClass;
  let dbPath: string;
  let isMemory: boolean;
  let initialized = false;

  // Initialize before first test in suite
  beforeAll(() => {
    dbPath = getTestDatabasePath(suiteName);
    isMemory = dbPath === ':memory:';
    process.env.TEST_DB_PATH = dbPath;
    dbManager = new DatabaseManagerClass();
    eventRepository = new EventRepositoryClass();
    dbManager.init();
    initialized = true;
  });

  // Cleanup after all tests in suite
  afterAll(async () => {
    if (initialized) {
      try {
        dbManager.close();
      } catch (e) {
        // Ignore
      }
      if (!isMemory) {
        await cleanupDatabaseFiles(dbPath);
      }
      initialized = false;
    }
  });

  return {
    getDbManager: () => {
      if (!initialized) throw new Error('Database not initialized - beforeAll not called');
      return dbManager;
    },
    getEventRepository: () => {
      if (!initialized) throw new Error('Database not initialized - beforeAll not called');
      return eventRepository;
    },
    getDbPath: () => dbPath,
    isMemory,
    cleanup: async () => {
      if (initialized) {
        try {
          dbManager.close();
        } catch (e) {
          // Ignore
        }
        if (!isMemory) {
          await cleanupDatabaseFiles(dbPath);
        }
        initialized = false;
      }
    },
  };
}
