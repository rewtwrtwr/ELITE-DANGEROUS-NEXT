-- Elite Dangerous Journal Parser - Database Schema
-- SQLite database schema for storing journal events and commander stats

-- =============================================================================
-- EVENTS TABLE - Main storage for journal events
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,        -- Unique identifier (filename:timestamp:event)
    timestamp DATETIME NOT NULL,          -- Event timestamp
    event_type TEXT NOT NULL,              -- Event type (FSDJump, Scan, etc.)
    raw_data TEXT NOT NULL,               -- Full JSON data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id) UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_unique ON events(timestamp, event_type);

-- =============================================================================
-- STATS TABLE - Commander statistics
-- =============================================================================
CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cmdr_name TEXT UNIQUE NOT NULL,       -- Commander name
    credits INTEGER DEFAULT 0,            -- Current credits
    last_system TEXT,                     -- Last visited system
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick commander lookup
CREATE INDEX IF NOT EXISTS idx_stats_cmdr ON stats(cmdr_name);

-- =============================================================================
-- OPTIMIZATION: Materialized view for quick stats aggregation
-- =============================================================================
CREATE TABLE IF NOT EXISTS event_counts (
    event_type TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FILE POSITIONS TABLE - Track journal file read positions
-- =============================================================================
CREATE TABLE IF NOT EXISTS file_positions (
    file_path TEXT PRIMARY KEY,
    file_position INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRANSACTION LOG - For WAL-like behavior and crash recovery
-- =============================================================================
CREATE TABLE IF NOT EXISTS transaction_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,              -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id INTEGER,
    data TEXT,                            -- JSON of changed data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for recent transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recent ON transaction_log(created_at DESC);
