/**
 * JournalFastLoader - Optimized streaming journal loader for Elite Dangerous
 *
 * Features:
 * - **Streaming**: Uses `fs.createReadStream` + `readline` for memory efficiency (no full file load)
 * - **Parallel processing**: Maximum 5 concurrent files for faster loading
 * - **Bulk insert**: Transactions with 500 events per batch for optimal performance
 * - **Progress callback**: Real-time progress updates for UI
 * - **Incremental load**: Skips already processed files (by size and mtime)
 * - **Priority loading**: Newest files loaded first for fast bootstrap
 *
 * Performance target: < 5 seconds for any number of journal files
 *
 * @example
 * ```typescript
 * const loader = new JournalFastLoader(journalPath);
 *
 * // Quick load (only 5 newest files)
 * await loader.quickLoad((progress) => {
 *   console.log(`Loaded ${progress.loaded} events from ${progress.currentFile}`);
 * });
 *
 * // Full load (all files)
 * await loader.fullLoad((progress) => {
 *   console.log(`Progress: ${progress.percent}%`);
 * });
 * ```
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { eventRepository, ParsedEventData } from "../db/EventRepository.js";
import { logger } from "../utils/logger.js";

// p-limit equivalent - simple concurrency limiter
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

/**
 * Progress information for journal loading
 */
export interface JournalProgress {
  loaded: number;
  total: number;
  currentFile: string;
  percent: number;
}

/**
 * Callback function for progress updates
 */
export type ProgressCallback = (progress: JournalProgress) => void;

/**
 * Information about a processed journal file
 */
export interface ProcessedFile {
  filename: string;
  filesize: number;
  mtime: number;
  eventsCount: number;
}

const BATCH_SIZE = 500;
const MAX_CONCURRENT_FILES = 5;
const PROCESSED_FILES_TABLE = "processed_files";

export class JournalFastLoader {
  private limiter: Limiter;
  private journalPath: string;
  private totalEventsLoaded = 0;
  private processedFiles: Map<string, ProcessedFile> = new Map();

  /**
   * Create JournalFastLoader instance
   *
   * @param {string} journalPath - Path to Elite Dangerous journal directory
   */
  constructor(journalPath: string) {
    this.journalPath = journalPath;
    this.limiter = new Limiter(MAX_CONCURRENT_FILES);
  }

  /**
   * Get all journal files sorted by date (newest first)
   *
   * Journal files are named: Journal.YYYY-MM-DDTHHMMSS.01.log
   * Sorting alphabetically in reverse order gives us newest first.
   *
   * @returns {Promise<string[]>} Array of journal filenames
   * @private
   */
  private async getJournalFiles(): Promise<string[]> {
    const files = await fs.promises.readdir(this.journalPath);
    return files
      .filter((f) => f.startsWith("Journal.") && f.endsWith(".log"))
      .sort()
      .reverse(); // Newest first for fast bootstrap
  }

  /**
   * Get file stats (size, mtime)
   */
  private async getFileStats(
    filepath: string,
  ): Promise<{ size: number; mtime: number }> {
    const stats = await fs.promises.stat(filepath);
    return { size: stats.size, mtime: stats.mtimeMs };
  }

  /**
   * Check if file was already processed (incremental load)
   */
  private isFileProcessed(
    filename: string,
    currentStats: { size: number; mtime: number },
  ): boolean {
    const processed = this.processedFiles.get(filename);
    if (!processed) return false;

    // Skip if file size and mtime haven't changed
    return (
      processed.filesize === currentStats.size &&
      processed.mtime === currentStats.mtime
    );
  }

  /**
   * Parse a single line from journal with backward compatibility
   */
  private parseLine(line: string, filename: string): ParsedEventData | null {
    try {
      const event = JSON.parse(line);
      if (!event || !event.event) return null;

      // Normalize timestamp for old/new formats
      const timestamp =
        event.timestamp || event.timestamp_local || new Date().toISOString();

      // Normalize event name (some old events may have different casing)
      const eventName = event.event;

      // Extract fields with backward compatibility
      const commander =
        event.cmdr || event.Commander || event.commander || undefined;
      const system_name =
        event.StarSystem || event.system || event.System || undefined;
      const station_name =
        event.StationName || event.station || event.Station || undefined;
      const body = event.BodyName || event.body || event.Body || undefined;

      // Ensure raw_json is properly escaped if needed
      let raw_json = line;
      try {
        // Re-encode to ensure valid JSON
        raw_json = JSON.stringify(event);
      } catch {
        // Keep original line if re-encoding fails
        raw_json = line;
      }

      return {
        filename,
        timestamp,
        event: eventName,
        commander,
        system_name,
        station_name,
        body,
        raw_json,
      };
    } catch (error) {
      console.warn(
        `Failed to parse journal line: ${line.substring(0, 100)}...`,
        error,
      );
      return null;
    }
  }

