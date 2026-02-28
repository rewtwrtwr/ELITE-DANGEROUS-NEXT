/**
 * ProfilePanel Component
 * Панель профиля игрока с данными из CAPI
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface CAPIProfile {
  commander: {
    name: string;
    frontierId: string;
  };
  credits: number;
  currentLocation: string | null;
  rank: {
    combat: number;
    trade: number;
    exploration: number;
    cqc: number;
  };
  lastStarport?: {
    name: string;
    system: string;
    marketId?: number;
    shipyardId?: number;
    outfittingId?: number;
  };
}

interface MarketData {
  items: Array<{
    id: number;
    name: string;
    buyPrice: number;
    sellPrice: number;
    demand: number;
    supply: number;
  }>;
}

interface ShipyardData {
  ships: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface OutfittingData {
  modules: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
  }>;
}

// Rank names for Elite Dangerous
const COMBAT_RANKS = [
  'Harmless', 'Mostly Harmless', 'Novice', 'Competent', 'Expert',
  'Master', 'Dangerous', 'Deadly', 'Elite'
];
const TRADE_RANKS = [
  'Penniless', 'Mostly Penniless', 'Peddler', 'Dealer', 'Merchant',
  'Broker', 'Entrepreneur', 'Tycoon', 'Elite'
];
const EXPLORE_RANKS = [
  'Aimless', 'Mostly Aimless', 'Scout', 'Surveyor', 'Explorer',
  'Pathfinder', 'Ranger', 'Grand Tour', 'Elite'
];

export function ProfilePanel() {
  const { isAuthenticated, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'market' | 'shipyard' | 'outfitting'>('profile');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [shipyardData, setShipyardData] = useState<ShipyardData | null>(null);
  const [outfittingData, setOutfittingData] = useState<OutfittingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch additional CAPI data when tab changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCAPIData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === 'market') {
          const response = await fetch('/auth/market');
          const data = await response.json();
          if (data.success) {
            setMarketData(data.market);
          } else {
            setError(data.message || 'Not at a station with market');
          }
        } else if (activeTab === 'shipyard') {
          const response = await fetch('/auth/shipyard');
          const data = await response.json();
          if (data.success) {
            setShipyardData(data.shipyard);
          } else {
            setError(data.message || 'Not at a station with shipyard');
          }
        } else if (activeTab === 'outfitting') {
          const response = await fetch('/auth/outfitting');
          const data = await response.json();
          if (data.success) {
            setOutfittingData(data.outfitting);
          } else {
            setError(data.message || 'Not at a station with outfitting');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchCAPIData();
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#686878'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          Авторизуйтесь для просмотра данных CAPI
        </div>
        <div style={{ fontSize: '12px', color: '#484848' }}>
          Данные доступны после входа через Frontier OAuth
        </div>
      </div>
    );
  }

  const p = profile as CAPIProfile | null;
  const cmdrName = p?.commander?.name || 'Commander';
  const location = p?.currentLocation || p?.lastStarport?.system || 'Неизвестно';

  const tabStyle = (tab: typeof activeTab) => ({
    padding: '8px 16px',
    backgroundColor: activeTab === tab ? '#FF8C00' : '#1a1a25',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    color: activeTab === tab ? '#fff' : '#686878',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: '4px',
  });

  return (
    <div style={{
      backgroundColor: '#12121a',
      borderRadius: '8px',
      border: '1px solid #2a2a3a',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2a2a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#FF8C00', fontSize: '16px' }}>👤 {cmdrName}</h3>
          <span style={{ color: '#686878', fontSize: '12px' }}>📍 {location}</span>
        </div>
        {p?.credits !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#00FF88', fontSize: '18px', fontWeight: 700 }}>
              💰 {p.credits.toLocaleString()} CR
            </div>
          </div>
        )}
      </div>

      {/* Rank Display */}
      {p?.rank && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a3a',
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#686878', marginBottom: '2px' }}>Combat</div>
            <div style={{ color: '#FF4444', fontWeight: 600 }}>
              {COMBAT_RANKS[p.rank.combat] || 'Unknown'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#686878', marginBottom: '2px' }}>Trade</div>
            <div style={{ color: '#ff8c00', fontWeight: 600 }}>
              {TRADE_RANKS[p.rank.trade] || 'Unknown'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#686878', marginBottom: '2px' }}>Explore</div>
            <div style={{ color: '#00BFFF', fontWeight: 600 }}>
              {EXPLORE_RANKS[p.rank.exploration] || 'Unknown'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        padding: '8px 16px 0',
        borderBottom: '1px solid #2a2a3a',
      }}>
        <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>
          Профиль
        </button>
        <button style={tabStyle('market')} onClick={() => setActiveTab('market')}>
          Рынок
        </button>
        <button style={tabStyle('shipyard')} onClick={() => setActiveTab('shipyard')}>
          Верфь
        </button>
        <button style={tabStyle('outfitting')} onClick={() => setActiveTab('outfitting')}>
          Оборудование
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', minHeight: '200px', maxHeight: '300px', overflowY: 'auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#686878', padding: '20px' }}>
            Загрузка данных...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', color: '#FF4444', padding: '20px' }}>
            {error}
          </div>
        )}

        {!loading && !error && activeTab === 'profile' && (
          <div style={{ fontSize: '12px', color: '#a8a8b8' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#00BFFF' }}>Frontier ID:</strong>{' '}
              {p?.commander?.frontierId || 'N/A'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#00BFFF' }}>Текущая система:</strong>{' '}
              {p?.currentLocation || 'Неизвестно'}
            </div>
            {p?.lastStarport && (
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#00BFFF' }}>Последняя станция:</strong>{' '}
                {p.lastStarport.name} ({p.lastStarport.system})
              </div>
            )}
            <button
              onClick={refreshProfile}
              style={{
                marginTop: '12px',
                padding: '6px 12px',
                backgroundColor: '#1a1a25',
                border: '1px solid #2a2a3a',
                borderRadius: '4px',
                color: '#FF8C00',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Обновить данные
            </button>
          </div>
        )}

        {!loading && !error && activeTab === 'market' && marketData && (
          <div style={{ fontSize: '11px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                  <th style={{ textAlign: 'left', padding: '4px', color: '#686878' }}>Товар</th>
                  <th style={{ textAlign: 'right', padding: '4px', color: '#686878' }}>Покупка</th>
                  <th style={{ textAlign: 'right', padding: '4px', color: '#686878' }}>Продажа</th>
                  <th style={{ textAlign: 'right', padding: '4px', color: '#686878' }}>Спрос</th>
                </tr>
              </thead>
              <tbody>
                {marketData.items?.slice(0, 20).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1a1a25' }}>
                    <td style={{ padding: '4px', color: '#a8a8b8' }}>{item.name}</td>
                    <td style={{ padding: '4px', textAlign: 'right', color: '#FF4444' }}>
                      {item.buyPrice.toLocaleString()}
                    </td>
                    <td style={{ padding: '4px', textAlign: 'right', color: '#00FF88' }}>
                      {item.sellPrice.toLocaleString()}
                    </td>
                    <td style={{ padding: '4px', textAlign: 'right', color: '#00BFFF' }}>
                      {item.demand.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && activeTab === 'shipyard' && shipyardData && (
          <div style={{ fontSize: '11px' }}>
            {shipyardData.ships?.slice(0, 20).map((ship, idx) => (
              <div key={idx} style={{
                padding: '8px',
                marginBottom: '4px',
                backgroundColor: '#1a1a25',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#a8a8b8' }}>{ship.name}</span>
                <span style={{ color: '#00FF88' }}>{ship.price.toLocaleString()} CR</span>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && activeTab === 'outfitting' && outfittingData && (
          <div style={{ fontSize: '11px' }}>
            {outfittingData.modules?.slice(0, 30).map((mod, idx) => (
              <div key={idx} style={{
                padding: '6px 8px',
                marginBottom: '2px',
                backgroundColor: '#1a1a25',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
              }}>
                <span style={{ color: '#a8a8b8' }}>
                  <span style={{ color: '#686878' }}>[{mod.category}]</span> {mod.name}
                </span>
                <span style={{ color: '#00FF88' }}>{mod.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePanel;
