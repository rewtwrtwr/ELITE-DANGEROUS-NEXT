/**
 * OAuth2 Authentication Types
 */

/**
 * Token response from Frontier OAuth2
 */
export interface FrontierTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

/**
 * Decoded JWT payload from Frontier
 */
export interface FrontierProfile {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  preferred_username: string;
  email?: string;
  name?: string;
}

/**
 * Authentication state for frontend
 */
export interface AuthState {
  authenticated: boolean;
  player: FrontierProfile | null;
  tokenExpiry: Date | null;
}

/**
 * Extended Express Request with user
 */
export interface AuthRequest {
  user?: FrontierProfile;
}

/**
 * OAuth2 error response
 */
export interface AuthErrorResponse {
  error: string;
  message: string;
  timestamp?: string;
}

/**
 * Auth status response
 */
export interface AuthStatusResponse {
  authenticated: boolean;
  player?: {
    id: string;
    name: string;
    email?: string;
  };
  tokenExpiry?: string;
}
