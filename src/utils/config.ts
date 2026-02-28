/**
 * Application Configuration
 * Environment-based configuration for test/production isolation
 */

import path from 'path';

export interface AppConfig {
  isTest: boolean;
  isProduction: boolean;
  dbPath: string;
  journalPath: string;
  port: number;
  logLevel: string;
}

/**
 * Get database path based on environment
 */
function getDatabasePath(): string {
  // Allow explicit override
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // Test environment uses isolated database
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), 'data', `test-${Date.now()}.db`);
  }

  // Default production path
  return path.join(process.cwd(), 'data', 'elite.db');
}

/**
 * Get journal path based on environment
 */
function getJournalPath(): string {
  // Allow explicit override
  if (process.env.JOURNAL_PATH) {
    return process.env.JOURNAL_PATH;
  }

  // Test environment uses fixtures
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), 'tests', 'fixtures', 'journals');
  }

  // Production: platform-specific paths
  if (process.platform === 'win32') {
    const savedGames = process.env.USERPROFILE || '';
    return path.join(
      savedGames,
      'Saved Games',
      'Frontier Developments',
      'Elite Dangerous',
    );
  }

  return path.join(process.env.HOME || '', 'EliteDangerous');
}

/**
 * Get application configuration
 */
export function getConfig(): AppConfig {
  const isTest = process.env.NODE_ENV === 'test';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isTest,
    isProduction,
    dbPath: getDatabasePath(),
    journalPath: getJournalPath(),
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  };
}

/**
 * Validate configuration for production use
 */
export function validateProductionConfig(): void {
  const config = getConfig();

  if (config.isTest) {
    throw new Error(
      'Cannot run in production mode with NODE_ENV=test. ' +
      'Please set NODE_ENV=production or unset NODE_ENV.',
    );
  }

  // Validate journal path exists in production
  if (config.isProduction) {
    const fs = require('fs');
    if (!fs.existsSync(config.journalPath)) {
      console.warn(
        `Warning: Journal path does not exist: ${config.journalPath}. ` +
        'Elite Dangerous may not be installed or configured.',
      );
    }
  }
}

/**
 * Log configuration (safe for production - no secrets)
 */
export function logConfig(): void {
  const config = getConfig();

  console.log('Application Configuration:');
  console.log(`  Environment: ${config.isTest ? 'test' : config.isProduction ? 'production' : 'development'}`);
  console.log(`  Database Path: ${config.dbPath}`);
  console.log(`  Journal Path: ${config.journalPath}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Log Level: ${config.logLevel}`);
}
