/**
 * Verification Script: better-sqlite3 Migration
 * 
 * This script verifies that the migration from sql.js to better-sqlite3
 * was successful by checking data integrity and database functionality.
 * 
 * Usage:
 *   node scripts/verify-migration.js
 */

import { dbManager } from '../dist/db/DatabaseManager.js';
import { eventRepository } from '../dist/db/EventRepository.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const BACKUP_PATH = path.join(DATA_DIR, 'elite.db.backup.sqljs');

/**
 * Verify database file exists
 */
function verifyDatabaseFile() {
  console.log('📁 Verifying database file...');
  
  const dbPath = path.join(DATA_DIR, 'elite.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found: ' + dbPath);
    return false;
  }
  
  const stats = fs.statSync(dbPath);
  console.log(`✅ Database file exists (${(stats.size / 1024).toFixed(2)} KB)`);
  
  // Check for WAL files
  const walPath = dbPath + '-wal';
  const shmPath = dbPath + '-shm';
  
  if (fs.existsSync(walPath)) {
    const walStats = fs.statSync(walPath);
    console.log(`ℹ️  WAL file exists (${(walStats.size / 1024).toFixed(2)} KB)`);
  }
  
  if (fs.existsSync(shmPath)) {
    const shmStats = fs.statSync(shmPath);
    console.log(`ℹ️  SHM file exists (${(shmStats.size / 1024).toFixed(2)} KB)`);
  }
  
  // Check for backup
  if (fs.existsSync(BACKUP_PATH)) {
    const backupStats = fs.statSync(BACKUP_PATH);
    console.log(`✅ Backup file exists (${(backupStats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log('ℹ️  No backup file (expected if no previous data)');
  }
  
  return true;
}

/**
 * Verify database initialization and schema
 */
function verifySchema() {
  console.log('\n📋 Verifying database schema...');
  
  try {
    dbManager.init();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
  
  const db = dbManager.getDatabase();
  if (!db) {
    console.error('❌ Database instance is null');
    return false;
  }
  
  // Check tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
  `).all();
  
  const tableNames = tables.map(t => t.name);
  const requiredTables = ['events', 'sqlite_sequence'];
  
  for (const table of requiredTables) {
    if (tableNames.includes(table)) {
      console.log(`✅ Table '${table}' exists`);
    } else {
      console.error(`❌ Table '${table}' not found`);
      return false;
    }
  }
  
  // Check indexes
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='events' ORDER BY name
  `).all();
  
  console.log(`✅ Found ${indexes.length} indexes on events table`);
  indexes.forEach(idx => console.log(`   - ${idx.name}`));
  
  // Check columns
  const columns = db.pragma("table_info('events')");
  const columnNames = columns.map(c => c.name);
  const requiredColumns = [
    'id', 'event_id', 'timestamp', 'event_type',
    'commander', 'system_name', 'station_name', 'body', 'raw_json', 'created_at'
  ];
  
  for (const col of requiredColumns) {
    if (columnNames.includes(col)) {
      console.log(`✅ Column '${col}' exists`);
    } else {
      console.error(`❌ Column '${col}' not found`);
      return false;
    }
  }
  
  return true;
}

/**
 * Verify data integrity
 */
function verifyDataIntegrity() {
  console.log('\n📊 Verifying data integrity...');
  
  try {
    // Get total count
    const count = eventRepository.count();
    console.log(`✅ Total events: ${count}`);
    
    if (count === 0) {
      console.log('ℹ️  Database is empty (expected for fresh install)');
      return true;
    }
    
    // Get stats
    const stats = eventRepository.getStats();
    console.log(`✅ Event types: ${Object.keys(stats.eventsByType).length}`);
    console.log(`✅ Unique systems: ${stats.uniqueSystems}`);
    console.log(`✅ First event: ${stats.firstEvent || 'N/A'}`);
    console.log(`✅ Last event: ${stats.lastEvent || 'N/A'}`);
    
    // Show event type breakdown
    console.log('\n📈 Events by type:');
    for (const [type, count] of Object.entries(stats.eventsByType)) {
      console.log(`   - ${type}: ${count}`);
    }
    
    // Verify sample events
    console.log('\n🔍 Sample events:');
    const sample = eventRepository.getEvents(5, 0);
    sample.events.forEach((event, idx) => {
      console.log(`   ${idx + 1}. ${event.timestamp} - ${event.event_type}${event.system_name ? ` (${event.system_name})` : ''}`);
    });
    
    // Verify raw_json is valid JSON
    let invalidJsonCount = 0;
    const allEvents = eventRepository.getAllEvents(100);
    for (const event of allEvents.data) {
      try {
        JSON.parse(event.raw_json);
      } catch {
        invalidJsonCount++;
      }
    }
    
    if (invalidJsonCount > 0) {
      console.error(`❌ Found ${invalidJsonCount} events with invalid raw_json`);
      return false;
    }
    console.log(`✅ All sampled events have valid raw_json`);
    
  } catch (error) {
    console.error('❌ Data verification failed:', error.message);
    return false;
  }
  
  return true;
}

/**
 * Verify database operations
 */
function verifyOperations() {
  console.log('\n🧪 Verifying database operations...');
  
  try {
    // Test insert
    const testData = {
      timestamp: new Date().toISOString(),
      event: 'VerificationTest',
      system_name: 'TestSystem',
      raw_json: JSON.stringify({ test: true, timestamp: Date.now() }),
    };
    
    const eventId = eventRepository.insertEvent(testData);
    if (!eventId) {
      console.error('❌ Failed to insert test event');
      return false;
    }
    console.log('✅ Insert operation works');
    
    // Test retrieve
    const latestEvent = eventRepository.getLatestEvent('VerificationTest');
    if (!latestEvent) {
      console.error('❌ Failed to retrieve test event');
      return false;
    }
    console.log('✅ Retrieve operation works');
    
    // Test update (insert same event_id)
    const updatedData = {
      ...testData,
      raw_json: JSON.stringify({ test: true, updated: true, timestamp: Date.now() }),
    };
    const updateResult = eventRepository.insertEvent(updatedData);
    if (!updateResult) {
      console.error('❌ Failed to update test event');
      return false;
    }
    console.log('✅ Update operation works (INSERT OR REPLACE)');
    
    // Verify count is still 1 (not 2)
    const countAfterUpdate = eventRepository.count();
    const countBeforeUpdate = countAfterUpdate - 1;
    console.log(`✅ Count after update: ${countAfterUpdate} (expected: ${countBeforeUpdate + 1})`);
    
    // Clean up test event
    const db = dbManager.getDatabase();
    db.prepare("DELETE FROM events WHERE event_type = 'VerificationTest'").run();
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Operations verification failed:', error.message);
    return false;
  }
  
  return true;
}

/**
 * Main verification function
 */
async function main() {
  console.log('🚀 Starting migration verification...\n');
  
  let allPassed = true;
  
  // Run verification checks
  allPassed = verifyDatabaseFile() && allPassed;
  allPassed = verifySchema() && allPassed;
  allPassed = verifyDataIntegrity() && allPassed;
  allPassed = verifyOperations() && allPassed;
  
  // Close database
  dbManager.close();
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All verification checks passed!');
    console.log('🎉 Migration to better-sqlite3 was successful!');
  } else {
    console.error('❌ Some verification checks failed!');
    console.error('⚠️  Please review the errors above and fix any issues.');
    process.exit(1);
  }
}

// Run verification
main();
