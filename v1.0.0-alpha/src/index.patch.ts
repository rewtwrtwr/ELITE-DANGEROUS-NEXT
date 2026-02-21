/**
 * Migration Patch: index.ts - From in-memory to SQLite
 *
 * This file demonstrates how to migrate the existing index.ts from
 * globalThis.events (in-memory) to DatabaseManager (src/data/)
 *
 * Changes needed in src/index.ts:
 */

// =============================================================================
// 1. ADD NEW IMPORTS (replace or add to existing imports)
// =============================================================================

// Old imports (keep existing ones):
// import express from 'express';
// import cors from 'cors';
// import { createServer } from 'http';
// import { Server as SocketIOServer } from 'socket.io';
// import fs from 'fs';

// NEW: Add DatabaseManager import from src/data/
import { databaseManager, JournalEvent } from './data/db-manager.js';

// =============================================================================
// 2. REPLACE GLOBAL STATE
// =============================================================================

// OLD: In-memory storage (globalThis.events)
// globalThis.events = [];
// globalThis.lastSaveTime = Date.now();

// NEW: Use DatabaseManager (singleton)
// The databaseManager handles connection, caching, and persistence automatically

// =============================================================================
// 3. UPDATE main() FUNCTION
// =============================================================================

/*
async function main() {
  // ... existing setup code ...

  // OLD: Initialize empty array
  // globalThis.events = [];

  // NEW: Connect to SQLite database
  try {
    await databaseManager.connect();
    console.log('[Main] Database connected successfully');
  } catch (error) {
    console.error('[Main] Failed to connect to database:', error);
    process.exit(1);
  }

  // ... rest of the code ...
}
*/

// =============================================================================
// 4. REPLACE EVENT LOADING
// =============================================================================

/*
// OLD: Load events into memory array
// function loadEventsFromJournal() {
//   const events = parseJournalFiles();
//   globalThis.events.push(...events);
// }

// NEW: Use databaseManager's built-in loading
// await databaseManager.loadRecentEvents(1000); // Called automatically in connect()

// Or load from journal files directly to database:
async function loadJournalFilesToDatabase(journalPath: string): Promise<number> {
  let loaded = 0;
  const batch: JournalEvent[] = [];

  const files = fs.readdirSync(journalPath)
    .filter(f => f.startsWith('Journal.') && f.endsWith('.log'))
    .sort()
    .slice(-5);

  for (const file of files) {
    const filePath = path.join(journalPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.event) {
          batch.push({
            event_id: `${file}:${event.timestamp}:${event.event}`,
            timestamp: event.timestamp || new Date().toISOString(),
            event_type: event.event,
            raw_data: JSON.stringify(event)
          });

          // Bulk insert every 500 events
          if (batch.length >= 500) {
            await databaseManager.saveEvents(batch);
            loaded += batch.length;
            batch.length = 0;
          }
        }
      } catch (e) {
        // Skip invalid lines
      }
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await databaseManager.saveEvents(batch);
    loaded += batch.length;
  }

  return loaded;
}
*/

// =============================================================================
// 5. REPLACE EVENT WATCHING
// =============================================================================

/*
// OLD: Watch and push to in-memory array
// function watchJournal() {
//   const watcher = fs.watch(journalFile, (eventType) => {
//     if (eventType === 'change') {
//       const newEvents = readNewEvents();
//       globalThis.events.push(...newEvents);
//     }
//   });
// }

// NEW: Watch and save directly to database
function watchJournalAndSave(journalPath: string, onEvent: (event: JournalEvent) => void): () => void {
  // ... existing file watching logic ...

  // Instead of: globalThis.events.push(event)
  // Use:
  // await databaseManager.saveEvent(event);

  return () => {
    // Cleanup function
  };
}
*/

// =============================================================================
// 6. UPDATE API ENDPOINTS (same routes, different implementation)
// =============================================================================

/*
// OLD: /api/v1/events endpoint
// app.get('/api/v1/events', (req, res) => {
//   const limit = parseInt(req.query.limit as string) || 100;
//   const offset = parseInt(req.query.offset as string) || 0;
//
//   const events = globalThis.events.slice(offset, offset + limit);
//   res.json({
//     events,
//     total: globalThis.events.length,
//     limit,
//     offset
//   });
// });

// NEW: Use databaseManager (same route!)
app.get('/api/v1/events', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  // Uses getRecentEvents() - same interface!
  const events = await databaseManager.getRecentEvents(limit, offset);
  const total = await databaseManager.getEventCount();

  res.json({
    events,
    total,
    limit,
    offset
  });
});

// OLD: /api/v1/stats endpoint
// app.get('/api/v1/stats', (req, res) => {
//   const stats = calculateInMemoryStats();
//   res.json(stats);
// });

// NEW: Use databaseManager
app.get('/api/v1/stats', async (req, res) => {
  // Get stats from database
  const stats = await databaseManager.getStats();
  res.json(stats);
});
*/

// =============================================================================
// 7. REPLACE AUTO-SAVE LOGIC
// =============================================================================

/*
// OLD: Manual save to memory
// function autoSave() {
//   const data = JSON.stringify(globalThis.events);
//   fs.writeFileSync('./data/events.json', data);
// }

// NEW: Use databaseManager's built-in persist()
// Auto-save is handled automatically, but you can also trigger manually:
function persistDatabase() {
  databaseManager.persist();
}
*/

// =============================================================================
// 8. UPDATE SHUTDOWN HANDLER
// =============================================================================

/*
// OLD:
// process.on('SIGINT', () => {
//   saveEventsToFile();
//   process.exit(0);
// });

// NEW: Use databaseManager.close() which handles cleanup automatically
const shutdown = async () => {
  console.log('Shutting down...');
  stopWatch(); // Stop file watcher

  if (saveInterval) {
    clearInterval(saveInterval);
  }

  // Close database (auto-persists)
  await databaseManager.close();

  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
*/

// =============================================================================
// SUMMARY OF CHANGES
// =============================================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MIGRATION CHECKLIST                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✓ Import databaseManager from './data/db-manager.js'                     │
│ ✓ Replace globalThis.events = [] with databaseManager.connect()          │
│ ✓ Replace event loading with databaseManager.loadRecentEvents()          │
│ ✓ Replace event saving with databaseManager.saveEvent/saveEvents()       │
│ ✓ Replace API responses with databaseManager.getRecentEvents()           │
│ ✓ Replace manual persist with databaseManager.persist()                  │
│ ✓ Replace shutdown save with databaseManager.close()                     │
│ ✓ API routes stay the SAME - no changes needed!                           │
└─────────────────────────────────────────────────────────────────────────────┘

Benefits:
- Data persists across server restarts
- No more memory limit issues
- Transactions for crash safety
- Indexes for fast queries
- Support for ~1000 events/hour gameplay
*/

export {};
