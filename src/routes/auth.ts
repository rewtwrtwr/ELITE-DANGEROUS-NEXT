/**
 * Authentication Routes - Frontier OAuth2
 *
 * Endpoints:
 * - GET /auth/login - Initiate OAuth2 flow
 * - GET /auth/callback - OAuth2 callback handler
 * - GET /auth/logout - Logout and clear tokens
 * - GET /auth/status - Get current auth status
 * - POST /auth/refresh - Refresh access token
 * - GET /auth/error - Display authentication error
 */

import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { tokenService } from '../services/token-service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// In-memory state store for OAuth2 (replace with Redis in production)
const stateStore = new Map<string, { state: string; timestamp: number }>();

// Clean up old states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      stateStore.delete(key);
    }
  }
}, 600000);

/**
 * GET /auth/login
 * Initiate OAuth2 flow
 */
router.get('/login', (req: Request, res: Response) => {
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with timestamp
    stateStore.set(state, { state, timestamp: Date.now() });
    
    // Get redirect URL from query or default to /dashboard
    const redirect = (req.query.redirect as string) || '/';
    
    // Store redirect in cookie
    res.cookie('auth_redirect', redirect, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300000, // 5 minutes
    });
    
    // Get authorization URL
    const authUrl = tokenService.getAuthorizationUrl(state);
    
    logger.info('Auth', 'Redirecting to Frontier SSO', { state });
    
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Auth', 'Failed to generate login URL', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.redirect('/auth/error?message=' + encodeURIComponent('Failed to initiate login'));
  }
});

/**
 * GET /auth/callback
 * OAuth2 callback handler
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  // Check for OAuth2 errors
  if (error) {
    logger.error('Auth', 'OAuth2 error', { error });
    return res.redirect(`/auth/error?message=${encodeURIComponent('Authentication failed: ' + error)}`);
  }
  
  if (!code || !state) {
    logger.error('Auth', 'Missing code or state');
    return res.redirect(`/auth/error?message=${encodeURIComponent('Invalid callback parameters')}`);
  }
  
  // Verify state
  const storedState = stateStore.get(state as string);
  if (!storedState) {
    logger.error('Auth', 'Invalid or expired state');
    return res.redirect(`/auth/error?message=${encodeURIComponent('Invalid or expired session')}`);
  }
  
  // Remove used state
  stateStore.delete(state as string);
  
  try {
    // Exchange code for tokens
    const tokens = await tokenService.exchangeCodeForToken(code as string);
    
    // Set cookies
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in * 1000,
    });
    
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.refresh_expires_in * 1000,
    });
    
    logger.info('Auth', 'Authentication successful');
    
    // Get redirect URL
    const redirect = req.cookies.auth_redirect || '/';
    res.clearCookie('auth_redirect');
    
    res.redirect(redirect);
  } catch (err) {
    logger.error('Auth', 'Token exchange failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    res.redirect(`/auth/error?message=${encodeURIComponent('Failed to complete authentication')}`);
  }
});

/**
 * GET /auth/logout
 * Logout and clear tokens
 */
router.get('/logout', (req: Request, res: Response) => {
  // Clear auth cookies
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('auth_redirect');
  
  logger.info('Auth', 'User logged out');
  
  res.redirect('/');
});

/**
 * GET /auth/status
 * Get current auth status
 */
router.get('/status', (req: Request, res: Response) => {
  const accessToken = req.cookies.access_token;
  
  if (!accessToken) {
    return res.json({ authenticated: false });
  }
  
  // Decode JWT to get user info (without verification for status check)
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
    
    res.json({
      authenticated: true,
      player: {
        id: payload.sub,
        name: payload.preferred_username,
        email: payload.email,
      },
      tokenExpiry: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    logger.warn('Auth', 'Failed to decode access token', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.json({ authenticated: false });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({
      error: 'NO_REFRESH_TOKEN',
      message: 'No refresh token found',
    });
  }
  
  try {
    const tokens = await tokenService.refreshAccessToken(refreshToken);
    
    // Update cookies
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in * 1000,
    });
    
    // Update refresh token if new one provided
    if (tokens.refresh_token) {
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.refresh_expires_in * 1000,
      });
    }
    
    logger.info('Auth', 'Token refreshed successfully');
    
    res.json({
      success: true,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });
  } catch (err) {
    logger.error('Auth', 'Token refresh failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    
    // Clear invalid tokens
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    
    res.status(401).json({
      error: 'REFRESH_FAILED',
      message: 'Failed to refresh token',
    });
  }
});

/**
 * GET /auth/error
 * Display authentication error
 */
router.get('/error', (req: Request, res: Response) => {
  const message = req.query.message || 'Unknown error';
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #1a1a2e;
            color: #eee;
          }
          .error { color: #ff6b6b; font-size: 24px; }
          a { color: #4ecdc4; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .container { max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Authentication Error</h1>
          <p>${message}</p>
          <p>
            <a href="/auth/login">Try Again</a> | 
            <a href="/">Go Home</a>
          </p>
        </div>
      </body>
    </html>
  `);
});

export { router as authRoutes };
