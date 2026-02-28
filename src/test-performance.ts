/**
 * Performance Test Script for Journal Loading
 *
 * Usage: npx tsx src/test-performance.ts
 *
 * Measures:
 * - Time to load all journal files
 * - Events per second insert rate
 * - Memory usage during load
 * - Total events loaded
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// Test configuration
const JOURNAL_PATH = process.env.JOURNAL_PATH ||
  (process.platform === "win32"
    ? path.join(process.env.USERPROFILE || "", "Saved Games", "Frontier Developments", "Elite Dangerous")
    : path.join(process.env.HOME || "", "EliteDangerous"));

const BATCH_SIZE = 500;
const MAX_CONCURRENT_FILES = 5;

// Simple concurrency limiter
class Limiter {
  private queue: Array<() => Promise<void>> = [];
  private running = 0;

  constructor(private concurrency: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.concurrency) {
        this.running++;
        task();
      } else {
        this.queue.push(task);
      }
    });
  }

  private processQueue() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }
}

interface ParsedEventData {
  filename: string;
  timestamp: string;
  event: string;
  commander?: string;
  system_name?: string;
  station_name?: string;
  body?: string;
  raw_json: string;
}

function parseLine(line: string, filename: string): ParsedEventData | null {
  try {
    const event = JSON.parse(line);
    if (!event || !event.event) return null;

    return {
      filename,
      timestamp: event.timestamp || event.timestamp_local || new Date().toISOString(),
      event: event.event,
      commander: event.cmdr || event.Commander || undefined,
      system_name: event.StarSystem || event.system || undefined,
      station_name: event.StationName || event.station || undefined,
      body: event.BodyName || event.body || undefined,
      raw_json: line,
    };
  } catch {
    return null;
  }
}

async function loadFile(filepath: string): Promise<number> {
  const filename = path.basename(filepath);
  let eventsLoaded = 0;
  let batch: ParsedEventData[] = [];

  const fileStream = fs.createReadStream(filepath, {
    encoding: "utf-8",
    highWaterMark: 64 * 1024,
  });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    const parsedEvent = parseLine(line, filename);
    if (parsedEvent) {
      batch.push(parsedEvent);
      eventsLoaded++;

      if (batch.length >= BATCH_SIZE) {
        // Simulate batch insert (in real code, this goes to DB)
        batch = [];
      }
    }
  }

  // Remaining batch
  if (batch.length > 0) {
    batch = [];
  }

  return eventsLoaded;
}

async function getJournalFiles(): Promise<string[]> {
  if (!fs.existsSync(JOURNAL_PATH)) {
    console.error(`Journal path does not exist: ${JOURNAL_PATH}`);
    return [];
  }

  const files = await fs.promises.readdir(JOURNAL_PATH);
  return files
    .filter((f) => f.startsWith("Journal.") && f.endsWith(".log"))
    .sort()
    .reverse();
}

async function runPerformanceTest() {
  console.log("=".repeat(60));
  console.log("Journal Loader Performance Test");
  console.log("=".repeat(60));
  console.log(`Journal Path: ${JOURNAL_PATH}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Node.js: ${process.version}`);
  console.log("");

  // Get file list
  const files = await getJournalFiles();
  const totalFiles = files.length;

  if (totalFiles === 0) {
    console.log("No journal files found!");
    return;
  }

  console.log(`Found ${totalFiles} journal files`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Max concurrent files: ${MAX_CONCURRENT_FILES}`);
  console.log("");

  // Show file list with sizes
  console.log("Files to process:");
  for (const file of files.slice(0, 10)) {
    const filepath = path.join(JOURNAL_PATH, file);
    try {
      const stats = await fs.promises.stat(filepath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  - ${file} (${sizeMB} MB)`);
    } catch {
      console.log(`  - ${file}`);
    }
  }
  if (totalFiles > 10) {
    console.log(`  ... and ${totalFiles - 10} more files`);
  }
  console.log("");

  // Start performance measurement
  console.log("Starting load...");
  console.time("journal-load");

  const limiter = new Limiter(MAX_CONCURRENT_FILES);
  let totalEvents = 0;
  let processedFiles = 0;
  let errors = 0;

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  for (const filename of files) {
    const filepath = path.join(JOURNAL_PATH, filename);

    await limiter.run(async () => {
      try {
        const count = await loadFile(filepath);
        totalEvents += count;
        processedFiles++;

        // Progress output
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (totalEvents / (Date.now() - startTime) * 1000).toFixed(0);

        if (processedFiles % 10 === 0 || processedFiles === totalFiles) {
          console.log(`  Progress: ${processedFiles}/${totalFiles} files, ${totalEvents} events (${rate} events/sec, ${elapsed}s)`);
        }
      } catch (err) {
        errors++;
        console.error(`  Error loading ${filename}:`, err);
      }
    });
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;
  const elapsedSeconds = (endTime - startTime) / 1000;

  console.timeEnd("journal-load");

  // Results
  console.log("");
  console.log("=".repeat(60));
  console.log("RESULTS");
  console.log("=".repeat(60));
  console.log(`Files processed: ${processedFiles}/${totalFiles}`);
  console.log(`Total events: ${totalEvents.toLocaleString()}`);
  console.log(`Errors: ${errors}`);
  console.log("");
  console.log(`Time: ${elapsedSeconds.toFixed(2)} seconds`);
  console.log(`Rate: ${(totalEvents / elapsedSeconds).toFixed(0)} events/second`);
  console.log("");
  console.log(`Memory start: ${(startMemory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Memory end: ${(endMemory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Memory delta: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)} MB`);

  // Performance rating
  console.log("");
  console.log("PERFORMANCE RATING:");
  if (elapsedSeconds <= 5) {
    console.log("✅ EXCELLENT - Loaded in under 5 seconds!");
  } else if (elapsedSeconds <= 10) {
    console.log("⚠️  GOOD - Loaded in under 10 seconds");
  } else if (elapsedSeconds <= 30) {
    console.log("⚠️  NEEDS IMPROVEMENT - Over 10 seconds");
  } else {
    console.log("❌ SLOW - Over 30 seconds, needs optimization");
  }

  console.log("");
  console.log("=".repeat(60));
}

// Run the test
runPerformanceTest().catch(console.error);
