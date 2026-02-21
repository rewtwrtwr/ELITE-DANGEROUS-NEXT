/**
 * Elite Dangerous NEXT - Main Application
 * EDCoPilot Terminal Interface Style
 */

import type { ReactNode } from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useEvents } from "./hooks/useEvents";
import { useStats } from "./hooks/useStats";
import { useAuth } from "./hooks/useAuth";
import { LoadingScreen } from "./components/LoadingScreen";
import { useEventsSimple } from "./hooks/useEventsSimple";
import VirtualEventsList from "./components/VirtualEventsList";
import { FilterBar } from "./components/FilterBar";
import type { EDEvent, EventStats } from "./types/events";
import "./styles/hud.css";

// ============================================================================
// Types
// ============================================================================

type ViewType = "events" | "profile" | "settings";

interface CAPIProfile {
  commander: { name: string; frontierId: string };
  credits: number;
  currentLocation: string | null;
  rank: { combat: number; trade: number; exploration: number; cqc: number };
  lastStarport?: {
    name: string;
    system: string;
    marketId?: number;
    shipyardId?: number;
    outfittingId?: number;
  };
}

const Icons = {
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

// ============================================================================
// Components
// ============================================================================

function LiveIndicator({ isLive }: { isLive: boolean }) {
  return (
    <div className="hud-live-indicator">
      <div className={`hud-live-dot ${isLive ? "" : "inactive"}`} />
      <span className="hud-live-text">LIVE</span>
    </div>
  );
}

function GameStatus({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="hud-connection-status">
      <div className={`hud-connection-dot ${isRunning ? "connected" : "disconnected"}`} />
      <span>{isRunning ? "ONLINE" : "OFFLINE"}</span>
    </div>
  );
}

function StatsBanner({ stats }: { stats: EventStats | null }) {
  if (!stats) {
    return (
      <div className="hud-stats-bar">
        <span style={{ color: '#6b7280' }}>Loading stats...</span>
      </div>
    );
  }

  return (
    <div className="hud-stats-bar">
      <div className="hud-stat-item">
        <span className="hud-label">TOTAL:</span>
        <span className="hud-value">{stats.totalEvents.toLocaleString()}</span>
      </div>
      <span className="hud-stat-divider">|</span>
      <div className="hud-stat-item">
        <span className="hud-label">JUMPS:</span>
        <span className="hud-value">{stats.jumps.toLocaleString()}</span>
      </div>
      <span className="hud-stat-divider">|</span>
      <div className="hud-stat-item">
        <span className="hud-label">COMBAT:</span>
        <span className="hud-value">{stats.combat.toLocaleString()}</span>
      </div>
      <span className="hud-stat-divider">|</span>
      <div className="hud-stat-item">
        <span className="hud-label">TRADE:</span>
        <span className="hud-value">{stats.trading.toLocaleString()}</span>
      </div>
      <span className="hud-stat-divider">|</span>
      <div className="hud-stat-item">
        <span className="hud-label">EXPLORE:</span>
        <span className="hud-value">{stats.exploration.toLocaleString()}</span>
      </div>
      <span className="hud-stat-divider">|</span>
      <div className="hud-stat-item">
        <span className="hud-label">MINING:</span>
        <span className="hud-value">{stats.mining.toLocaleString()}</span>
      </div>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`hud-sidebar-button ${active ? "active" : ""}`}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className="hud-sidebar-tooltip">{label}</span>
    </button>
  );
}

function Sidebar({ currentView, onViewChange }: { currentView: ViewType; onViewChange: (view: ViewType) => void }) {
  return (
    <aside className="hud-sidebar">
      <SidebarButton
        icon={Icons.events}
        label="Events"
        active={currentView === "events"}
        onClick={() => onViewChange("events")}
      />
      <SidebarButton
        icon={Icons.profile}
        label="Profile"
        active={currentView === "profile"}
        onClick={() => onViewChange("profile")}
      />
      <SidebarButton
        icon={Icons.settings}
        label="Settings"
        active={currentView === "settings"}
        onClick={() => onViewChange("settings")}
      />
    </aside>
  );
}

// ============================================================================
// Profile Panel View
// ============================================================================

