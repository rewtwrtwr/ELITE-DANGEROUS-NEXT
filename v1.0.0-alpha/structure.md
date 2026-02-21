# Project Structure - Elite Dangerous NEXT

## Overview

- **Project Name**: elite-dangerous-next
- **Version**: 1.0.0-alpha
- **Type**: Node.js Backend + Preact/React Frontend Web Application
- **Description**: Мониторинг и обработка журнальных файлов Elite Dangerous в реальном времени / Real-time monitoring and processing of Elite Dangerous journal files
- **Entry Point**: src/index.ts
- **Total Files**: 42 source files (excluding node_modules, dist)
- **Framework Stack**: Node.js, Express, Socket.IO, sql.js, Preact, Vite

## Directory Tree

```
/
├── .github/                          # GitHub configuration
├── data/                             # Database storage (elite.db)
├── dist/                             # Compiled output
├── logs/                             # Application logs
├── node_modules/                     # Dependencies
├── public/                           # Static frontend files
│   ├── app.js                        # Main frontend JavaScript
│   ├── audio.js                      # Audio effects handler
│   ├── effects.js                    # Visual effects
│   ├── event-storage.js              # Local event storage
│   ├── index.html                    # Main HTML template
│   ├── favicon.ico                   # Favicon
│   ├── socket.io/                    # Socket.IO client files
│   └── assets/                       # Static assets
├── scripts/                          # Build/utility scripts
│   └── cleanup-duplicates.ts         # Duplicate cleanup utility
├── src/                              # Source code
│   ├── index.ts                      # [ENTRY] Main server entry point
│   ├── index.patch.ts                # Patch file (unused)
│   ├── test-db.ts                    # Database test utilities
│   ├── test-performance.ts           # Performance testing
│   ├── client/                       # Frontend (Preact/React)
│   │   ├── index.tsx                 # [ENTRY] Frontend mount point
│   │   ├── App.tsx                   # [COMPONENT] Main React app
│   │   ├── api/
│   │   │   └── client.ts             # [API] REST API client
│   │   ├── components/
│   │   │   ├── AuthButton.tsx        # [COMPONENT] OAuth login button
│   │   │   ├── LoadingScreen.tsx     # [COMPONENT] Loading overlay
│   │   │   └── ProfilePanel.tsx      # [COMPONENT] Commander profile
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # [HOOK] Authentication hook
│   │   │   ├── useEvents.ts          # [HOOK] Events with infinite scroll
│   │   │   ├── useProgressLoader.ts  # [HOOK] Progress tracking
│   │   │   ├── useStats.ts           # [HOOK] Statistics hook
│   │   │   └── useWebSocket.ts       # [HOOK] WebSocket connection
│   │   └── types/
│   │       └── events.ts             # [TYPES] Frontend type definitions
│   ├── db/                           # Database layer
│   │   ├── DatabaseManager.ts        # [SERVICE] sql.js singleton manager
│   │   └── EventRepository.ts        # [REPOSITORY] CRUD operations
│   ├── journal/                      # Journal parsing
│   │   ├── loader.ts                 # [SERVICE] Fast streaming journal loader
│   │   └── events-registry.ts        # [TYPES] Event definitions & categories
│   ├── types/                        # TypeScript types
│   │   └── elite.ts                  # [TYPES] Core Elite types & constants
│   ├── routes/                       # Express routes
│   │   └── auth.ts                   # [ROUTE] Authentication endpoints (stub)
│   ├── utils/                        # Utilities
│   │   └── logger.ts                 # [UTIL] Native logger with rotation
│   ├── middleware/                   # Express middleware
│   │   └── notFoundHandler.ts        # [MIDDLEWARE] 404 handler
│   └── data/                         # Database initialization
│       ├── db-manager.ts             # Legacy DB manager (unused)
│       ├── init-db.ts                # Database initialization
│       ├── schema.sql                # SQL schema
│       └── test-db.ts                # Test utilities
├── .gitignore                        # Git ignore rules
├── .nvmrc                            # Node version (20+)
├── package.json                      # Dependencies
├── package-lock.json                 # Lock file
├── tsconfig.json                     # TypeScript config
├── tsconfig.client.json              # Client TS config
├── tsconfig.node.json                # Node TS config
├── vite.config.ts                    # Vite build config
└── README.md                         # Documentation
```

