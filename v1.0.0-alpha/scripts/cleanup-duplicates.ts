/**
 * Cleanup Duplicates Script
 *
 * Usage: npx tsx scripts/cleanup-duplicates.ts
 *
 * This script:
 * 1. Finds duplicate events by timestamp and event_type
 * 2. Keeps the most recent one (highest ID)
 * 3. Deletes the duplicates
 * 4. Reports statistics
 *
 * Note: This script directly accesses the SQLite database file
 */

import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "elite.db");

interface DuplicateGroup {
  timestamp: string;
  event_type: string;
  ids: number[];
}

function log(message: string) {
  console.log(`[CLEANUP] ${message}`);
}

function logError(message: string) {
  console.error(`[ERROR] ${message}`);
}

async function cleanupDuplicates(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Duplicate Event Cleanup Script");
  console.log("=".repeat(60));

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    logError(`Database not found at: ${DB_PATH}`);
    log("Please run the server first to create the database");
    return;
  }

  log(`Using database: ${DB_PATH}`);

  // Use better-sqlite3 directly for this script
  const Database = require("better-sqlite3");
  const db = new Database(DB_PATH, { readonly: false });

  try {
    // Get initial count
    const initialCountResult = db.exec("SELECT COUNT(*) FROM events");
    const initialCount = initialCountResult[0]?.values[0]?.[0] as number || 0;
    log(`Initial event count: ${initialCount}`);

    if (initialCount === 0) {
      log("No events to clean up");
      return;
    }

    // Find duplicates - events with same timestamp and event_type
    // (This catches the 1-minute interval duplicates)
    log("Finding duplicate events...");

    const duplicates = db.prepare(`
      SELECT timestamp, event_type, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
      FROM events
      GROUP BY timestamp, event_type
      HAVING COUNT(*) > 1
    `).all() as Array<{timestamp: string, event_type: string, cnt: number, ids: string}>;

    log(`Found ${duplicates.length} groups of duplicate events`);

    if (duplicates.length === 0) {
      log("No duplicates found!");
      return;
    }

    // Show sample duplicates
    log("\nSample duplicate groups:");
    for (const dup of duplicates.slice(0, 5)) {
      log(`  ${dup.event_type} @ ${dup.timestamp} - ${dup.cnt} copies`);
    }

    // Delete duplicates, keeping the one with highest ID (most recent)
    let deletedCount = 0;
    const deleteStmt = db.prepare("DELETE FROM events WHERE id = ?");

    for (const dup of duplicates) {
      const ids = dup.ids.split(",").map(Number).sort((a, b) => a - b);
      // Keep the last (highest) ID, delete the rest
      const toDelete = ids.slice(0, -1);

      for (const id of toDelete) {
        deleteStmt.run(id);
        deletedCount++;
      }
    }

    deleteStmt.free();

    // Get final count
    const finalCountResult = db.exec("SELECT COUNT(*) FROM events");
    const finalCount = finalCountResult[0]?.values[0]?.[0] as number || 0;

    log(`\nResults:`);
    log(`  Deleted: ${deletedCount} duplicate events`);
    log(`  Kept: ${finalCount} unique events`);
    log(`  Total removed: ${initialCount - finalCount}`);

    // Verify no duplicates remain
    const remainingDupes = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM events
      GROUP BY timestamp, event_type
      HAVING COUNT(*) > 1
    `).all();

    if (remainingDupes.length === 0) {
      log("\n✅ All duplicates cleaned up successfully!");
    } else {
      log(`\n⚠️  Warning: ${remainingDupes.length} duplicate groups remain`);
    }

    // Run VACUUM to reclaim space
    log("\nRunning VACUUM to optimize database...");
    db.exec("VACUUM");
    log("Done!");

  } catch (error) {
    logError(`Error during cleanup: ${error}`);
  } finally {
    db.close();
  }

  console.log("=".repeat(60));
}

/**
 * Alternative: Truncate and rebuild approach
 * Use this if you want to start fresh with proper deduplication
 */
async function truncateAndRebuild(): Promise<void> {
  console.log("=".repeat(60));
  console.log("TRUNCATE AND REBUILD MODE");
  console.log("=".repeat(60));
  console.log("⚠️  This will DELETE ALL events and rebuild the database!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

  await new Promise(resolve => setTimeout(resolve, 5000));

  const Database = require("better-sqlite3");
  const db = new Database(DB_PATH);

  try {
    log("Truncating events table...");
    db.exec("DELETE FROM events");
    db.exec("VACUUM");
    log("Events table truncated");

    log("\n✅ Database cleared. Restart the server to reload events with proper deduplication.");
  } finally {
    db.close();
  }
}

// Run the cleanup
cleanupDuplicates().catch(console.error);
