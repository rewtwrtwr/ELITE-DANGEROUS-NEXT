// Global test setup
import { jest } from '@jest/globals';

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock console methods to reduce noise during tests
const originalConsole = global.console;
const mockConsole = {
  ...originalConsole,
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

global.console = mockConsole as unknown as Console;

// Cleanup after all tests
afterAll(async () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Restore console
  global.console = originalConsole;
});

// Setup before each test
beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});
