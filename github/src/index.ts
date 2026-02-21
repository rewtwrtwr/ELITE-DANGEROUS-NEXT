/**
 * ELITE DANGEROUS NEXT - Main Server
 * Standalone server with journal parsing and SQLite persistence
 *
 * Features:
 * - Native file logging with rotation (no winston)
 * - Graceful shutdown handling (SIGINT, SIGTERM)
 * - Database persistence with dirty flag
 * - Socket.IO for real-time events
 */

import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import net from "net";
import fs from "fs";

// Database imports
import { dbManager } from "./db/DatabaseManager.js";
import { eventRepository, ParsedEventData } from "./db/EventRepository.js";

// Journal loader imports
import {
  JournalFastLoader,
  loadJournalsWithProgress,
  type ProgressCallback,
} from "./journal/loader.js";

// Logger import
import { logger, LogLevel, initLogger, closeLogger } from "./utils/logger.js";

// Auth routes import
import authRoutes from "./routes/auth.js";

// Not Found Handler import
import { notFoundHandler } from "./middleware/notFoundHandler.js";

// Constants
const DEFAULT_PORT = 3000;
const STATS_UPDATE_INTERVAL = 5000;
const EVENT_COUNT_FOR_SAVE = 100;
const SHUTDOWN_TIMEOUT = 5000;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a free port starting from startPort
 */
async function findFreePort(startPort: number): Promise<number> {
  let port = startPort;
  for (let attempt = 0; attempt < 100; attempt++) {
    const isFree = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, "0.0.0.0");
    });
    if (isFree) return port;
    port++;
  }
  throw new Error("Could not find free port");
}

/**
 * Open browser at given URL (platform-specific)
 */
function openBrowser(port: number): void {
  const url = `http://localhost:${port}`;
  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, shell: true });
    } else if (process.platform === "darwin") {
      spawn("open", [url], { detached: true });
    } else {
      spawn("xdg-open", [url], { detached: true });
    }
  } catch (e) {
    logger.warn("System", `Failed to open browser: ${e}`);
  }
}

/**
 * Get Elite Dangerous journal path (platform-specific)
 */
function getJournalPath(): string {
  if (process.platform === "win32") {
    const savedGames = process.env.USERPROFILE || "";
    return path.join(
      savedGames,
      "Saved Games",
      "Frontier Developments",
      "Elite Dangerous",
    );
  }
  return path.join(process.env.HOME || "", "EliteDangerous");
}

/**
 * Convert in-memory event to parsed event data with backward compatibility
 */