function ProfilePanelView({ profile }: { profile: CAPIProfile | null }) {
  const { refreshProfile } = useAuth();
  
  if (!profile) return null;

  const p = profile;
  const cmdrName = p.commander?.name || 'Commander';
  const location = p.currentLocation || p.lastStarport?.system || 'Unknown';

  const COMBAT_RANKS = ['Harmless', 'Mostly Harmless', 'Novice', 'Competent', 'Expert', 'Master', 'Dangerous', 'Deadly', 'Elite'];
  const TRADE_RANKS = ['Penniless', 'Mostly Penniless', 'Peddler', 'Dealer', 'Merchant', 'Broker', 'Entrepreneur', 'Tycoon', 'Elite'];
  const EXPLORE_RANKS = ['Aimless', 'Mostly Aimless', 'Scout', 'Surveyor', 'Explorer', 'Pathfinder', 'Ranger', 'Grand Tour', 'Elite'];

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>
      {/* Commander Info */}
      <div style={{ padding: '12px', backgroundColor: '#0d0d0d', borderBottom: '1px solid #1f2937' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#ff8c00', marginBottom: '4px' }}>
          {cmdrName}
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>📍 {location}</span>
          {p.credits !== undefined && (
            <span style={{ color: '#00ff88', fontFamily: "'JetBrains Mono', monospace" }}>
              {p.credits.toLocaleString()} CR
            </span>
          )}
        </div>
      </div>

      {/* Ranks */}
      {p.rank && (
        <div style={{ display: 'flex', padding: '12px', borderBottom: '1px solid #1f2937', fontSize: '11px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#6b7280', marginBottom: '2px' }}>Combat</div>
            <div style={{ color: '#ef4444', fontWeight: 600 }}>{COMBAT_RANKS[p.rank.combat] || 'Unknown'}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#6b7280', marginBottom: '2px' }}>Trade</div>
            <div style={{ color: '#ff8c00', fontWeight: 600 }}>{TRADE_RANKS[p.rank.trade] || 'Unknown'}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#6b7280', marginBottom: '2px' }}>Explore</div>
            <div style={{ color: '#00ff88', fontWeight: 600 }}>{EXPLORE_RANKS[p.rank.exploration] || 'Unknown'}</div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={refreshProfile}
        className="hud-button"
        style={{ marginTop: '12px' }}
      >
        REFRESH
      </button>
    </div>
  );
}

// ============================================================================
// Settings Panel View
// ============================================================================

function SettingsPanelView() {
  const [settings, setSettings] = useState({
    refreshInterval: 10000,
  });
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    localStorage.setItem('ednext_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testJournal = async () => {
    try {
      const response = await fetch('/api/v1/journal/status');
      const data = await response.json();
      alert(data.isWatching ? '✅ Journal connected!' : '❌ Error');
    } catch {
      alert('❌ Connection failed');
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '400px', margin: '0 auto' }}>
      <div className="hud-title-small" style={{ marginBottom: '16px' }}>
        SETTINGS
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
          Refresh Interval
        </label>
        <select
          value={settings.refreshInterval}
          onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt((e.target as HTMLSelectElement).value) })}
          className="hud-input"
          style={{ width: '100%' }}
        >
          <option value={5000}>5 seconds</option>
          <option value={10000}>10 seconds</option>
          <option value={30000}>30 seconds</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={testJournal}
          className="hud-button"
          style={{ flex: 1 }}
        >
          TEST
        </button>
        <button
          onClick={saveSettings}
          className={`hud-button ${saved ? '' : 'primary'}`}
          style={{ flex: 1 }}
        >
          {saved ? 'SAVED!' : 'SAVE'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Application
// ============================================================================

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>("events");
  const {
    isAuthenticated,
    isLoading: authLoading,
    profile,
    cmdr,
    login,
    logout,
  } = useAuth();

  const { isLive } = useEvents({ pageSize: 50, autoLoad: true });

  // Используем упрощённый хук - все события в памяти
  const {
    events,
    loading: isBatchLoading,
    totalCount,
  } = useEventsSimple({ pollInterval: 3000 });

  // State for filtered events (managed by FilterBar)
  const [filteredEvents, setFilteredEvents] = useState<EDEvent[]>([]);

  // Initialize filteredEvents when events first load (but FilterBar hasn't calculated yet)
  // This prevents "No events" flash when page first renders
  const eventsToShow = filteredEvents.length > 0 || isBatchLoading ? filteredEvents : events;

  // Handler for FilterBar - receives filtered events from FilterBar component
  const handleFilterChange = useCallback((filtered: EDEvent[]) => {
    setFilteredEvents(filtered);
  }, []);

  // Stats - вычисляем только из общего количества (события загружаются по требованию)
  const calculatedStats = useMemo(() => {
    if (totalCount === 0) return null;

    return {
      totalEvents: totalCount,
      jumps: 0,
      combat: 0,
      trading: 0,
      exploration: 0,
      mining: 0,
      totalJumps: 0,
      tradingCredits: 0,
      explorationCredits: 0,
      combatCredits: 0,
      missions: 0,
      engineering: 0,
    };
  }, [totalCount]);

  const { isGameRunning, latency } = useStats({ updateInterval: 10000 });
  const stats = calculatedStats;

  if (isBatchLoading && totalCount === 0) {
    return (
      <div className="hud-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#ff8c00', fontSize: '14px' }}>Loading events...</div>
      </div>
    );
  }

  return (
    <div className="hud-container">
      {/* Loading Screen */}
      <LoadingScreen
        progress={events.length}
        status={isBatchLoading ? "Loading events..." : "Ready"}
        percent={events.length / Math.max(totalCount, 1) * 100}
        visible={isBatchLoading && totalCount === 0}
      />

      {/* Header */}
      <header className="hud-header">
        <div className="hud-header-left">
          <h1 className="hud-title">ED NEXT</h1>
          <GameStatus isRunning={isGameRunning} />
        </div>
        <div className="hud-header-right">
          {authLoading ? (
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Checking...</span>
          ) : isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '10px' }}>
                <span style={{ color: '#ff8c00', fontWeight: 600 }}>{cmdr || profile?.commander?.name || 'Commander'}</span>
                {profile?.credits !== undefined && (
                  <span style={{ color: '#00ff88', fontFamily: "'JetBrains Mono', monospace" }}>
                    {profile.credits.toLocaleString()} CR
                  </span>
                )}
              </div>
              <button className="hud-button" onClick={logout}>EXIT</button>
            </div>
          ) : (
            <button className="hud-button primary" onClick={login}>FRONTIER</button>
          )}
        </div>
      </header>

      {/* Stats Banner */}
      <StatsBanner stats={stats} />

      {/* Main Content */}
      <main className="hud-main">
        {/* Sidebar */}
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        {/* Content Area */}
        <div className="hud-content">
          {/* Content Header */}
          <div className="hud-content-header">
            <span className="hud-title-small">
              {currentView === 'events' && 'EVENT LOG'}
              {currentView === 'profile' && 'COMMANDER PROFILE'}
              {currentView === 'settings' && 'SETTINGS'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LiveIndicator isLive={isLive} />
            </div>
          </div>

          {/* Events View */}
          {currentView === 'events' && (
            <div className="hud-content-area">
              {isBatchLoading && totalCount === 0 ? (
                <div className="hud-loading">
                  <div className="hud-loading-spinner" />
                  Loading all events...
                </div>
              ) : totalCount === 0 ? (
                <div className="hud-empty">
                  <div>NO EVENTS</div>
                  <div style={{ marginTop: '8px', fontSize: '10px' }}>
                    Start Elite Dangerous or wait for journal load
                  </div>
                </div>
              ) : (
                <>
                  <FilterBar
                    events={events}
                    onFilterChange={handleFilterChange}
                  />
                  <VirtualEventsList
                    events={eventsToShow}
                    loading={isBatchLoading}
                  />
                </>
              )}
            </div>
          )}

          {/* Profile View */}
          {currentView === 'profile' && (
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {!isAuthenticated ? (
                <div className="hud-empty" style={{ height: 'auto', padding: '48px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
                  <div>AUTHORIZATION REQUIRED</div>
                  <div style={{ fontSize: '10px', marginTop: '8px', color: '#6b7280' }}>
                    Login via Frontier OAuth for full data
                  </div>
                  <button className="hud-button primary" style={{ marginTop: '16px' }} onClick={login}>
                    LOGIN
                  </button>
                </div>
              ) : (
                <ProfilePanelView profile={profile as CAPIProfile} />
              )}
            </div>
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <SettingsPanelView />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="hud-footer">
        <div className="hud-footer-left">
          <span>v1.0.0-alpha</span>
        </div>
        <div className="hud-footer-right">
          <span>{totalCount.toLocaleString()} events loaded</span>
          <span>|</span>
          <span>Latency: {latency !== null ? `${latency}ms` : '—'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