## Files Database

### /src/index.ts
- **Type**: entry
- **Purpose**: Main server entry point, Express + Socket.IO server initialization
- **Exports**: None
- **Dependencies**: express, socket.io, DatabaseManager, EventRepository, JournalFastLoader
- **Key Functions**:
  - `main()` - Server initialization and startup
  - `findFreePort()` - Port detection
  - `getJournalPath()` - Elite Dangerous journal path detection
  - `watchJournal()` - Real-time file watching
  - `calculateStats()` - Event statistics calculation
  - `shutdown()` - Graceful shutdown handler

### /src/client/index.tsx
- **Type**: entry
- **Purpose**: Frontend application bootstrap using Preact
- **Exports**: None
- **Dependencies**: preact, App component
- **Key Functions**: Renders App to #root element

### /src/client/App.tsx
- **Type**: component
- **Purpose**: Main React/Preact application component with full UI
- **Size**: 1400+ lines
- **Exports**: App component
- **Dependencies**: preact, hooks (useEvents, useAuth, useStats)
- **Key Components**:
  - `StatsBanner` - Statistics display
  - `GameStatus` - Game running status
  - `EventCard` - Individual event display
  - `SearchBar` - Event search
  - `Pagination` - Infinite scroll
  - `ProfilePanel` - Commander profile with CAPI data
  - `SettingsPanel` - Application settings

### /src/db/DatabaseManager.ts
- **Type**: service
- **Purpose**: sql.js SQLite database singleton with persistence
- **Exports**: dbManager singleton
- **Dependencies**: sql.js, fs, logger
- **Key Features**:
  - In-memory database with periodic disk persistence
  - Dirty flag tracking
  - Safe write (temp file → atomic rename)
  - Schema migrations
  - Auto-save every 30 seconds

### /src/db/EventRepository.ts
- **Type**: repository
- **Purpose**: CRUD operations for Elite events
- **Exports**: eventRepository, ParsedEventData interface
- **Dependencies**: DatabaseManager, EliteEvent types
- **Key Methods**:
  - `insertEvent()` - Single event insert
  - `insertEvents()` - Batch insert with transactions
  - `getEvents()` - Paginated events
  - `getEventsByCursor()` - Cursor-based pagination
  - `getStats()` - Event statistics
  - `generateEventId()` - Deterministic ID generation

### /src/journal/loader.ts
- **Type**: service
- **Purpose**: Optimized streaming journal file loader
- **Exports**: JournalFastLoader, loadJournalsWithProgress
- **Dependencies**: fs, readline, EventRepository
- **Key Features**:
  - Streaming with fs.createReadStream (no full file load)
  - Parallel processing (max 5 concurrent files)
  - Bulk insert with transactions (500 events/batch)
  - Incremental load (skip already processed files)
  - Progress callback for UI updates

### /src/types/elite.ts
- **Type**: types
- **Purpose**: Core TypeScript interfaces and constants
- **Exports**: EliteEvent, EliteEventInput, EventStats, PaginatedEvents, CursorPaginationResult, EVENT_DEFINITIONS, CATEGORIES, GAME_CONSTANTS
- **Key Content**:
  - 100+ event type definitions with labels, icons, categories
  - 20 category definitions (navigation, combat, trade, exploration, etc.)
  - Game constants (ranks, star types)

### /src/utils/logger.ts
- **Type**: util
- **Purpose**: Native logger with file rotation (no external dependencies)
- **Exports**: logger, LogLevel enum
- **Features**:
  - 4 log levels: ERROR, WARN, INFO, DEBUG
  - Rotation: 5 files × 10MB = 100MB max
  - Format: [ISO_TIMESTAMP] [LEVEL] [MODULE] message
  - Graceful shutdown handling