function toParsedEventData(
  event: Record<string, unknown>,
  filename: string,
): ParsedEventData {
  // Extract timestamp with multiple fallbacks
  const timestamp = (event.timestamp as string) || 
                    (event.timestamp_local as string) || 
                    new Date().toISOString();
  
  // Extract event name
  const eventName = (event.event as string) || "Unknown";
  
  // Extract fields with backward compatibility
  const commander = event.commander as string || 
                    event.cmdr as string || 
                    event.Commander as string || 
                    undefined;
  
  const system_name = (event.StarSystem as string) ||
                      (event.system as string) ||
                      (event.System as string) ||
                      undefined;
  
  const station_name = (event.StationName as string) ||
                       (event.station as string) ||
                       (event.Station as string) ||
                       undefined;
  
  const body = (event.BodyName as string) ||
               (event.body as string) ||
               (event.Body as string) ||
               undefined;

  // Ensure valid JSON string
  let raw_json = "";
  try {
    raw_json = JSON.stringify(event);
  } catch {
    // Create minimal valid JSON if stringify fails
    raw_json = JSON.stringify({ 
      timestamp, 
      event: eventName,
      ...(commander && { commander }),
      ...(system_name && { system_name }),
      ...(station_name && { station_name }),
      ...(body && { body })
    });
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
}

/**
 * Get event category based on event type
 * Used for UI categorization and filtering
 */
function getEventCategory(eventType: string): string {
  const categories: Record<string, string[]> = {
    combat: [
      "Bounty",
      "FactionKillBond",
      "CapShipBond",
      "ShipTargeted",
      "Died",
      "Interdicted",
      "Interdiction",
      "HullDamage",
      "ShieldState",
      "ShieldHit",
      "CrimeVictim",
      "CrimeRecord",
      "CommitCrime",
      "EjectCargo",
      "PvPKill",
      "Resurrect",
    ],
    trade: [
      "MarketBuy",
      "MarketSell",
      "BuyTradeData",
      "SellTradeData",
      "CollectCargo",
      "Cargo",
      "MiningRefined",
      "RefuelAll",
      "RefuelPartial",
      "Repair",
      "RepairAll",
      "BuyAmmo",
      "BuyDrones",
      "SellDrones",
      "MaterialTrade",
    ],
    exploration: [
      "Scan",
      "FSSDiscoveryScan",
      "FSSAllBodiesFound",
      "FSSBodySignals",
      "SellExplorationData",
      "MultiSellExplorationData",
      "CodexEntry",
      "ScanOrganic",
      "SellOrganicData",
      "MaterialCollected",
      "MaterialDiscarded",
      "MaterialDiscovered",
    ],
    travel: [
      "Location",
      "StartJump",
      "FSDJump",
      "SupercruiseEntry",
      "SupercruiseExit",
      "Docked",
      "Undocked",
      "DockingGranted",
      "Touchdown",
      "Liftoff",
      "LeaveBody",
      "ApproachBody",
      "ApproachSettlement",
      "NavBeaconScan",
      "NavRoute",
      "FuelScoop",
    ],
    engineering: [
      "Synthesise",
      "EngineerCraft",
      "EngineerProgress",
      "EngineerContribution",
      "Blueprint",
      "ModifyCraft",
    ],
    social: [
      "Friends",
      "WingInvite",
      "WingJoin",
      "WingAdd",
      "WingLeave",
      "PowerplayFastTrack",
      "PowerplayVote",
      "ReceiveText",
      "SendText",
      "NpcCrewPaidWage",
      "NpcCrewRank",
      "NpcCrewHire",
      "NpcCrewFire",
      "CrewMemberJoins",
      "CrewMemberQuits",
      "CrewMemberRoleChange",
    ],
    station: [
      "ModuleInfo",
      "Powerplay",
      "ShipLocker",
      "DockingRequested",
      "DockingCancelled",
      "DockingTimeout",
      "DockingDenied",
      "Music",
    ],
    missions: [
      "MissionAccepted",
      "MissionAbandoned",
      "MissionFailed",
      "MissionExpired",
      "MissionCompleted",
      "MissionRedirected",
      "Missions",
    ],
    odyssey: [
      "Embark",
      "Disembark",
      "Backpack",
      "BackpackChange",
      "SuitLoadout",
      "Loadout",
      "BuySuit",
      "SellSuit",
      "UpgradeSuit",
      "BuyWeapon",
      "SellWeapon",
      "UpgradeWeapon",
      "Weapon",
      "UseConsumable",
      "ActivateEffect",
    ],
    fleet: [
      "CarrierJump",
      "CarrierStats",
      "CarrierBuy",
      "CarrierSell",
      "CarrierTradeOrder",
      "CarrierBankTransfer",
      "CarrierCrewHire",
      "CarrierCrewFire",
      "CarrierModulePack",
      "CarrierShipPack",
      "CarrierFuelPool",
      "ModuleBuy",
      "ModuleSell",
      "ModuleStore",
      "ModuleRetrieve",
      "ShipyardBuy",
      "ShipyardSell",
      "ShipyardTransfer",
      "Outfitting",
      "Market",
    ],
    system: [
      "Rank",
      "Progress",
      "Statistics",
      "NetworkStatistics",
      "ClearSavedGame",
      "SavedGame",
      "LoadGame",
      "Fileheader",
      "Shutdown",
      "QuitGame",
    ],
    engine: [
      "AllEnergyBanksDepleted",
      "AllFieldsDeactivated",
      "ApproachSettlement",
      "Bounty",
      "CapShipBond",
      "CargoDepot",
      "ChangeEnginePool",
      "ChangeStarClass",
      "ChangeSystem",
      "CollectCargo",
      "Commander",
      "CommitCrime",
      "CosmicRadioSource",
      "CrimeVictim",
      "DatalinkVoucher",
      "Died",
      "DiscoveryScan",
      "DockingCancelled",
      "DockingDenied",
      "DockingGranted",
      "DockingTimeout",
      "Docked",
      "DockingRequested",
      "EjectCargo",
      "Embark",
      "EngineerCraft",
      "EngineerProgress",
      "EnteredSpace",
      "EscapeInterdiction",
      "FactionKillBond",
      "FSDJump",
      "FSSAllBodiesFound",
      "FSSBodySignals",
      "FSSDiscoveryScan",
      "FuelScoop",
      "HullDamage",
      "Interdicted",
      "Interdiction",
      "ItemCollected",
      "ItemDropped",
      "ItemGrieved",
      "JoinACrew",
      "KickCrewMember",
      "LeaveBody",
      "LeaveSeat",
      "Liftoff",
      "LoadGame",
      "Location",
      "Login",
      "Logout",
      "Market",
      "MarketBuy",
      "MarketSell",
      "MaterialCollected",
      "MaterialDiscarded",
      "MaterialDiscovered",
      "MiningRefined",
      "MissionAccepted",
      "MissionAbandoned",
      "MissionCompleted",
      "MissionFailed",
      "MissionRedirected",
      "ModuleBuy",
      "ModuleRetrieve",
      "ModuleSell",
      "ModuleStore",
      "NavBeaconScan",
      "NavRoute",
      "NpcCrewRank",
      "NpcCrewHired",
      "NpcCrewJoined",
      "NpcCrewLeft",
      "Outfitting",
      "PassengerMismatch",
      "Powerplay",
      "PowerplayCollect",
      "PowerplayDeliver",
      "PowerplayFastTrack",
      "PowerplayJoin",
      "PowerplayLeave",
      "PowerplaySalary",
      "PowerplayVote",
      "PowerplayWin",
      "Progress",
      "Promotion",
      "ProspectedAsteroid",
      "Rank",
      "RebootRepair",
      "ReceiveText",
      "ReceiveText",
      "RefuelAll",
      "RefuelPartial",
      "Repair",
      "RepairAll",
      "Resurrect",
      "Scan",
      "ScanOrganic",
      "Screenshot",
      "SearchAndRescue",
      "SelfDestruct",
      "SellExplorationData",
      "SellOrganicData",
      "SendText",
      "SetUserShipName",
      "Shipyard",
      "ShipyardBuy",
      "ShipyardSell",
      "ShipyardTransfer",
      "ShieldCell",
      "ShieldState",
      "ShockDamaged",
      "StartJump",
      "Statistics",
      "Status",
      "SupercruiseEntry",
      "SupercruiseExit",
      "SwitchSuit",
      "SwitchWeapon",
      "Synthesis",
      "SystemScan",
      "Touchdown",
      "TradePromoted",
      "UnderAttack",
      "UnequipWeapon",
      "Unembark",
      "UseConsumable",
      "VehicleSwitch",
      "WantedInterceptorRescue",
      "WingAdd",
      "WingInvite",
      "WingJoin",
      "WingLeave",
      "WingUpdate",
    ],
  };

  for (const [category, events] of Object.entries(categories)) {
    if (events.includes(eventType)) {
      return category;
    }
  }
  return "other";
}

/**
 * Load historical journal files into database using fast streaming loader
 * This replaces the old synchronous loader with:
 * - Streaming (no full file load into memory)
 * - Parallel processing (max 5 concurrent files)
 * - Progress reporting via Socket.IO
 */
async function loadJournalFiles(
  journalPath: string,
  io?: SocketIOServer,
  progressCallback?: ProgressCallback,
): Promise<number> {
  if (!fs.existsSync(journalPath)) {
    logger.warn("Journal", `Journal path does not exist: ${journalPath}`);
    return 0;
  }

  // Create progress callback that emits to all connected clients
  const progressEmitter: ProgressCallback | undefined = io
    ? (progress) => {
        // Emit progress to all clients
        io.emit("journal:progress", {
          loaded: progress.loaded,
          currentFile: progress.currentFile,
          timestamp: new Date().toISOString(),
        });
        // Also call the provided callback if exists
        progressCallback?.(progress);
      }
    : progressCallback;

  // Use the new fast loader
  const loader = new JournalFastLoader(journalPath);
  const loaded = await loader.fullLoad(progressEmitter);

  return loaded;
}

/**
 * Watch journal file for new events
 * Returns cleanup function
 */
function watchJournal(
  journalPath: string,
  onEvent: (event: Record<string, unknown>, filename: string) => void,
): () => void {
  if (!fs.existsSync(journalPath)) {
    logger.warn("Journal", "Journal path does not exist, cannot watch");
    return () => {};
  }

  const files = fs
    .readdirSync(journalPath)
    .filter((f) => f.startsWith("Journal.") && f.endsWith(".log"))
    .sort();

  if (files.length === 0) return () => {};

  const latestFile = files[files.length - 1];
  const filePath = path.join(journalPath, latestFile);

  let position = fs.statSync(filePath).size;

  const interval = setInterval(() => {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > position) {
        const stream = fs.createReadStream(filePath, { start: position });
        let buffer = "";

        stream.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
        });

        stream.on("end", () => {
          const lines = buffer.split("\n").filter((l) => l.trim());
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              if (event.event) {
                const parsedEvent = toParsedEventData(event, latestFile);
                // Insert to database
                eventRepository.insertEvent(parsedEvent);
                // Emit to clients
                onEvent(event, latestFile);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        });

        position = stats.size;
      }
    } catch {
      // Ignore errors during watch
    }
  }, 1000);

  return () => clearInterval(interval);
}

