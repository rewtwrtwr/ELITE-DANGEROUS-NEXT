/**
 * Test script for DatabaseManager
 * Creates DB, inserts 10 events, reads back, outputs result
 */

import path from 'path';
import fs from 'fs';

// Test database path - use different file to avoid conflicts
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-elite.db');

async function runTest() {
  console.log('🧪 Starting database test...\n');
  console.log('📁 Database path:', TEST_DB_PATH, '\n');

  try {
    // Clean up previous test DB
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Import DatabaseManager
    const { databaseManager } = await import('./db-manager.js');

    // Connect to database with custom path
    await databaseManager.connect(TEST_DB_PATH);
    console.log('✅ Database initialized\n');

    // Insert 10 test events
    console.log('📝 Inserting 10 test events...');
    const testEvents = [];

    for (let i = 1; i <= 10; i++) {
      const event = {
        event_id: `test-event-${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        event_type: i % 2 === 0 ? 'FSDJump' : 'Scan',
        raw_data: JSON.stringify({
          event: i % 2 === 0 ? 'FSDJump' : 'Scan',
          StarSystem: `System-${i}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
        }),
      };
      testEvents.push(event);
    }

    // Save events
    const insertedCount = await databaseManager.saveEvents(testEvents);
    console.log(`✅ Inserted ${insertedCount} events\n`);

    // Read back
    console.log('📖 Reading events back...');
    const events = await databaseManager.getRecentEvents(10);
    console.log(`✅ Read ${events.length} events\n`);

    // Verify
    if (events.length !== 10) {
      throw new Error(`Expected 10 events, got ${events.length}`);
    }

    // Check stats
    const totalCount = await databaseManager.getEventCount();
    console.log('📊 Stats:');
    console.log(`   Total events in DB: ${totalCount}`);
    console.log(`   First event: ${events[events.length - 1].event_type}`);
    console.log(`   Last event: ${events[0].event_type}\n`);

    // Persist to disk BEFORE closing
    databaseManager.persist();

    // Verify file was created BEFORE closing
    if (!fs.existsSync(TEST_DB_PATH)) {
      throw new Error('Database file was not created');
    }
    const fileStats = fs.statSync(TEST_DB_PATH);
    console.log(`💾 Database saved: ${fileStats.size} bytes\n`);

    // Close - now it's safe
    await databaseManager.close();

    console.log('✅ Database OK');
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    process.exit(1);
  }
}

runTest();
