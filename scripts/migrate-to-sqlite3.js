/**
 * Migration Script: sql.js → better-sqlite3
 * 
 * This script migrates data from the old sql.js in-memory database
 * to the new better-sqlite3 native SQLite database.
 * 
 * Usage:
 *   node scripts/migrate-to-sqlite3.js
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Database paths
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const OLD_DB_PATH = path.join(DATA_DIR, 'elite.db');
const NEW_DB_PATH = path.join(DATA_DIR, 'elite-native.db');
const BACKUP_PATH = path.join(DATA_DIR, 'elite.db.backup.sqljs');

/**
 * Initialize old sql.js database and export data
 */
async function exportSqlJsData() {
  console.log('📤 Exporting data from sql.js...');
  
  // Dynamic import for sql.js
  const initSqlJs = (await import('sql.js')).default;
  const SqlJs = await initSqlJs();
  
  if (!fs.existsSync(OLD_DB_PATH)) {
    console.log('ℹ️  No existing sql.js database found, skipping export');
    return [];
  }
  
  try {
    // Load existing database
    const fileBuffer = fs.readFileSync(OLD_DB_PATH);
    const db = new SqlJs.Database(fileBuffer);
    
    // Export all events
    const result = db.exec('SELECT event_id, timestamp, event_type, commander, system_name, station_name, body, raw_json FROM events');
    
    if (!result[0] || !result[0].values) {
      console.log('ℹ️  No events found in sql.js database');
      db.close();
      return [];
    }
    
    const columns = result[0].columns;
    const events = result[0].values.map(row => {
      const event = {};
      columns.forEach((col, idx) => {
        event[col] = row[idx];
      });
      return event;
    });
    
    db.close();
    
    console.log(`✅ Exported ${events.length} events from sql.js`);
    return events;
  } catch (error) {
    console.error('❌ Error exporting from sql.js:', error.message);
    return [];
  }
}

/**
 * Create new better-sqlite3 database with schema
 */
function createNewDatabase() {
  console.log('📥 Creating new better-sqlite3 database...');
  
  // Remove existing new database if present
  if (fs.existsSync(NEW_DB_PATH)) {
    fs.unlinkSync(NEW_DB_PATH);
  }
  
  // Create new database
  const db = new Database(NEW_DB_PATH);
  
  // Enable WAL mode
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = memory');
  db.pragma('foreign_keys = ON');
  
  // Create events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      commander TEXT,
      system_name TEXT,
      station_name TEXT,
      body TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(event_type, timestamp DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_system ON events(system_name, timestamp DESC)`);
  
  console.log('✅ New database created with schema');
  return db;
}

/**
 * Import events into new database
 */
function importEvents(db, events) {
  if (events.length === 0) {
    console.log('ℹ️  No events to import');
    return 0;
  }
  
  console.log(`📝 Importing ${events.length} events...`);
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO events
    (event_id, timestamp, event_type, commander, system_name, station_name, body, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((eventsList) => {
    for (const event of eventsList) {
      stmt.run(
        event.event_id,
        event.timestamp,
        event.event_type,
        event.commander,
        event.system_name,
        event.station_name,
        event.body,
        event.raw_json
      );
    }
  });
  
  transaction(events);
  
  // Verify count
  const count = db.prepare('SELECT COUNT(*) as count FROM events').get();
  console.log(`✅ Imported ${count.count} events`);
  
  return count.count;
}

/**
 * Backup old database and replace with new one
 */
function finalizeMigration() {
  console.log('🔒 Finalizing migration...');
  
  // Backup old database if exists
  if (fs.existsSync(OLD_DB_PATH)) {
    console.log('📋 Creating backup of old database...');
    fs.copyFileSync(OLD_DB_PATH, BACKUP_PATH);
    console.log(`✅ Backup created: ${BACKUP_PATH}`);
    
    // Remove old database
    fs.unlinkSync(OLD_DB_PATH);
    console.log('🗑️  Old database removed');
    
    // Remove old WAL files if exist
    const oldWalPath = OLD_DB_PATH + '-wal';
    const oldShmPath = OLD_DB_PATH + '-shm';
    if (fs.existsSync(oldWalPath)) fs.unlinkSync(oldWalPath);
    if (fs.existsSync(oldShmPath)) fs.unlinkSync(oldShmPath);
  }
  
  // Rename new database to standard name
  if (fs.existsSync(NEW_DB_PATH)) {
    fs.renameSync(NEW_DB_PATH, OLD_DB_PATH);
    console.log('✅ New database renamed to elite.db');
    
    // Rename WAL files if they exist
    const newWalPath = NEW_DB_PATH + '-wal';
    const newShmPath = NEW_DB_PATH + '-shm';
    if (fs.existsSync(newWalPath)) fs.renameSync(newWalPath, OLD_DB_PATH + '-wal');
    if (fs.existsSync(newShmPath)) fs.renameSync(newShmPath, OLD_DB_PATH + '-shm');
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting migration from sql.js to better-sqlite3...\n');
  
  try {
    // Step 1: Export data from sql.js
    const events = await exportSqlJsData();
    
    // Step 2: Create new database
    const newDb = createNewDatabase();
    
    // Step 3: Import events
    const importedCount = importEvents(newDb, events);
    
    // Step 4: Close new database (checkpoint WAL)
    newDb.pragma('wal_checkpoint(PASSIVE)');
    newDb.close();
    
    // Step 5: Finalize migration
    finalizeMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Events migrated: ${importedCount}`);
    console.log(`   - New database: ${OLD_DB_PATH}`);
    console.log(`   - Backup: ${BACKUP_PATH}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
main();
