import type { PaginatedResponse, StatsResponse, EDEvent } from '../types/events.js';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async getEvents(page = 1, limit = 100): Promise<PaginatedResponse<EDEvent>> {
    return this.request<PaginatedResponse<EDEvent>>(`/events?page=${page}&limit=${limit}`);
  }

  async searchEvents(query: string, page = 1, limit = 100): Promise<PaginatedResponse<EDEvent>> {
    return this.request<PaginatedResponse<EDEvent>>(`/events/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/events/stats');
  }
}

export const api = new ApiClient();
