/**
 * Test script for DatabaseManager
 * Creates DB, inserts 10 events, reads back, outputs result
 */

import path from "path";
import fs from "fs";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-elite.db");

async function runTest() {
  console.log("🧪 Starting database test...\n");

  try {
    // Clean up previous test DB
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Import and init database
    const { dbManager } = await import("./db/DatabaseManager.js");
    await dbManager.init();
    console.log("✅ Database initialized\n");

    // Get database instance
    const db = dbManager.getDatabase();
    if (!db) throw new Error("Database not available");

    // Insert 10 test events
    console.log("📝 Inserting 10 test events...");
    const testEvents = [];
    for (let i = 1; i <= 10; i++) {
      const event = {
        event_id: `test-event-${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        event_type: i % 2 === 0 ? "FSDJump" : "Scan",
        commander: "TestCommander",
        system_name: `System-${i}`,
        station_name: i % 3 === 0 ? `Station-${i}` : null,
        body: null,
        raw_json: JSON.stringify({
          event: i % 2 === 0 ? "FSDJump" : "Scan",
          starSystem: `System-${i}`,
        }),
      };

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO events
        (event_id, timestamp, event_type, commander, system_name, station_name, body, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
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
      testEvents.push(event);
    }
    console.log(`✅ Inserted ${testEvents.length} events\n`);

    // Read back
    console.log("📖 Reading events back...");
    const readStmt = db.prepare(`
      SELECT event_id, timestamp, event_type, system_name, raw_json
      FROM events
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    const results = readStmt.all() as Array<{
      event_id: string;
      timestamp: string;
      event_type: string;
      system_name: string;
      raw_json: string;
    }>;

    console.log(`✅ Read ${results.length} events\n`);

    // Verify
    if (results.length !== 10) {
      throw new Error(`Expected 10 events, got ${results.length}`);
    }

    // Check stats
    const totalCount = db.prepare("SELECT COUNT(*) as count FROM events").get() as { count: number };

    console.log("📊 Stats:");
    console.log(`   Total events in DB: ${totalCount.count}`);
    console.log(`   First event: ${results[results.length - 1].system_name}`);
    console.log(`   Last event: ${results[0].system_name}\n`);

    // better-sqlite3 writes directly to disk, no manual save needed
    console.log("💾 Data persisted to disk automatically\n");

    // Cleanup
    dbManager.close();

    console.log("✅ Database OK");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runTest();
