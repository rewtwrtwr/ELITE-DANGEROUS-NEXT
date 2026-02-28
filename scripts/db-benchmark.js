/**
 * Database Performance Benchmark Script
 * 
 * Tests critical database queries
 * Reports execution times
 */

import { dbManager } from '../dist/db/DatabaseManager.js';
import { eventRepository } from '../dist/db/EventRepository.js';

async function benchmark(name, fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = (end - start).toFixed(2);
  console.log(`${name.padEnd(40)}: ${duration.padStart(8)}ms`);
  return { name, duration, result };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   ELITE DANGEROUS NEXT - Database Performance Benchmark  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nDate: ${new Date().toISOString()}`);
  console.log('\nInitializing database...\n');
  
  await dbManager.init();
  
  const initialCount = eventRepository.count();
  console.log(`Total events in database: ${initialCount}\n`);
  
  console.log('Running benchmarks...\n');
  console.log('═'.repeat(60));
  
  const results = [];
  
  // Basic queries
  results.push(await benchmark('COUNT all events', async () => {
    return eventRepository.count();
  }));
  
  results.push(await benchmark('SELECT 50 events', async () => {
    return eventRepository.getEvents(50, 0);
  }));
  
  results.push(await benchmark('SELECT 500 events', async () => {
    return eventRepository.getEvents(500, 0);
  }));
  
  results.push(await benchmark('SELECT latest event', async () => {
    return eventRepository.getLatestEvent();
  }));
  
  // Aggregation queries
  results.push(await benchmark('Get statistics', async () => {
    return eventRepository.getStats();
  }));
  
  results.push(await benchmark('Get events by cursor (50)', async () => {
    return eventRepository.getEventsByCursor(null, 50);
  }));
  
  results.push(await benchmark('Get all events (limited 100)', async () => {
    return eventRepository.getAllEvents(100);
  }));
  
  // Filtered queries
  results.push(await benchmark('Filter by type (FSDJump)', async () => {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE event_type = 'FSDJump' 
      ORDER BY timestamp DESC 
      LIMIT 50
    `);
    const events = [];
    while (stmt.step()) {
      events.push(stmt.getAsObject());
    }
    stmt.free();
    return events.length;
  }));
  
  results.push(await benchmark('Filter by system (Sol)', async () => {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE system_name = 'Sol' 
      ORDER BY timestamp DESC 
      LIMIT 50
    `);
    const events = [];
    while (stmt.step()) {
      events.push(stmt.getAsObject());
    }
    stmt.free();
    return events.length;
  }));
  
  // Insert performance
  results.push(await benchmark('INSERT single event', async () => {
    const testData = {
      timestamp: new Date().toISOString(),
      event: 'TestEvent',
      system_name: 'TestSystem',
      raw_json: JSON.stringify({ test: true }),
    };
    return eventRepository.insertEvent(testData);
  }));
  
  const testEvents = Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date().toISOString(),
    event: 'TestEvent',
    system_name: 'TestSystem',
    raw_json: JSON.stringify({ test: true, index: i }),
  }));
  
  results.push(await benchmark('INSERT batch (100 events)', async () => {
    return eventRepository.insertEvents(testEvents);
  }));
  
  console.log('═'.repeat(60));
  
  // Summary
  console.log('\nSUMMARY\n');
  
  const targets = {
    'COUNT all events': 10,
    'SELECT 50 events': 50,
    'SELECT 500 events': 200,
    'SELECT latest event': 20,
    'Get statistics': 100,
    'INSERT single event': 5,
    'INSERT batch (100 events)': 100,
  };
  
  let passed = 0;
  let failed = 0;
  
  console.log('| Test | Time | Target | Status |');
  console.log('|------|------|--------|--------|');
  
  for (const result of results) {
    const target = targets[result.name];
    if (target) {
      const status = parseFloat(result.duration) <= target ? '✅ PASS' : '❌ FAIL';
      console.log(`| ${result.name.padEnd(20)} | ${result.duration.padEnd(4)}ms | <${String(target).padEnd(3)}ms | ${status.padEnd(6)} |`);
      
      if (parseFloat(result.duration) <= target) passed++;
      else failed++;
    } else {
      console.log(`| ${result.name.padEnd(20)} | ${result.duration.padEnd(4)}ms | N/A | ℹ️  INFO |`);
    }
  }
  
  console.log(`\nTotal: ${passed + failed} targeted tests, ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  // Save results
  const fs = await import('fs');
  const report = {
    date: new Date().toISOString(),
    totalEvents: initialCount,
    results: results.map(r => ({
      name: r.name,
      duration: parseFloat(r.duration),
    })),
    summary: {
      passed,
      failed,
      successRate: ((passed / (passed + failed)) * 100).toFixed(1),
    },
  };
  
  fs.writeFileSync(
    './scripts/db-benchmark-results.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\nResults saved to: ./scripts/db-benchmark-results.json`);
  
  await dbManager.close();
}

main().catch(console.error);
