/**
 * Client-side Type Definitions
 * Minimal types for React components and hooks
 */

// ============================================================================
// Core Event Types
// ============================================================================

export interface EDEvent {
  id: string;
  timestamp: string;
  event: string;
  data: Record<string, unknown>;
  rawLine?: string;
}

export interface EventStats {
  totalEvents: number;
  jumps: number;
  totalJumps: number;
  combat: number;
  trading: number;
  exploration: number;
  mining: number;
  tradingCredits: number;
  explorationCredits: number;
  combatCredits: number;
  missions: number;
  engineering: number;
}

export interface EventItemData {
  id: string;
  timestamp: string;
  event: string;
  data: Record<string, unknown>;
  rawLine?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  events: T[];
  pagination: PaginationInfo;
}

// Cursor-based pagination types (for infinite scroll)
export interface CursorPaginationResponse {
  success: boolean;
  data: EDEvent[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface SearchResponse extends PaginatedResponse<EDEvent> {
  query: string;
  searchTime: number;
}

export interface StatsResponse {
  success: boolean;
  stats: EventStats;
  lastEventTime: string | null;
  isGameRunning: boolean;
  eventsPerMinute: number;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface EventItemProps {
  event: EDEvent;
  onClick?: () => void;
}

export interface StatsDashboardProps {
  compact?: boolean;
  showDetails?: boolean;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FilterState {
  eventTypes: string[];
  searchQuery: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export interface JournalEventMessage extends WebSocketMessage {
  type: 'journal:event';
  payload: EDEvent;
}

export interface StatsUpdateMessage extends WebSocketMessage {
  type: 'stats:update';
  payload: {
    stats: EventStats;
    lastEventTime: string | null;
    isGameRunning: boolean;
  };
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
  success: false;
  error: string;
}
