/**
 * FilterBar - Advanced Event Filtering Component
 * Полнофункциональный компонент фильтрации событий Elite Dangerous
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { EDEvent } from "../types/events.js";
import { EVENTS_CATALOG } from "../../data/events-catalog.js";
import { CATEGORY_COLORS } from "../../utils/eventFormatter.js";

// ============================================================================
// INTERFACES
// ============================================================================

export interface EventFilters {
  category?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  showRare?: boolean;
  showDeprecated?: boolean;
}

export interface FilterBarProps {
  events: EDEvent[];
  onFilterChange: (filteredEvents: EDEvent[]) => void;
  onSearch?: (query: string) => void;
  categories?: string[];
  eventTypes?: string[];
}

interface FilterState extends EventFilters {
  searchQuery: string;
}

interface CategoryOption {
  value: string;
  label: string;
  icon: string;
  count: number;
  color: string;
}

interface EventTypeOption {
  value: string;
  label: string;
  count: number;
  isRare?: boolean;
  isDeprecated?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_ICONS: Record<string, string> = {
  navigation: '🚀',
  combat: '⚔️',
  trade: '💰',
  exploration: '🔭',
  engineering: '🔧',
  missions: '📋',
  station: '🏠',
  social: '💬',
  cargo: '📦',
  materials: '💎',
  ship: '🛸',
  carrier: '🚢',
  squadron: '🎖️',
  powerplay: '⚡',
  game: '🎮',
  other: '📌',
  unknown: '❓',
};

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'НАВИГАЦИЯ',
  combat: 'БОЙ',
  trade: 'ТОРГОВЛЯ',
  exploration: 'ИССЛЕДОВАНИЕ',
  engineering: 'ИНЖЕНЕРИЯ',
  missions: 'МИССИИ',
  station: 'СТАНЦИЯ',
  social: 'СОЦИАЛЬНОЕ',
  cargo: 'ГРУЗ',
  materials: 'МАТЕРИАЛЫ',
  ship: 'КОРАБЛЬ',
  carrier: 'НОСИТЕЛЬ',
  squadron: 'ЭСКАДРИЛЬЯ',
  powerplay: 'POWERPLAY',
  game: 'ИГРА',
  other: 'ДРУГОЕ',
  unknown: 'НЕИЗВЕСТНО',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEventCategory(eventType: string): string {
  const eventDef = EVENTS_CATALOG[eventType];
  if (eventDef?.category) {
    return eventDef.category;
  }
  
  const lower = eventType.toLowerCase();
  if (lower.includes("combat") || lower.includes("kill") || lower.includes("bounty") || 
      lower.includes("interdiction") || lower.includes("died")) return "combat";
  if (lower.includes("trade") || lower.includes("market") || lower.includes("buy") || 
      lower.includes("sell") || lower.includes("mining")) return "trade";
  if (lower.includes("scan") || lower.includes("discovery") || lower.includes("explore") || 
      lower.includes("fss") || lower.includes("screenshot")) return "exploration";
  if (lower.includes("jump") || lower.includes("fsd") || lower.includes("supercruise") || 
      lower.includes("dock") || lower.includes("touchdown") || lower.includes("land")) return "navigation";
  if (lower.includes("text") || lower.includes("chat") || lower.includes("friend") || 
      lower.includes("crew")) return "social";
  if (lower.includes("mission") || lower.includes("missionaccepted") || lower.includes("missioncompleted")) return "missions";
  if (lower.includes("engineer") || lower.includes("craft") || lower.includes("modification")) return "engineering";
  if (lower.includes("cargo") || lower.includes("hull") || lower.includes("outfitting")) return "cargo";
  if (lower.includes("material") || lower.includes("synthesis") || lower.includes("refine")) return "materials";
  if (lower.includes("ship") || lower.includes("loadout") || lower.includes("module")) return "ship";
  if (lower.includes("carrier") || lower.includes("fleetcarrier")) return "carrier";
  if (lower.includes("squadron") || lower.includes("wing")) return "squadron";
  if (lower.includes("powerplay") || lower.includes("power")) return "powerplay";
  if (lower.includes("fileheader") || lower.includes("commander") || lower.includes("loadgame")) return "game";
  
  return "other";
}

function getEventSummary(event: EDEvent): string {
  const data = event.data || {};
  
  if (event.event === "Music" && data.MusicTrack) return data.MusicTrack as string;
  if (event.event === "Touchdown" && data.Planet) return `on ${data.Planet}`;
  if (event.event === "FSDJump" && data.StarSystem) return data.StarSystem as string;
  if (event.event === "Location" && data.StarSystem) return data.StarSystem as string;
  if (event.event === "ReceiveText" && data.From) return `from ${data.From}`;
  if (event.event === "Cargo" && data.Count) return `${data.Count} tons`;
  if (event.event === "MarketSell" && data.TotalSale) return `${data.TotalSale} CR`;
  if (event.event === "MarketBuy" && data.TotalCost) return `${data.TotalCost} CR`;
  if (event.event === "MissionAccepted" && data.Name) return data.Name as string;
  if (event.event === "MissionCompleted" && data.Name) return data.Name as string;
  if (event.event === "Scan" && data.BodyName) return data.BodyName as string;
  if (event.event === "Docked" && data.StationName) return data.StationName as string;
  
  return event.event || "";
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseDateFromInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FilterBar({ events, onFilterChange, onSearch }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: undefined,
    eventType: undefined,
    startDate: undefined,
    endDate: undefined,
    showRare: false,
    showDeprecated: false,
    searchQuery: "",
  });

  const [savedFilters, setSavedFilters] = useState<FilterState | null>(null);

  // Get unique categories from events
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    events.forEach(event => {
      const category = getEventCategory(event.event);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const options: CategoryOption[] = [
      { value: "all", label: "ВСЕ КАТЕГОРИИ", icon: "📋", count: events.length, color: "#e0e0e0" },
    ];

    categoryMap.forEach((count, category) => {
      const color = CATEGORY_COLORS[category]?.color || "#9e9e9e";
      options.push({
        value: category,
        label: CATEGORY_LABELS[category] || category.toUpperCase(),
        icon: CATEGORY_ICONS[category] || "📌",
        count,
        color,
      });
    });

    return options.sort((a, b) => b.count - a.count);
  }, [events]);

  // Get unique event types based on selected category
  const eventTypes = useMemo(() => {
    const typeMap = new Map<string, { count: number; isRare: boolean; isDeprecated: boolean }>();
    
    events.forEach(event => {
      const category = getEventCategory(event.event);
      
      if (filters.category && filters.category !== "all" && category !== filters.category) {
        return;
      }

      const eventDef = EVENTS_CATALOG[event.event];
      const existing = typeMap.get(event.event) || { count: 0, isRare: false, isDeprecated: false };
      
      typeMap.set(event.event, {
        count: existing.count + 1,
        isRare: existing.isRare || eventDef?.isRare || false,
        isDeprecated: existing.isDeprecated || eventDef?.isDeprecated || false,
      });
    });

    const options: EventTypeOption[] = [
      { value: "all", label: "ВСЕ ТИПЫ", count: events.length },
    ];

    typeMap.forEach((data, eventType) => {
      options.push({
        value: eventType,
        label: eventType,
        count: data.count,
        isRare: data.isRare,
        isDeprecated: data.isDeprecated,
      });
    });

    return options.sort((a, b) => b.count - a.count);
  }, [events, filters.category]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by category
    if (filters.category && filters.category !== "all") {
      result = result.filter(event => {
        const category = getEventCategory(event.event);
        return category === filters.category;
      });
    }

    // Filter by event type
    if (filters.eventType && filters.eventType !== "all") {
      result = result.filter(event => event.event === filters.eventType);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = parseDateFromInput(filters.startDate);
      if (startDate) {
        result = result.filter(event => {
          const eventDate = new Date(event.timestamp);
          return eventDate >= startDate;
        });
      }
    }

    if (filters.endDate) {
      const endDate = parseDateFromInput(filters.endDate);
      if (endDate) {
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        result = result.filter(event => {
          const eventDate = new Date(event.timestamp);
          return eventDate <= endDate;
        });
      }
    }

    // Filter by rare events
    if (filters.showRare) {
      result = result.filter(event => {
        const eventDef = EVENTS_CATALOG[event.event];
        return eventDef?.isRare || false;
      });
    }

    // Filter by deprecated events
    if (filters.showDeprecated) {
      result = result.filter(event => {
        const eventDef = EVENTS_CATALOG[event.event];
        return eventDef?.isDeprecated || false;
      });
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(event => {
        const summary = getEventSummary(event).toLowerCase();
        const eventType = event.event.toLowerCase();
        const timestamp = event.timestamp.toLowerCase();
        
        return (
          eventType.includes(query) ||
          summary.includes(query) ||
          timestamp.includes(query)
        );
      });
    }

    return result;
  }, [events, filters]);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filteredEvents);
  }, [filteredEvents, onFilterChange]);

  // Notify parent when search query changes
  useEffect(() => {
    if (onSearch && filters.searchQuery) {
      onSearch(filters.searchQuery);
    }
  }, [filters.searchQuery, onSearch]);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ed-filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed);
      }
    } catch (error) {
      console.error("Failed to load saved filters:", error);
    }
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "all" ? undefined : e.target.value;
    setFilters(prev => ({ ...prev, category: value, eventType: undefined }));
  }, []);

  const handleEventTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "all" ? undefined : e.target.value;
    setFilters(prev => ({ ...prev, eventType: value }));
  }, []);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }));
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }));
  }, []);

  const handleShowRareChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, showRare: e.target.checked }));
  }, []);

  const handleShowDeprecatedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, showDeprecated: e.target.checked }));
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(filters.searchQuery);
    }
  }, [filters.searchQuery, onSearch]);

  const handleClearSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, searchQuery: "" }));
  }, []);

  const handleQuickDate = useCallback((days: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    
    setFilters(prev => ({
      ...prev,
      startDate: formatDateForInput(start),
      endDate: formatDateForInput(now),
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    // Filters are already applied via useEffect
    console.log("Filters applied:", filters);
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      category: undefined,
      eventType: undefined,
      startDate: undefined,
      endDate: undefined,
      showRare: false,
      showDeprecated: false,
      searchQuery: "",
    });
  }, []);

  const handleSaveFilters = useCallback(() => {
    try {
      localStorage.setItem("ed-filters", JSON.stringify(filters));
      setSavedFilters(filters);
      alert("Фильтры сохранены!");
    } catch (error) {
      console.error("Failed to save filters:", error);
      alert("Не удалось сохранить фильтры");
    }
  }, [filters]);

  const handleLoadFilters = useCallback(() => {
    if (savedFilters) {
      setFilters(savedFilters);
    }
  }, [savedFilters]);

  const hasActiveFilters = 
    filters.category !== undefined ||
    filters.eventType !== undefined ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.showRare ||
    filters.showDeprecated ||
    filters.searchQuery.trim() !== "";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="hud-filter-bar">
      {/* Category Filter */}
      <div className="hud-filter-group">
        <label className="hud-filter-label">КАТЕГОРИЯ</label>
        <select
          className="hud-filter-select"
          value={filters.category || "all"}
          onChange={handleCategoryChange}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Event Type Filter */}
      <div className="hud-filter-group">
        <label className="hud-filter-label">ТИП СОБЫТИЯ</label>
        <select
          className="hud-filter-select"
          value={filters.eventType || "all"}
          onChange={handleEventTypeChange}
          disabled={!filters.category && categories.length > 1}
        >
          {eventTypes.map(type => (
            <option 
              key={type.value} 
              value={type.value}
              className={type.isDeprecated ? "hud-option-deprecated" : ""}
            >
              {type.label} ({type.count})
              {type.isRare && " ⭐"}
              {type.isDeprecated && " ⚠️"}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="hud-filter-group hud-filter-date">
        <label className="hud-filter-label">ДАТА</label>
        <div className="hud-date-inputs">
          <input
            type="date"
            className="hud-filter-input hud-date-input"
            value={filters.startDate || ""}
            onChange={handleStartDateChange}
            placeholder="С"
          />
          <span className="hud-date-separator">—</span>
          <input
            type="date"
            className="hud-filter-input hud-date-input"
            value={filters.endDate || ""}
            onChange={handleEndDateChange}
            placeholder="По"
          />
        </div>
        <div className="hud-quick-dates">
          <button
            type="button"
            className="hud-quick-date-btn"
            onClick={() => handleQuickDate(0)}
            title="Сегодня"
          >
            СЕГОДНЯ
          </button>
          <button
            type="button"
            className="hud-quick-date-btn"
            onClick={() => handleQuickDate(1)}
            title="Вчера"
          >
            ВЧЕРА
          </button>
          <button
            type="button"
            className="hud-quick-date-btn"
            onClick={() => handleQuickDate(7)}
            title="Последние 7 дней"
          >
            7 ДНЕЙ
          </button>
          <button
            type="button"
            className="hud-quick-date-btn"
            onClick={() => handleQuickDate(30)}
            title="Последние 30 дней"
          >
            30 ДНЕЙ
          </button>
        </div>
      </div>

      {/* Rare/Deprecated Filters */}
      <div className="hud-filter-group hud-filter-toggles">
        <label className="hud-filter-label">ОСОБЫЕ</label>
        <div className="hud-toggle-group">
          <label className="hud-toggle">
            <input
              type="checkbox"
              className="hud-toggle-input"
              checked={filters.showRare}
              onChange={handleShowRareChange}
            />
            <span className="hud-toggle-label">⭐ Редкие</span>
          </label>
          <label className="hud-toggle">
            <input
              type="checkbox"
              className="hud-toggle-input"
              checked={filters.showDeprecated}
              onChange={handleShowDeprecatedChange}
            />
            <span className="hud-toggle-label">⚠️ Устаревшие</span>
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="hud-filter-group hud-filter-search">
        <label className="hud-filter-label">ПОИСК</label>
        <form className="hud-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="hud-filter-input hud-search-input"
            placeholder="Поиск событий..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
          />
          {filters.searchQuery && (
            <button
              type="button"
              className="hud-search-clear"
              onClick={handleClearSearch}
              title="Очистить поиск"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Results Count */}
      <div className="hud-filter-results">
        <span className="hud-filter-count">
          {filteredEvents.length.toLocaleString()} / {events.length.toLocaleString()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="hud-filter-actions">
        {hasActiveFilters && (
          <button
            className="hud-filter-btn hud-filter-reset"
            onClick={handleResetFilters}
            title="Сбросить все фильтры"
          >
            СБРОС
          </button>
        )}
        <button
          className="hud-filter-btn hud-filter-save"
          onClick={handleSaveFilters}
          title="Сохранить текущие фильтры"
        >
          СОХРАНИТЬ
        </button>
        {savedFilters && (
          <button
            className="hud-filter-btn hud-filter-load"
            onClick={handleLoadFilters}
            title="Загрузить сохраненные фильтры"
          >
            ЗАГРУЗИТЬ
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