/**
 * Calculate stats from database
 */
function calculateStats() {
  const stats = eventRepository.getStats();

  // Group into categories
  const JUMP_EVENTS = [
    "SupercruiseEntry",
    "SupercruiseExit",
    "FSDJump",
    "StartJump",
  ];
  const COMBAT_EVENTS = [
    "Bounty",
    "CapShipBond",
    "FactionKillBond",
    "Died",
    "Interdicted",
  ];
  const TRADING_EVENTS = ["MarketBuy", "MarketSell", "Trade"];
  const EXPLORATION_EVENTS = [
    "Scan",
    "FSSDiscoveryScan",
    "SellExplorationData",
  ];

  let jumps = 0,
    combat = 0,
    trading = 0,
    exploration = 0;

  for (const [eventType, count] of Object.entries(stats.eventsByType)) {
    if (JUMP_EVENTS.includes(eventType)) jumps += count;
    else if (COMBAT_EVENTS.includes(eventType)) combat += count;
    else if (TRADING_EVENTS.includes(eventType)) trading += count;
    else if (EXPLORATION_EVENTS.includes(eventType)) exploration += count;
  }

  return {
    totalEvents: stats.totalEvents,
    jumps,
    combat,
    trading,
    exploration,
    uniqueSystems: stats.uniqueSystems,
    firstEvent: stats.firstEvent,
    lastEvent: stats.lastEvent,
  };
}