### /src/routes/auth.ts
- **Type**: route
- **Purpose**: Authentication endpoints (stub/guest mode)
- **Exports**: router
- **Endpoints**:
  - GET /auth/status - Auth status
  - GET /auth/login - OAuth stub
  - GET /auth/logout - Logout stub

### /public/index.html
- **Type**: ui
- **Purpose**: Main HTML template with embedded CSS
- **Size**: 2100+ lines (including CSS)
- **Key Features**:
  - Loading screen with progress
  - Main layout (header, sidebar, content)
  - Event list with expandable details
  - Modal for event details
  - Filter bar
  - Auth modal
  - Full responsive CSS

### /public/app.js
- **Type**: frontend
- **Purpose**: Legacy vanilla JS frontend (being replaced by Preact)
- **Contains**: UI rendering, Socket.IO client

### /src/client/api/client.ts
- **Type**: api
- **Purpose**: REST API client for frontend
- **Methods**:
  - `getEvents()` - Paginated events
  - `searchEvents()` - Search
  - `getStats()` - Statistics

### /src/client/hooks/useEvents.ts
- **Type**: hook
- **Purpose**: Cursor-based pagination with real-time updates
- **Features**:
  - Infinite scroll
  - Polling every 3 seconds
  - Batch loading (500 initial, 50 per scroll)

### /vite.config.ts
- **Type**: config
- **Purpose**: Vite build configuration for frontend
- **Features**: Preact integration, React compatibility

### /package.json
- **Type**: config
- **Purpose**: Dependencies and scripts
- **Key Dependencies**:
  - express, socket.io - Backend
  - sql.js, better-sqlite3 - Database
  - preact, react, react-dom - Frontend
  - axios - HTTP client
  - winston - Logger
  - vite, typescript - Build tools

## Key Components

### Backend
| Component | File | Purpose |
|-----------|------|---------|
| Server | src/index.ts | Express + Socket.IO initialization |
| Database | src/db/DatabaseManager.ts | sql.js SQLite with persistence |
| Repository | src/db/EventRepository.ts | Event CRUD operations |
| Journal Loader | src/journal/loader.ts | Streaming journal parser |
| Auth Routes | src/routes/auth.ts | OAuth stubs (guest mode) |
| Logger | src/utils/logger.ts | File rotation logging |

### Frontend
| Component | File | Purpose |
|-----------|------|---------|
| Main App | src/client/App.tsx | React/Preact UI component |
| Entry | src/client/index.tsx | Frontend bootstrap |
| API Client | src/client/api/client.ts | REST API wrapper |
| Events Hook | src/client/hooks/useEvents.ts | Infinite scroll + polling |
| Auth Hook | src/client/hooks/useAuth.ts | Authentication state |
| WebSocket Hook | src/client/hooks/useWebSocket.ts | Real-time connection |
| Stats Hook | src/client/hooks/useStats.ts | Statistics fetching |
| HTML Template | public/index.html | Main UI template |

