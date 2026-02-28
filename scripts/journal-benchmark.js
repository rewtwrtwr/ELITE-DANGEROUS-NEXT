/**
 * Journal Loading Performance Benchmark
 * 
 * Measures journal file loading performance
 * Tracks time per file and events per second
 */

import { dbManager } from '../src/db/DatabaseManager.js';
import { eventRepository } from '../src/db/EventRepository.js';
import { JournalFastLoader } from '../src/journal/loader.js';
import fs from 'fs';
import path from 'path';

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   ELITE DANGEROUS NEXT - Journal Loading Benchmark       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nDate: ${new Date().toISOString()}`);
  
  // Get journal path
  const journalPath = process.env.JOURNAL_PATH || 
    path.join(process.env.USERPROFILE || '', 'Saved Games', 'Frontier Developments', 'Elite Dangerous');
  
  console.log(`\nJournal path: ${journalPath}`);
  
  if (!fs.existsSync(journalPath)) {
    console.log(`❌ Journal path does not exist!`);
    return;
  }
  
  // Find journal files
  const files = fs.readdirSync(journalPath)
    .filter(f => f.startsWith('Journal.') && f.endsWith('.log'))
    .sort()
    .reverse();
  
  console.log(`Found ${files.length} journal files\n`);
  
  // Initialize database
  console.log('Initializing database...');
  const dbInitStart = performance.now();
  await dbManager.init();
  const dbInitTime = performance.now() - dbInitStart;
  console.log(`Database initialized in ${formatDuration(dbInitTime)}\n`);
  
  const initialCount = eventRepository.count();
  console.log(`Initial event count: ${initialCount}\n`);
  
  console.log('═'.repeat(60));
  console.log('PHASE 1: Priority Files (3 most recent)');
  console.log('═'.repeat(60));
  
  const priorityFiles = files.slice(0, 3);
  const priorityResults = [];
  
  for (const file of priorityFiles) {
    const filePath = path.join(journalPath, file);
    const fileSize = fs.statSync(filePath).size;
    
    console.log(`\nLoading: ${file}`);
    console.log(`  Size: ${formatBytes(fileSize)}`);
    
    const start = performance.now();
    
    const loader = new JournalFastLoader(journalPath, {
      maxFiles: 1,
      priorityFiles: [file],
    });
    
    const result = await loader.loadAll();
    const duration = performance.now() - start;
    
    const eventsLoaded = result.totalEvents || 0;
    const eventsPerSec = eventsLoaded / (duration / 1000);
    
    console.log(`  Events loaded: ${eventsLoaded}`);
    console.log(`  Duration: ${formatDuration(duration)}`);
    console.log(`  Speed: ${eventsPerSec.toFixed(0)} events/sec`);
    
    priorityResults.push({
      file,
      size: fileSize,
      events: eventsLoaded,
      duration,
      eventsPerSec,
    });
  }
  
  const priorityTotal = priorityResults.reduce((sum, r) => sum + r.duration, 0);
  const priorityEvents = priorityResults.reduce((sum, r) => sum + r.events, 0);
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Priority Files Summary:`);
  console.log(`  Total time: ${formatDuration(priorityTotal)}`);
  console.log(`  Total events: ${priorityEvents}`);
  console.log(`  Average speed: ${(priorityEvents / (priorityTotal / 1000)).toFixed(0)} events/sec`);
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log('PHASE 2: Background Files (next 10)');
  console.log('═'.repeat(60));
  
  const backgroundFiles = files.slice(3, 13);
  const backgroundResults = [];
  
  const backgroundStart = performance.now();
  let backgroundTotalEvents = 0;
  
  for (const file of backgroundFiles) {
    const filePath = path.join(journalPath, file);
    const fileSize = fs.statSync(filePath).size;
    
    const start = performance.now();
    
    const loader = new JournalFastLoader(journalPath, {
      maxFiles: 1,
      priorityFiles: [file],
    });
    
    const result = await loader.loadAll();
    const duration = performance.now() - start;
    
    const eventsLoaded = result.totalEvents || 0;
    backgroundTotalEvents += eventsLoaded;
    
    backgroundResults.push({
      file,
      size: fileSize,
      events: eventsLoaded,
      duration,
    });
    
    console.log(`  ${file}: ${eventsLoaded} events in ${formatDuration(duration)}`);
  }
  
  const backgroundTotal = performance.now() - backgroundStart;
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Background Files Summary:`);
  console.log(`  Files processed: ${backgroundFiles.length}`);
  console.log(`  Total time: ${formatDuration(backgroundTotal)}`);
  console.log(`  Total events: ${backgroundTotalEvents}`);
  console.log(`  Average speed: ${(backgroundTotalEvents / (backgroundTotal / 1000)).toFixed(0)} events/sec`);
  
  // Final stats
  const finalCount = eventRepository.count();
  const totalLoaded = finalCount - initialCount;
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Initial events: ${initialCount}`);
  console.log(`  Final events: ${finalCount}`);
  console.log(`  Total loaded: ${totalLoaded}`);
  console.log(`  Priority phase: ${formatDuration(priorityTotal)}`);
  console.log(`  Background phase: ${formatDuration(backgroundTotal)}`);
  console.log(`  Total time: ${formatDuration(priorityTotal + backgroundTotal)}`);
  
  // Targets
  const targets = {
    priorityFiles: 5000, // 5 seconds
    backgroundFiles: 30000, // 30 seconds
  };
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log('TARGETS');
  console.log('═'.repeat(60));
  console.log(`  Priority (3 files):  ${formatDuration(priorityTotal)} / <${formatDuration(targets.priorityFiles)} ${priorityTotal <= targets.priorityFiles ? '✅' : '❌'}`);
  console.log(`  Background (10 files): ${formatDuration(backgroundTotal)} / <${formatDuration(targets.backgroundFiles)} ${backgroundTotal <= targets.backgroundFiles ? '✅' : '❌'}`);
  
  // Save results
  const report = {
    date: new Date().toISOString(),
    journalPath,
    totalFiles: files.length,
    initialCount,
    finalCount,
    totalLoaded,
    phases: {
      priority: {
        files: priorityFiles.length,
        duration: priorityTotal,
        events: priorityEvents,
        results: priorityResults,
      },
      background: {
        files: backgroundFiles.length,
        duration: backgroundTotal,
        events: backgroundTotalEvents,
        results: backgroundResults,
      },
    },
    targets: {
      priority: targets.priorityFiles,
      background: targets.backgroundFiles,
      priorityStatus: priorityTotal <= targets.priorityFiles ? 'PASS' : 'FAIL',
      backgroundStatus: backgroundTotal <= targets.backgroundFiles ? 'PASS' : 'FAIL',
    },
  };
  
  const fs = await import('fs');
  fs.writeFileSync(
    './scripts/journal-benchmark-results.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\nResults saved to: ./scripts/journal-benchmark-results.json`);
  
  await dbManager.close();
}

main().catch(console.error);
