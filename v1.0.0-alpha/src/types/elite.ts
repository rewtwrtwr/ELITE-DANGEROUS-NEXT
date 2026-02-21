/**
 * Elite Dangerous Event Types
 */

export interface EliteEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  commander?: string;
  system_name?: string;
  station_name?: string;
  body?: string;
  raw_json: string;
  created_at?: string;
}

export interface EliteEventInput {
  timestamp: string;
  event: string;
  commander?: string;
  system_name?: string;
  station_name?: string;
  body?: string;
  raw_json: string;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueSystems: number;
  firstEvent: string | null;
  lastEvent: string | null;
}

export interface PaginatedEvents {
  events: EliteEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface CursorPaginationResult {
  data: EliteEvent[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}
