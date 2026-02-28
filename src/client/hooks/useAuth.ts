/**
 * useAuth Hook
 * Хук для работы с аутентификацией через Frontier OAuth
 */

import { useState, useEffect, useCallback } from 'react';

interface UserProfile {
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
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  profile: UserProfile | null;
  cmdr: string | null;
}

interface UseAuthReturn extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    profile: null,
    cmdr: null,
  });

  // Check auth status on mount
  const checkAuthStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const authMode = localStorage.getItem('auth_mode');

      if (authMode === 'guest') {
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          profile: { commander: { name: 'Guest Pilot' }, credits: 0, currentLocation: 'Guest Mode', rank: { combat: 0, trade: 0, exploration: 0, cqc: 0 } },
          cmdr: 'Guest Pilot',
        });
        return;
      }

      const response = await fetch('/auth/status');
      const data = await response.json();

      if (data.authenticated) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          profile: data.profile || null,
          cmdr: data.cmdr || null,
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          profile: null,
          cmdr: null,
        });
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check auth status',
        profile: null,
        cmdr: null,
      });
    }
  }, []);

  // Login - redirect to Frontier OAuth
  const login = useCallback(async () => {
    try {
      const response = await fetch('/auth/login');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.mode === 'guest') {
        const guestMode = data.message || 'Running in guest mode';
        console.warn('[Auth] ', guestMode);
        localStorage.setItem('auth_mode', 'guest');
        window.location.reload();
      }
    } catch (error) {
      console.error('[Auth] Login failed:', error);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      localStorage.removeItem('auth_mode');
      await fetch('/auth/logout', { method: 'GET' });
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        profile: null,
        cmdr: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to logout',
      }));
    }
  }, []);

  // Refresh profile from CAPI
  const refreshProfile = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const response = await fetch('/auth/profile');
      const data = await response.json();

      if (data.success && data.profile) {
        setState(prev => ({
          ...prev,
          profile: data.profile,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [state.isAuthenticated]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    ...state,
    login,
    logout,
    refreshProfile,
  };
}

export default useAuth;
