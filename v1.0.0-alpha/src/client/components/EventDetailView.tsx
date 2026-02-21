/**
 * EventDetailView - Modal component for detailed event viewing
 * Provides 4 tabs: Main, Details, Relations, History
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EVENTS_CATALOG, type EventDefinition } from '../../data/events-catalog.js';
import { CATEGORY_COLORS, formatEvent, type FormattedEvent } from '../../utils/eventFormatter.js';
import { api } from '../api/client.js';
import type { EDEvent } from '../types/events.js';

// ============================================================================
// Types
// ============================================================================

export interface ParsedEventData extends EDEvent {
  formatted?: FormattedEvent;
  definition?: EventDefinition;
}

export interface EventDetailViewProps {
  event: ParsedEventData;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

type TabType = 'main' | 'details' | 'relations' | 'history';

interface RelatedEvent {
  id: string;
  timestamp: string;
  event: string;
  data: Record<string, unknown>;
}

interface NotificationState {
  show: boolean;
  message: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

function formatGameDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const year = date.getFullYear() + 1286;
    return `${day} ${month} ${year}`;
  } catch {
    return 'UNKNOWN DATE';
  }
}

function getFieldType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

// ============================================================================
// Sub-components
// ============================================================================

function Notification({ notification }: { notification: NotificationState }) {
  if (!notification.show) return null;
  return (
    <div className="event-detail-notification">
      {notification.message}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`event-detail-tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Badge({
  type,
  children,
}: {
  type: 'deprecated' | 'rare' | 'category';
  children: React.ReactNode;
}) {
  return (
    <span className={`event-detail-badge event-detail-badge-${type}`}>
      {children}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EventDetailView({
  event,
  isOpen,
  onClose,
  onNavigate,
}: EventDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [relatedEvents, setRelatedEvents] = useState<{
    before: RelatedEvent[];
    after: RelatedEvent[];
  }>({ before: [], after: [] });
  const [historyEvents, setHistoryEvents] = useState<RelatedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
  });
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get event definition and formatted data
  const definition = event.definition || EVENTS_CATALOG[event.event];
  const formatted = event.formatted || formatEvent(event.event, event.data);
  const categoryColors = CATEGORY_COLORS[definition?.category || 'unknown'];

  // Show notification
  const showNotification = useCallback((message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 2000);
  }, []);

  // Copy JSON to clipboard
  const copyToClipboard = useCallback(() => {
    const json = JSON.stringify(event, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showNotification('JSON скопирован в буфер обмена');
    }).catch(() => {
      showNotification('Ошибка копирования');
    });
  }, [event, showNotification]);

  // Load related events
  const loadRelatedEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load events before and after current event
      const timestamp = new Date(event.timestamp).getTime();
      
      // This would need proper API endpoints - for now using mock data
      // In production, you'd call: api.getRelatedEvents(event.id, timestamp)
      setRelatedEvents({ before: [], after: [] });
    } catch (err) {
      setError('Ошибка загрузки связанных событий');
      console.error('Error loading related events:', err);
    } finally {
      setLoading(false);
    }
  }, [event]);

  // Load history events
  const loadHistoryEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load last 10 events of same type
      // This would need proper API endpoints
      // In production, you'd call: api.getEventsByType(event.event, 10)
      setHistoryEvents([]);
    } catch (err) {
      setError('Ошибка загрузки истории событий');
      console.error('Error loading history events:', err);
    } finally {
      setLoading(false);
    }
  }, [event]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'relations') {
      loadRelatedEvents();
    } else if (activeTab === 'history') {
      loadHistoryEvents();
    }
  }, [activeTab, loadRelatedEvents, loadHistoryEvents]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Ctrl/Cmd + C - copy JSON
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyToClipboard();
        return;
      }

      // Arrow keys - navigate events
      if (onNavigate) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onNavigate('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onNavigate('next');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, handleClose, onNavigate, copyToClipboard]);

  // Handle click outside modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Render main tab
  const renderMainTab = () => {
    return (
      <div className="event-detail-tab-content event-detail-tab-main">
        <div className="event-detail-header">
          <div className="event-detail-title-row">
            <span className="event-detail-icon">{definition?.icon || '📌'}</span>
            <h2 className="event-detail-title">
              {definition?.label || event.event}
            </h2>
            {definition?.isDeprecated && (
              <Badge type="deprecated">Deprecated</Badge>
            )}
            {definition?.isRare && (
              <Badge type="rare">Rare</Badge>
            )}
          </div>
          <div
            className="event-detail-category-badge"
            style={{
              backgroundColor: categoryColors?.bgColor,
              borderColor: categoryColors?.borderColor,
              color: categoryColors?.color,
            }}
          >
            {definition?.category || 'unknown'}
          </div>
        </div>

        <div className="event-detail-description">
          {definition?.description || 'Нет описания'}
        </div>

        <div className="event-detail-timestamps">
          <div className="event-detail-timestamp">
            <span className="event-detail-timestamp-label">Время:</span>
            <span className="event-detail-timestamp-value">
              {formatTimestamp(event.timestamp)}
            </span>
          </div>
          <div className="event-detail-timestamp">
            <span className="event-detail-timestamp-label">Дата в игре:</span>
            <span className="event-detail-timestamp-value">
              {formatGameDate(event.timestamp)}
            </span>
          </div>
        </div>

        <div className="event-detail-summary">
          <h3>Краткое описание</h3>
          <p>{formatted.summaryRu || formatted.summary}</p>
        </div>

        <div className="event-detail-main-fields">
          <h3>Основные поля</h3>
          <div className="event-detail-fields-grid">
            {formatted.details.slice(0, 6).map((field, index) => (
              <div key={index} className="event-detail-field-item">
                <span className="event-detail-field-label">{field.label}:</span>
                <span className="event-detail-field-value">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render details tab
  const renderDetailsTab = () => {
    const allFields = Object.entries(event.data).map(([key, value]) => ({
      key,
      value,
      type: getFieldType(value),
      formatted: formatFieldValue(value),
    }));

    return (
      <div className="event-detail-tab-content event-detail-tab-details">
        <div className="event-detail-details-header">
          <h3>Все поля события</h3>
          <button
            className="event-detail-copy-button"
            onClick={copyToClipboard}
            title="Копировать JSON (Ctrl+C)"
          >
            📋 Копировать JSON
          </button>
        </div>

        <div className="event-detail-fields-list">
          {allFields.map((field) => (
            <div key={field.key} className="event-detail-field-row">
              <div className="event-detail-field-name">{field.key}</div>
              <div className="event-detail-field-type">{field.type}</div>
              <div className="event-detail-field-content">
                <pre>{field.formatted}</pre>
              </div>
            </div>
          ))}
        </div>

        <div className="event-detail-raw-json">
          <h4>Полный JSON</h4>
          <pre className="event-detail-json-code">
            {JSON.stringify(event, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // Render relations tab
  const renderRelationsTab = () => {
    if (loading) {
      return (
        <div className="event-detail-tab-content event-detail-tab-relations">
          <div className="event-detail-loading">Загрузка...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="event-detail-tab-content event-detail-tab-relations">
          <div className="event-detail-error">{error}</div>
        </div>
      );
    }

    const relationships = definition?.relationships || { before: [], after: [] };

    return (
      <div className="event-detail-tab-content event-detail-tab-relations">
        <div className="event-detail-relations-section">
          <h3>Ожидаемые события до</h3>
          {relationships.before && relationships.before.length > 0 ? (
            <ul className="event-detail-relations-list">
              {relationships.before.map((eventType) => (
                <li key={eventType} className="event-detail-relation-item">
                  {eventType}
                </li>
              ))}
            </ul>
          ) : (
            <p className="event-detail-empty">Нет ожидаемых событий</p>
          )}
        </div>

        <div className="event-detail-relations-section">
          <h3>Ожидаемые события после</h3>
          {relationships.after && relationships.after.length > 0 ? (
            <ul className="event-detail-relations-list">
              {relationships.after.map((eventType) => (
                <li key={eventType} className="event-detail-relation-item">
                  {eventType}
                </li>
              ))}
            </ul>
          ) : (
            <p className="event-detail-empty">Нет ожидаемых событий</p>
          )}
        </div>

        <div className="event-detail-relations-section">
          <h3>Реальные события из истории</h3>
          {relatedEvents.before.length > 0 || relatedEvents.after.length > 0 ? (
            <div className="event-detail-related-events">
              {relatedEvents.before.map((relEvent) => (
                <div key={relEvent.id} className="event-detail-related-event">
                  <span className="event-detail-related-time">
                    {formatTimestamp(relEvent.timestamp)}
                  </span>
                  <span className="event-detail-related-type">
                    {relEvent.event}
                  </span>
                </div>
              ))}
              {relatedEvents.after.map((relEvent) => (
                <div key={relEvent.id} className="event-detail-related-event">
                  <span className="event-detail-related-time">
                    {formatTimestamp(relEvent.timestamp)}
                  </span>
                  <span className="event-detail-related-type">
                    {relEvent.event}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="event-detail-empty">Нет связанных событий</p>
          )}
        </div>
      </div>
    );
  };

  // Render history tab
  const renderHistoryTab = () => {
    if (loading) {
      return (
        <div className="event-detail-tab-content event-detail-tab-history">
          <div className="event-detail-loading">Загрузка...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="event-detail-tab-content event-detail-tab-history">
          <div className="event-detail-error">{error}</div>
        </div>
      );
    }

    return (
      <div className="event-detail-tab-content event-detail-tab-history">
        <h3>Последние 10 событий типа "{event.event}"</h3>
        {historyEvents.length > 0 ? (
          <div className="event-detail-history-list">
            {historyEvents.map((histEvent) => (
              <div key={histEvent.id} className="event-detail-history-item">
                <span className="event-detail-history-time">
                  {formatTimestamp(histEvent.timestamp)}
                </span>
                <span className="event-detail-summary">
                  {Object.entries(histEvent.data)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="event-detail-empty">Нет истории событий</p>
        )}
      </div>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return renderMainTab();
      case 'details':
        return renderDetailsTab();
      case 'relations':
        return renderRelationsTab();
      case 'history':
        return renderHistoryTab();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Notification notification={notification} />
      <div
        className={`event-detail-backdrop ${isClosing ? 'closing' : ''}`}
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className={`event-detail-modal ${isClosing ? 'closing' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="event-detail-modal-header">
            <div className="event-detail-header-left">
              <span className="event-detail-event-type">{event.event}</span>
              <span className="event-detail-event-id">ID: {event.id}</span>
            </div>
            <div className="event-detail-header-right">
              {onNavigate && (
                <>
                  <button
                    className="event-detail-nav-button"
                    onClick={() => onNavigate('prev')}
                    title="Предыдущее событие (←)"
                  >
                    ◀
                  </button>
                  <button
                    className="event-detail-nav-button"
                    onClick={() => onNavigate('next')}
                    title="Следующее событие (→)"
                  >
                    ▶
                  </button>
                </>
              )}
              <button
                className="event-detail-close-button"
                onClick={handleClose}
                title="Закрыть (ESC)"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="event-detail-tabs">
            <TabButton
              active={activeTab === 'main'}
              onClick={() => setActiveTab('main')}
            >
              Главная
            </TabButton>
            <TabButton
              active={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            >
              Детали
            </TabButton>
            <TabButton
              active={activeTab === 'relations'}
              onClick={() => setActiveTab('relations')}
            >
              Связи
            </TabButton>
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            >
              История
            </TabButton>
          </div>

          <div className="event-detail-content">
            {renderTabContent()}
          </div>

          <div className="event-detail-footer">
            <div className="event-detail-shortcuts">
              <span className="event-detail-shortcut">
                <kbd>ESC</kbd> закрыть
              </span>
              <span className="event-detail-shortcut">
                <kbd>←</kbd> <kbd>→</kbd> навигация
              </span>
              <span className="event-detail-shortcut">
                <kbd>Ctrl</kbd>+<kbd>C</kbd> копировать
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
