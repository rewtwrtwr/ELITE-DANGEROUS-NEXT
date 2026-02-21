/**
 * EventsList - Vanilla JS rendering for performance
 * Fixed: unique keys, no duplicates, skeleton loading, proper rendering
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import type { EDEvent } from "../types/events.js";
import { EventDetailView, type ParsedEventData } from "./EventDetailView.js";
import "../styles/event-detail.css";

interface EventsListProps {
  events: EDEvent[];
  loading?: boolean;
}

const PAGE_SIZE = 200;
const ROW_HEIGHT = 42;
const DATE_HEADER_HEIGHT = 36;

function formatGameDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const year = date.getFullYear() + 1286;
    return `${day} ${month} ${year}`;
  } catch {
    return "UNKNOWN DATE";
  }
}

function getEventIcon(eventType: string): string {
  if (!eventType) return "";
  const lower = eventType.toLowerCase();
  if (lower.includes("music")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  if (lower.includes("jump") || lower.includes("fsd")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  }
  if (lower.includes("combat") || lower.includes("kill") || lower.includes("bounty")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
  }
  if (lower.includes("trade") || lower.includes("market")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M12 8v8M8 12h8"/></svg>`;
  }
  if (lower.includes("scan") || lower.includes("discovery")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/></svg>`;
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
  
  return event.event || "";
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  } catch {
    return timestamp;
  }
}

function getEventCategory(eventType: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes("combat") || lower.includes("kill") || lower.includes("bounty")) return "combat";
  if (lower.includes("trade") || lower.includes("market") || lower.includes("buy") || lower.includes("sell")) return "trade";
  if (lower.includes("scan") || lower.includes("discovery") || lower.includes("explore")) return "explore";
  return "system";
}

function createRowHTML(event: EDEvent, index: number): string {
  const category = getEventCategory(event.event);
  const summary = getEventSummary(event);
  const time = formatTime(event.timestamp);
  
  // Debug: log rendering
  // console.log(`Render row ${index}: eventId=${event.id}, type=${event.event}`);
  
  return `<div class="hud-event-row ${category}" data-event-id="${event.id}" data-index="${index}">
    <div class="hud-timestamp" title="${time}">${time}</div>
    <div class="hud-event-icon">${getEventIcon(event.event)}</div>
    <div class="hud-event-type" title="${event.event}">${event.event}</div>
    <div class="hud-event-summary" title="${summary}">${summary}</div>
  </div>`;
}

// Skeleton loader component
function SkeletonRow() {
  return `<div class="hud-event-row skeleton">
    <div class="hud-timestamp skeleton-item"></div>
    <div class="hud-event-icon"></div>
    <div class="hud-event-type skeleton-item"></div>
    <div class="hud-event-summary skeleton-item"></div>
  </div>`;
}

export function EventsList({ events, loading }: EventsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<EDEvent[]>([]);
  const dateGroupsRef = useRef<{ date: string; start: number; end: number }[]>([]);
  const loadedCountRef = useRef(PAGE_SIZE);
  const isRenderingRef = useRef(false);
  const lastRenderedCountRef = useRef(0);
  
  // Modal state for event detail view
  const [selectedEvent, setSelectedEvent] = useState<ParsedEventData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Event handlers for detail view
  const handleEventClick = useCallback((event: EDEvent) => {
    setSelectedEvent(event as ParsedEventData);
    setIsDetailOpen(true);
  }, []);

  const handleDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedEvent || events.length === 0) return;
    
    const currentIndex = events.findIndex(e => e.id === selectedEvent.id);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : events.length - 1;
    } else {
      newIndex = currentIndex < events.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedEvent(events[newIndex] as ParsedEventData);
  }, [selectedEvent, events]);

  // Build date groups - memoized to avoid recalculation
  const dateGroups = useMemo(() => {
    const groups: { date: string; start: number; end: number }[] = [];
    let currentDate = "";
    let groupStart = 0;
    
    for (let i = 0; i < events.length; i++) {
      const date = formatGameDate(events[i].timestamp);
      if (date !== currentDate) {
        if (currentDate) {
          groups.push({ date: currentDate, start: groupStart, end: i - 1 });
        }
        currentDate = date;
        groupStart = i;
      }
    }
    if (currentDate) {
      groups.push({ date: currentDate, start: groupStart, end: events.length - 1 });
    }
    
    return groups;
  }, [events]);

  // Update refs when events change
  useEffect(() => {
    eventsRef.current = events;
    dateGroupsRef.current = dateGroups;
    
    // Only reset loaded count if total events changed significantly
    if (Math.abs(events.length - lastRenderedCountRef.current) > 100) {
      loadedCountRef.current = PAGE_SIZE;
      lastRenderedCountRef.current = events.length;
    }
  }, [events, dateGroups]);

  // Full render when events change completely (initial load or refresh)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const groups = dateGroupsRef.current;
    const eventsData = eventsRef.current;
    const loadedCount = Math.min(PAGE_SIZE, eventsData.length);
    
    loadedCountRef.current = loadedCount;
    lastRenderedCountRef.current = eventsData.length;
    
    let html = "";
    
    for (const group of groups) {
      if (group.start >= loadedCount) break;
      
      const endIndex = Math.min(group.end, loadedCount - 1);
      html += `<div class="hud-date-header">${group.date}</div>`;
      
      for (let i = group.start; i <= endIndex; i++) {
        if (i >= eventsData.length) break;
        html += createRowHTML(eventsData[i], i);
      }
    }
    
    if (loadedCount < eventsData.length) {
      html += `<div class="hud-load-more" data-loaded="${loadedCount}">
        Showing ${loadedCount.toLocaleString()} of ${eventsData.length.toLocaleString()} events - scroll for more
      </div>`;
    }
    
    container.innerHTML = html;
    
  }, [events.length]);

  // Vanilla JS rendering - append more on scroll
  const renderMore = useCallback(() => {
    if (!containerRef.current || isRenderingRef.current) return;
    isRenderingRef.current = true;
    
    const container = containerRef.current;
    const eventsData = eventsRef.current;
    const groups = dateGroupsRef.current;
    const currentLoaded = loadedCountRef.current;
    const newLoaded = Math.min(currentLoaded + PAGE_SIZE, eventsData.length);
    
    // Check if we already rendered this batch
    if (newLoaded <= currentLoaded) {
      isRenderingRef.current = false;
      return;
    }
    
    loadedCountRef.current = newLoaded;
    
    const loadMoreEl = container.querySelector('.hud-load-more') as HTMLElement;
    if (!loadMoreEl) {
      isRenderingRef.current = false;
      return;
    }
    
    let html = "";
    
    // Find the last rendered date and continue from there
    let started = false;
    for (const group of groups) {
      // Start rendering from the point where we left off
      if (group.start < currentLoaded && group.end >= currentLoaded) {
        started = true;
      }
      
      if (started) {
        const startIdx = group.start < currentLoaded ? currentLoaded : group.start;
        const endIndex = Math.min(group.end, newLoaded - 1);
        
        if (startIdx <= endIndex) {
          html += `<div class="hud-date-header">${group.date}</div>`;
          
          for (let i = startIdx; i <= endIndex; i++) {
            if (i >= eventsData.length) break;
            html += createRowHTML(eventsData[i], i);
          }
        }
      }
    }
    
    // Update or remove "load more"
    if (newLoaded < eventsData.length) {
      loadMoreEl.setAttribute('data-loaded', String(newLoaded));
      loadMoreEl.textContent = `Showing ${newLoaded.toLocaleString()} of ${eventsData.length.toLocaleString()} events - scroll for more`;
    } else {
      loadMoreEl.remove();
    }
    
    // Insert new rows before "load more"
    if (html) {
      loadMoreEl.insertAdjacentHTML('beforebegin', html);
    }
    
    isRenderingRef.current = false;
  }, []);

  // Scroll handler - load more on scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isRenderingRef.current) return;
    
    const container = containerRef.current;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    if (scrollBottom < 500 && loadedCountRef.current < eventsRef.current.length) {
      renderMore();
    }
  }, [renderMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("scroll", handleScroll);
    
    // Event delegation for click handling
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const eventRow = target.closest('.hud-event-row') as HTMLElement;
      
      if (eventRow && !eventRow.classList.contains('skeleton')) {
        const eventId = eventRow.getAttribute('data-event-id');
        if (eventId) {
          const eventData = eventsRef.current.find(ev => ev.id === eventId);
          if (eventData) {
            handleEventClick(eventData);
          }
        }
      }
    };
    
    container.addEventListener('click', handleClick);
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener('click', handleClick);
    };
  }, [handleScroll, handleEventClick]);

  // Loading state with skeleton
  if (loading && events.length === 0) {
    return (
      <div className="hud-events-container">
        <div className="hud-date-header">LOADING</div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="hud-event-row">
            <div className="hud-timestamp skeleton-item"></div>
            <div className="hud-event-icon"></div>
            <div className="hud-event-type skeleton-item"></div>
            <div className="hud-event-summary skeleton-item"></div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="hud-events-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6b7280' }}>No events</span>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="hud-events-container"
        style={{ overflow: 'auto', height: '100%' }}
      />
      {selectedEvent && (
        <EventDetailView
          event={selectedEvent}
          isOpen={isDetailOpen}
          onClose={handleDetailClose}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}

export default EventsList;
