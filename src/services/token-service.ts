/**
 * Token Service - Frontier OAuth2 Token Management
 *
 * Handles:
 * - Exchanging authorization code for tokens
 * - Refreshing access tokens
 * - Generating authorization URLs
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import type { FrontierTokenResponse } from '../types/auth.js';

const AUTH_URL = process.env.FRONTIER_AUTH_URL || 'https://auth.frontierstore.net/auth/realms/fsc';
const CLIENT_ID = process.env.FRONTIER_CLIENT_ID;
const CLIENT_SECRET = process.env.FRONTIER_CLIENT_SECRET;
const REDIRECT_URI = process.env.FRONTIER_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export class TokenService {
  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from OAuth2 callback
   * @returns Token response with access_token, refresh_token, id_token
   */
  async exchangeCodeForToken(code: string): Promise<FrontierTokenResponse> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      logger.error('TokenService', 'OAuth2 credentials not configured');
      throw new Error('OAuth2 credentials not configured');
    }

    try {
      const response = await axios.post<FrontierTokenResponse>(
        `${AUTH_URL}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('TokenService', 'Successfully exchanged code for token', {
        expiresIn: response.data.expires_in,
        refreshExpiresIn: response.data.refresh_expires_in,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
      logger.error('TokenService', 'Failed to exchange code for token', {
        status: axiosError.response?.status,
        data: JSON.stringify(axiosError.response?.data),
        error: axiosError.message,
      });
      throw new Error('Token exchange failed');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token from previous token response
   * @returns New token response
   */
  async refreshAccessToken(refreshToken: string): Promise<FrontierTokenResponse> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      logger.error('TokenService', 'OAuth2 credentials not configured');
      throw new Error('OAuth2 credentials not configured');
    }

    try {
      const response = await axios.post<FrontierTokenResponse>(
        `${AUTH_URL}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('TokenService', 'Successfully refreshed access token', {
        expiresIn: response.data.expires_in,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
      logger.error('TokenService', 'Failed to refresh access token', {
        status: axiosError.response?.status,
        data: JSON.stringify(axiosError.response?.data),
        error: axiosError.message,
      });
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get authorization URL for OAuth2 flow
   * @param state - Random state string for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state: string): string {
    if (!CLIENT_ID) {
      throw new Error('FRONTIER_CLIENT_ID not configured');
    }

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile',
      state,
    });

    const authUrl = `${AUTH_URL}/protocol/openid-connect/auth?${params.toString()}`;
    logger.debug('TokenService', 'Generated authorization URL', { state });
    
    return authUrl;
  }
}

export const tokenService = new TokenService();
