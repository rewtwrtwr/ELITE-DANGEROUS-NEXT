/**
 * AuthButton Component
 * Кнопка авторизации через Frontier OAuth
 */

import { useAuth } from '../hooks/useAuth';

interface AuthButtonProps {
  variant?: 'button' | 'link';
  showProfile?: boolean;
}

export function AuthButton({ variant = 'button', showProfile = true }: AuthButtonProps) {
  const { isAuthenticated, isLoading, error, profile, cmdr, login, logout } = useAuth();

  if (isLoading) {
    return (
      <span style={{ color: '#686878', fontSize: '14px' }}>
        Проверка авторизации...
      </span>
    );
  }

  if (error) {
    return (
      <span style={{ color: '#FF4444', fontSize: '14px' }}>
        Ошибка: {error}
      </span>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showProfile && profile && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontSize: '12px'
          }}>
            <span style={{ color: '#00BFFF', fontWeight: 600 }}>
              {cmdr || profile.commander?.name || 'Commander'}
            </span>
            {profile.currentLocation && (
              <span style={{ color: '#686878' }}>
                📍 {profile.currentLocation}
              </span>
            )}
            {profile.credits !== undefined && (
              <span style={{ color: '#00FF88' }}>
                💰 {profile.credits.toLocaleString()} CR
              </span>
            )}
          </div>
        )}
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF4444',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FF6666'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF4444'}
        >
          ВЫХОД
        </button>
      </div>
    );
  }

  // Not authenticated - show login button
  if (variant === 'link') {
    return (
      <button
        onClick={login}
        style={{
          background: 'none',
          border: 'none',
          color: '#FF8C00',
          fontSize: '14px',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Войти через Frontier
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={login}
        style={{
          padding: '10px 20px',
          backgroundColor: '#FF8C00',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFA500'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
      >
        🔐 ВОЙТИ
      </button>
      <button
        onClick={() => localStorage.setItem('auth_mode', 'guest')}
        style={{
          padding: '10px 20px',
          backgroundColor: 'transparent',
          border: '2px solid #686878',
          borderRadius: '4px',
          color: '#686878',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#888888';
          e.currentTarget.style.color = '#888888';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#686878';
          e.currentTarget.style.color = '#686878';
        }}
      >
        Гостевой режим
      </button>
    </div>
  );
}

export default AuthButton;
