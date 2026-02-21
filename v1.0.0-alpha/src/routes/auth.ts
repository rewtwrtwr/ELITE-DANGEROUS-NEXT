/**
 * Auth Routes Stub
 *
 * TODO: Implement Frontier OAuth2 for production use
 * Current implementation provides guest mode for offline/local usage
 */

import { Router } from 'express';

const router = Router();

// GET /auth/status - Returns authentication status
router.get('/status', (req, res) => {
  // Add debug header for frontend
  res.setHeader('X-Elite-Mode', 'guest');

  res.json({
    authenticated: false,
    mode: 'guest',
    cmdr: null,
    frontierId: null,
    timestamp: new Date().toISOString()
  });
});

// GET /auth/login - Stub for OAuth redirect
router.get('/login', (req, res) => {
  res.setHeader('X-Elite-Mode', 'guest');

  const hasOAuthConfig = process.env.FRONTIER_CLIENT_ID && process.env.FRONTIER_CLIENT_SECRET;

  if (hasOAuthConfig) {
    const authUrl = `https://auth.frontierstore.net/oauth2/auth?client_id=${process.env.FRONTIER_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.FRONTIER_REDIRECT_URI || 'http://localhost:3000/auth/callback')}&scope=journal+profile`;

    res.json({
      authUrl,
      mode: 'oauth'
    });
  } else {
    res.json({
      authUrl: null,
      mode: 'guest',
      message: 'Frontier OAuth не настроен. Работа в гостевом режиме.',
      info: 'Для включения Frontier OAuth задайте FRONTIER_CLIENT_ID и FRONTIER_CLIENT_SECRET'
    });
  }
});

// Guest mode endpoint - explicitly set guest mode
router.get('/guest', (req, res) => {
  res.setHeader('X-Elite-Mode', 'guest');

  res.json({
    authenticated: true,
    mode: 'guest',
    cmdr: 'Guest Pilot',
    message: 'Guest mode activated'
  });
});

// GET /auth/logout - Stub logout
router.get('/logout', (req, res) => {
  res.setHeader('X-Elite-Mode', 'guest');

  res.json({
    authenticated: false,
    mode: 'guest',
    message: 'Logged out (guest mode)'
  });
});

export default router;