### Data Layer
| Component | File | Purpose |
|-----------|------|---------|
| Elite Types | src/types/elite.ts | TypeScript interfaces |
| Event Registry | src/journal/events-registry.ts | Event definitions |
| Schema | src/data/schema.sql | Database schema |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELITE DANGEROUS GAME                            │
│                    (Journal files in Saved Games)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     src/journal/loader.ts                               │
│              (Streaming parser with progress)                          │
│   - fs.createReadStream + readline (memory efficient)                  │
│   - Batch insert: 500 events per transaction                           │
│   - Skip already processed files                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              src/db/EventRepository.ts + DatabaseManager.ts            │
│                        (sql.js in-memory DB)                            │
│   - INSERT OR REPLACE into events table                                │
│   - Auto-persist to data/elite.db every 30s                           │
│   - Schema migrations for backward compatibility                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────┐
│     src/index.ts                │   │       Socket.IO                    │
│     Express REST API            │   │       Real-time push               │
│   - GET /api/v1/events          │   │   - Broadcast new events            │
│   - GET /api/v1/events/stats    │   │   - Stats updates                   │
│   - GET /auth/*                 │   │                                     │
└─────────────────────────────────┘   └─────────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Frontend (Preact/React)                            │
│   src/client/App.tsx + Hooks                                           │
│   - useEvents: cursor-based infinite scroll + polling                 │
│   - useWebSocket: real-time updates                                    │
│   - useAuth: authentication state                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Configuration

| Config | Location | Default |
|--------|----------|---------|
| Port | src/index.ts (DEFAULT_PORT) | 3000 |
| Database | data/elite.db | SQLite (sql.js) |
| Journal Path | Windows: %USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous |
| Log Level | src/utils/logger.ts | INFO |
| Log Files | logs/elite-{1-5}.log | 5 files × 10MB |
| Auto-save Interval | src/db/DatabaseManager.ts | 30 seconds |
| Batch Size | src/journal/loader.ts | 500 events |
| Max Concurrent Files | src/journal/loader.ts | 5 files |
| Polling Interval | src/client/hooks/useEvents.ts | 3 seconds |
| Initial Load | src/client/hooks/useEvents.ts | 500 events |

## API Endpoints

### Events API (src/index.ts)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/events | Get events with cursor pagination |
| GET | /api/v1/events/stats | Get event statistics |
| POST | /api/v1/events/reload | Force journal reload |

### Auth API (src/routes/auth.ts)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/status | Get auth status (guest mode) |
| GET | /auth/login | OAuth redirect (stub) |
| GET | /auth/logout | Logout (stub) |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/status | Server status |

## Real-time Features

1. **Journal File Watching** (src/index.ts: watchJournal)
   - Polls latest journal file every 1 second
   - Parses new lines and inserts into database
   - Broadcasts to all Socket.IO clients

2. **Socket.IO Events** (src/index.ts)
   - `new-event` - New journal event detected
   - `stats-update` - Statistics updated
   - `game-status` - Game running status

3. **Frontend Polling** (src/client/hooks/useEvents.ts)
   - Polls /api/v1/events every 3 seconds
   - Cursor-based pagination for infinite scroll

## Dependencies Graph

```
src/index.ts
├── express
├── socket.io
├── src/db/DatabaseManager.ts
│   └── sql.js
├── src/db/EventRepository.ts
│   └── src/db/DatabaseManager.ts
├── src/journal/loader.ts
│   └── src/db/EventRepository.ts
├── src/utils/logger.ts
└── src/data/schema.sql

src/client/App.tsx
├── preact
├── src/client/hooks/useEvents.ts
│   └── src/client/api/client.ts
├── src/client/hooks/useAuth.ts
├── src/client/hooks/useStats.ts
└── src/client/components/AuthButton.tsx
    └── src/client/hooks/useAuth.ts
```

## Build & Development

### Scripts (package.json)
```json
{
  "dev": "tsx watch src/index.ts",
  "build": "npm run clean && npx tsc && npm run build:client",
  "build:client": "vite build",
  "start": "node dist/index.js"
}
```

### TypeScript Configuration
- Target: ES2022
- Module: ESNext
- JSX: react-jsx (Preact)
- Strict: false (for faster development)

## Known Limitations

1. **Auth**: Only guest mode implemented (OAuth pending)
2. **Database**: In-memory sql.js (not native SQLite)
3. **CORS**: Limited to development mode
4. **Performance**: No caching layer for API responses

## Future Improvements (TODO)

- [ ] Implement Frontier OAuth2 authentication
- [ ] Add native SQLite (better-sqlite3) support
- [ ] API response caching
- [ ] User settings persistence
- [ ] Export events to CSV/JSON
- [ ] Event filtering by category
- [ ] Search history
- [ ] Desktop notifications
- [ ] System tray integration