// ============================================================================
// Graceful Shutdown Handler
// ============================================================================

interface ShutdownState {
  isShuttingDown: boolean;
  server: ReturnType<typeof createServer> | null;
  io: SocketIOServer | null;
  stopWatch: (() => void) | null;
}

const shutdownState: ShutdownState = {
  isShuttingDown: false,
  server: null,
  io: null,
  stopWatch: null,
};

/**
 * Graceful shutdown handler
 * Sequence:
 * 1. Stop accepting new connections
 * 2. Save database to disk (with fsync)
 * 3. Close Socket.IO
 * 4. Close HTTP server
 * 5. Close logger
 * 6. Exit with code 0
 */
async function shutdown(signal: string): Promise<void> {
  if (shutdownState.isShuttingDown) {
    logger.warn("Shutdown", `Already shutting down, ignoring ${signal}`);
    return;
  }

  shutdownState.isShuttingDown = true;

  logger.info("Shutdown", `Received ${signal}, starting graceful shutdown...`);

  // Step 1: Stop watching for new journal events
  if (shutdownState.stopWatch) {
    logger.info("Shutdown", "Stopping journal watcher...");
    shutdownState.stopWatch();
    shutdownState.stopWatch = null;
  }

  // Step 2: Save database to disk (critical!)
  logger.info("Shutdown", "Saving database to disk...");
  try {
    await dbManager.persist();
    logger.info("Shutdown", "Database saved successfully");
  } catch (error) {
    logger.error("Shutdown", "Failed to save database", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Step 3: Close Socket.IO (stop accepting new connections)
  if (shutdownState.io) {
    logger.info("Shutdown", "Closing Socket.IO...");
    shutdownState.io.close();
    shutdownState.io = null;
  }

  // Step 4: Close HTTP server (force close without waiting)
  if (shutdownState.server) {
    logger.info("Shutdown", "Closing HTTP server...");
    shutdownState.server.close();
    shutdownState.server = null;
    logger.info("Shutdown", "HTTP server closed");
  }

  // Step 5: Close database
  logger.info("Shutdown", "Closing database...");
  try {
    await dbManager.close();
  } catch (e) {
    logger.error("Shutdown", "Error closing database", { error: String(e) });
  }

  // Step 6: Close logger
  logger.info("Shutdown", "Closing logger...");
  try {
    await closeLogger();
  } catch (e) {
    console.error("Error closing logger:", e);
  }

  // Remove signal handlers to prevent duplicate handling
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");

  // Final message before exit
  console.log("[Shutdown] Graceful shutdown completed");

  // Force immediate exit - bypass any lingering async operations
  process.exit(0);
}

/**
 * Force shutdown after timeout
 */
function forceShutdown(signal: string): void {
  logger.error("Shutdown", `Force shutdown after timeout, signal: ${signal}`);
  process.exit(1);
}

// ============================================================================
// Main Application
// ============================================================================

async function main(): Promise<void> {
  // Initialize logger first
  initLogger({
    level:
      process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  });

  logger.info("App", "========================================");
  logger.info("App", "Elite Dangerous NEXT v1.0.0-alpha");
  logger.info("App", "========================================");
  logger.info("App", "Starting server...");

  // Initialize SQLite database
  try {
    await dbManager.init();
    logger.info("App", "Database initialized");
    
    // Run migration for old events if needed
    const migrated = eventRepository.migrateOldEvents();
    if (migrated > 0) {
      logger.info("App", `Migrated ${migrated} old events to new format`);
    }
  } catch (error) {
    logger.error("App", "Failed to initialize database", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  // Find available port
  const port = await findFreePort(DEFAULT_PORT);
  logger.info("App", `Using port: ${port}`);

  // ============================================================
  // MIDDLEWARE ORDER (CRITICAL - See DEBUGGING.md)
  // ============================================================
  // 1. Parsers (express.json(), urlencoded())
  // 2. CORS
  // 3. API Routes (health, auth, api/v1/*) - ALL before static!
  // 4. Socket.IO attachments (already done via HTTP server)
  // 5. Static files (express.static('public'))
  // 6. SPA fallback - ONLY for non-API paths (regex: ^(?!\/api\/|\/auth\/|\/socket\.io\/).*$)
  // 7. 404 handler for API (JSON response)
  // ============================================================

  const app = express();

  // 1. Parsers
  app.use(express.json({ limit: "10mb" }));

  // 2. CORS
  app.use(cors());

  // Public folder path
  const publicPath = path.join(process.cwd(), "public");
  logger.debug("App", `Public path: ${publicPath}`);

  // 3. API Routes - ALL before static middleware!

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", version: "1.0.0-alpha" });
  });

  // Auth routes - BEFORE static, handles /auth/status
  app.use("/auth", authRoutes);

  // API v1 routes
  app.get("/api/v1/status", (_req, res) => {
    res.json({
      name: "Elite Dangerous NEXT",
      version: "1.0.0-alpha",
      status: "running",
    });
  });

  // Events endpoint - unified format with backward compatibility
  app.get("/api/v1/events", (req, res) => {
    const limitParam = req.query.limit as string;
    const cursor = (req.query.cursor as string) || null;

    logger.debug("Events endpoint called", JSON.stringify({
      limitParam,
      cursor: cursor ? `${cursor.substring(0, 20)}...` : null,
      hasCursor: !!cursor,
    }));

    // If no limit provided, return ALL events for accurate statistics
    if (!limitParam) {
      const result = eventRepository.getAllEvents();
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        hasMore: false,
      });
      return;
    }

    // With limit: use cursor-based pagination
    const limit = Math.min(parseInt(limitParam) || 500, 5000);
    const result = eventRepository.getEventsByCursor(cursor, limit);
    
    // Return unified format
    res.json({
      success: true,
      data: result.data,
      total: result.total,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });

  // NEW: Get total count of events (for progress tracking)
  app.get("/api/v1/events/count", (_req, res) => {
    const count = eventRepository.count();
    res.json({ count });
  });

  // Batch endpoint for progressive loading with unified format
  app.get("/api/v1/events/batch", (req, res) => {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 1000, 5000);

    const result = eventRepository.getEvents(limit, offset);
    const total = eventRepository.count();

    res.json({
      success: true,
      data: result.events,
      offset: offset,
      limit: limit,
      total: total,
      hasMore: offset + result.events.length < total,
    });
  });

  // Get ALL events without pagination (for initial load)
  app.get("/api/v1/events/all", (req, res) => {
    let limit: number | undefined;
    if (req.query.limit !== undefined) {
      const parsedLimit = parseInt(req.query.limit as string);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100000);
      }
    }

    const result = eventRepository.getAllEvents(limit);
    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  });

  app.get("/api/v1/stats", (_req, res) => {
    const stats = calculateStats();
    res.json({
      success: true,
      stats,
      lastEventTime: stats.lastEvent || null,
      timestamp: new Date().toISOString(),
    });
  });

  // Also provide /api/events/stats for backward compatibility with client hooks
  app.get("/api/events/stats", (_req, res) => {
    const stats = calculateStats();
    res.json({
      success: true,
      stats,
      lastEventTime: stats.lastEvent || null,
      timestamp: new Date().toISOString(),
      isGameRunning: true,
    });
  });

  app.get("/api/v1/journal/status", (_req, res) => {
    const journalPath = getJournalPath();
    res.json({ isWatching: true, journalPath, fileCount: 0 });
  });

  // Root route - serve index.html
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // 4. Favicon handler - BEFORE static to avoid 404 noise in logs
  app.get("/favicon.ico", (_req, res) => {
    // Return 204 No Content - browser will use cached favicon or show nothing
    res.status(204).end();
  });

  // 5. Static files - AFTER all API routes
  app.use(express.static(publicPath));
  // Also serve from cwd for any root-level files
  app.use(express.static(process.cwd()));

  // 6. SPA Fallback - ONLY for non-API paths using regex
  // This must come AFTER static but BEFORE the 404 handler
  // Regex matches: starts with /api/ OR /auth/ OR /socket.io/ -> NO match (skip)
  // All other paths -> serve index.html
  app.get(/^(?!\/api\/|\/auth\/|\/health|\/socket\.io\/).*$/, (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // 7. Not Found handler for API routes (MUST be last)
  // Returns JSON 404 for API endpoints that weren't matched
  app.use(notFoundHandler);

  // Create HTTP server
  const server = createServer(app);

  // Raw WebSocket server for stats endpoint (/ws)
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    logger.info('WebSocket', `Client connected to /ws`);
    ws.send(JSON.stringify({ type: 'stats:update', stats: calculateStats(), isGameRunning: true, lastEventTime: null, timestamp: new Date().toISOString() }));

    ws.on('close', () => {
      logger.debug('WebSocket', `Client disconnected from /ws`);
    });

    ws.on('error', (err) => {
      logger.warn('WebSocket', `Error: ${err instanceof Error ? err.message : String(err)}`);
    });
  });

  // Socket.IO setup - attaches to the HTTP server
  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    logger.info("Socket", `Client connected: ${socket.id}`);

    // Send backfill info from database (just count, no events)
    const totalEvents = eventRepository.count();
    socket.emit("backfill:complete", { totalEvents });

    // FIX: Do NOT send historical events here - client loads history via REST API
    // Sending old events here causes:
    // 1. Duplicate events (also loaded via REST)
    // 2. Performance issues with 80k+ events
    // 3. Confusing "old events first" behavior
    // Real-time events will be sent via journal:event watcher below

    // Log connected clients count
    logger.debug("Socket", `Clients connected: ${io.engine.clientsCount}`);
  });

  // Store references for shutdown
  shutdownState.server = server;
  shutdownState.io = io;

  // Journal path
  const journalPath = getJournalPath();
  logger.info("Journal", `Journal path: ${journalPath}`);

  // Load historical events with progress reporting
  const loaded = await loadJournalFiles(journalPath, io);
  logger.info("App", `Loaded ${loaded} historical events into database`);

  // Start watching for new events
  shutdownState.stopWatch = watchJournal(journalPath, (event, filename) => {
    io.emit("journal:event", {
      timestamp: event.timestamp || new Date().toISOString(),
      event: event.event,
      data: event,
    });

    // Auto-save every N events
    if (dbManager.getEventCountSinceLastSave() >= EVENT_COUNT_FOR_SAVE) {
      dbManager.save();
    }
  });

  // Stats update interval
  const statsInterval = setInterval(() => {
    const stats = calculateStats();
    const updateMessage = {
      stats,
      lastEventTime: stats.lastEvent || null,
      timestamp: new Date().toISOString(),
    };
    // Send to Socket.IO clients
    io.emit("stats:update", updateMessage);
    // Send to raw WebSocket clients (/ws)
    const wsMessage = { type: 'stats:update', ...updateMessage, isGameRunning: true };
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(wsMessage));
      }
    });
  }, STATS_UPDATE_INTERVAL);

  // Make stats interval unref so it doesn't block shutdown
  statsInterval.unref();

  // Force shutdown timeout
  let shutdownTimeout: NodeJS.Timeout | null = null;

  // Wrap shutdown to add timeout and cleanup
  const wrappedShutdown = async (signal: string) => {
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => forceShutdown(signal), SHUTDOWN_TIMEOUT);

    await shutdown(signal);

    // If we get here before timeout, clear it
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
      shutdownTimeout = null;
    }
  };

  // Register shutdown handlers
  process.on("SIGINT", () => wrappedShutdown("SIGINT"));
  process.on("SIGTERM", () => wrappedShutdown("SIGTERM"));

  // Start HTTP server
  server.listen(port, "0.0.0.0", () => {
    logger.info("App", `Server running at http://localhost:${port}`);
    openBrowser(port);
  });
}

// Start application
main().catch((e) => {
  logger.error("App", "Failed to start server", {
    error: e instanceof Error ? e.message : String(e),
  });
  process.exit(1);
});