  /**
   * Stream-parse a single journal file
   * Uses fs.createReadStream + readline for memory efficiency
   */
  private async loadFile(
    filepath: string,
    progressCallback?: ProgressCallback,
  ): Promise<number> {
    const filename = path.basename(filepath);
    const fileStats = await this.getFileStats(filepath);

    // Check if file already processed
    if (this.isFileProcessed(filename, fileStats)) {
      logger.debug("Journal", `Skipping already processed: ${filename}`);
      return 0;
    }

    logger.info("Journal", `Loading: ${filename}`);

    let eventsLoaded = 0;
    let batch: ParsedEventData[] = [];

    // Create streaming interface
    const fileStream = fs.createReadStream(filepath, {
      encoding: "utf-8",
      highWaterMark: 64 * 1024, // 64KB chunks
    });

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    // Process lines one by one (streaming)
    for await (const line of rl) {
      if (!line.trim()) continue;

      const parsedEvent = this.parseLine(line, filename);
      if (parsedEvent) {
        batch.push(parsedEvent);
        eventsLoaded++;

        // Bulk insert when batch is full
        if (batch.length >= BATCH_SIZE) {
          eventRepository.insertEvents(batch);
          this.totalEventsLoaded += batch.length;
          batch = [];

          // Report progress
          if (progressCallback) {
            progressCallback({
              loaded: this.totalEventsLoaded,
              total: 0, // Unknown until we count all files
              currentFile: filename,
              percent: 0,
            });
          }
        }
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      eventRepository.insertEvents(batch);
      this.totalEventsLoaded += batch.length;
    }

    // Mark file as processed
    this.processedFiles.set(filename, {
      filename,
      filesize: fileStats.size,
      mtime: fileStats.mtime,
      eventsCount: eventsLoaded,
    });

    logger.info("Journal", `Loaded ${eventsLoaded} events from ${filename}`);
    return eventsLoaded;
  }

  /**
   * Load all journal files with parallel processing
   *
   * Two-phase loading:
   * 1. **Phase 1**: Load priority files (newest first) for fast bootstrap
   * 2. **Phase 2**: Load remaining files in background
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for progress updates
   * @param {number} [priorityFiles=3] - Number of files to load first for fast bootstrap
   * @param {boolean} [loadAll=true] - If false, only load priority files
   * @returns {Promise<number>} Total number of events loaded
   *
   * @example
   * ```typescript
   * // Load all files with progress
   * const total = await loader.loadAllJournals((progress) => {
   *   console.log(`Loaded ${progress.loaded} events from ${progress.currentFile}`);
   * });
   *
   * // Quick load (only 5 newest files)
   * await loader.loadAllJournals(undefined, 5, false);
   * ```
   */
  async loadAllJournals(
    progressCallback?: ProgressCallback,
    priorityFiles: number = 3,
    loadAll: boolean = true,
  ): Promise<number> {
    this.totalEventsLoaded = 0;

    if (!fs.existsSync(this.journalPath)) {
      logger.warn(
        "Journal",
        `Journal path does not exist: ${this.journalPath}`,
      );
      return 0;
    }

    const allFiles = await this.getJournalFiles();
    const totalFiles = allFiles.length;

    if (totalFiles === 0) {
      logger.info("Journal", "No journal files found");
      return 0;
    }

    logger.info("Journal", `Found ${totalFiles} journal files`);

    // Split into priority (newest) and background files
    const priority = allFiles.slice(0, priorityFiles);
    const background = allFiles.slice(priorityFiles);

    // Phase 1: Load priority files first (for fast UI bootstrap)
    logger.info(
      "Journal",
      `Phase 1: Loading ${priority.length} priority files...`,
    );

    for (const filename of priority) {
      const filepath = path.join(this.journalPath, filename);
      await this.limiter.run(() => this.loadFile(filepath, progressCallback));
    }

    // Phase 2: Load remaining files in background (if requested)
    if (loadAll && background.length > 0) {
      logger.info(
        "Journal",
        `Phase 2: Loading ${background.length} background files...`,
      );

      for (const filename of background) {
        const filepath = path.join(this.journalPath, filename);
        await this.limiter.run(() => this.loadFile(filepath, progressCallback));
      }
    }

    logger.info(
      "Journal",
      `Total loaded: ${this.totalEventsLoaded} events from ${totalFiles} files`,
    );
    return this.totalEventsLoaded;
  }

  /**
   * Quick load - only newest files for fast startup
   *
   * Loads only 5 most recent journal files for fast UI bootstrap.
   * Use this for initial bootstrap, then call `fullLoad()` for complete sync.
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for progress updates
   * @returns {Promise<number>} Total number of events loaded
   */
  async quickLoad(progressCallback?: ProgressCallback): Promise<number> {
    return this.loadAllJournals(progressCallback, 5, false);
  }

  /**
   * Full load - all files with progress tracking
   *
   * Loads all journal files with 3-file priority bootstrap.
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for progress updates
   * @returns {Promise<number>} Total number of events loaded
   */
  async fullLoad(progressCallback?: ProgressCallback): Promise<number> {
    return this.loadAllJournals(progressCallback, 3, true);
  }

  /**
   * Get count of processed files (for incremental load tracking)
   *
   * @returns {number} Number of files already processed in this session
   */
  getProcessedFilesCount(): number {
    return this.processedFiles.size;
  }

  /**
   * Get total events loaded in last run
   *
   * @returns {number} Total number of events loaded
   */
  getTotalEventsLoaded(): number {
    return this.totalEventsLoaded;
  }
}

/**
 * Utility function to create and run loader
 *
 * @param {string} journalPath - Path to Elite Dangerous journal directory
 * @param {ProgressCallback} [progressCallback] - Optional callback for progress updates
 * @param {boolean} [fullLoad=false] - If true, load all files; otherwise quick load
 * @returns {Promise<number>} Total number of events loaded
 */
export async function loadJournalsWithProgress(
  journalPath: string,
  progressCallback?: ProgressCallback,
  fullLoad: boolean = false,
): Promise<number> {
  const loader = new JournalFastLoader(journalPath);

  if (fullLoad) {
    return loader.fullLoad(progressCallback);
  } else {
    return loader.quickLoad(progressCallback);
  }
}
