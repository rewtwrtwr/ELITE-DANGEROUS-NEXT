/**
 * Memory Profile Script
 * 
 * Monitors memory usage over time
 * Takes heap snapshots on demand
 */

import { writeHeapSnapshot } from 'v8';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = join(__dirname, '..', 'memory-snapshots');

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function takeSnapshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `heap-${timestamp}.heapsnapshot`;
  const filepath = join(SNAPSHOT_DIR, filename);
  
  console.log(`\n📸 Taking heap snapshot: ${filename}`);
  
  try {
    const snapshotPath = writeHeapSnapshot(filepath);
    console.log(`✅ Heap snapshot written to: ${snapshotPath}`);
    console.log(`   Size: ${formatBytes(fs.statSync(snapshotPath).size)}`);
    return snapshotPath;
  } catch (error) {
    console.error('❌ Failed to take heap snapshot:', error.message);
    return null;
  }
}

function logMemoryUsage(label = '') {
  const usage = process.memoryUsage();
  
  console.log(`\n${label || 'Memory Usage'}:`);
  console.log(`  RSS:        ${formatBytes(usage.rss)}`);
  console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`  Heap Used:  ${formatBytes(usage.heapUsed)}`);
  console.log(`  External:   ${formatBytes(usage.external)}`);
  
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    timestamp: Date.now(),
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      ELITE DANGEROUS NEXT - Memory Profile Script        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nSnapshot directory: ${SNAPSHOT_DIR}`);
  console.log(`\nControls:`);
  console.log(`  Press Ctrl+C to exit`);
  console.log(`  Send SIGUSR1 to take snapshot: kill -USR1 ${process.pid}`);
  console.log(`  On Windows: [Console] -> [Break] or use taskkill\n`);
  
  const samples = [];
  let sampleCount = 0;
  const maxSamples = 60; // 10 minutes at 10-second intervals
  
  // Log memory every 10 seconds
  const interval = setInterval(() => {
    sampleCount++;
    const sample = logMemoryUsage(`Sample ${sampleCount}/${maxSamples}`);
    samples.push(sample);
    
    if (sampleCount >= maxSamples) {
      console.log('\n✅ Maximum samples reached. Stopping monitoring.');
      clearInterval(interval);
      saveReport(samples);
    }
  }, 10000);
  
  // Take snapshot on SIGUSR1
  process.on('SIGUSR1', () => {
    takeSnapshot();
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Interrupted by user');
    clearInterval(interval);
    saveReport(samples);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Terminated');
    clearInterval(interval);
    saveReport(samples);
    process.exit(0);
  });
}

function saveReport(samples) {
  if (samples.length === 0) return;
  
  const fs = await import('fs');
  
  const report = {
    date: new Date().toISOString(),
    duration: samples.length * 10, // seconds
    samples,
    analysis: {
      initialRss: samples[0].rss,
      finalRss: samples[samples.length - 1].rss,
      initialHeapUsed: samples[0].heapUsed,
      finalHeapUsed: samples[samples.length - 1].heapUsed,
      rssGrowth: samples[samples.length - 1].rss - samples[0].rss,
      heapGrowth: samples[samples.length - 1].heapUsed - samples[0].heapUsed,
      avgRss: samples.reduce((sum, s) => sum + s.rss, 0) / samples.length,
      avgHeapUsed: samples.reduce((sum, s) => sum + s.heapUsed, 0) / samples.length,
    },
  };
  
  const filename = `memory-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(join(SNAPSHOT_DIR, filename), JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Memory Analysis:`);
  console.log(`   RSS Growth:        ${formatBytes(report.analysis.rssGrowth)}`);
  console.log(`   Heap Used Growth:  ${formatBytes(report.analysis.heapGrowth)}`);
  console.log(`   Average RSS:       ${formatBytes(report.analysis.avgRss)}`);
  console.log(`   Average Heap Used: ${formatBytes(report.analysis.avgHeapUsed)}`);
  console.log(`\n📄 Report saved to: ${filename}`);
}

// Start monitoring
main().catch(console.error);
