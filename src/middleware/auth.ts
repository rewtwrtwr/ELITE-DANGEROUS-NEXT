/**
 * Authentication Middleware - JWT Verification
 *
 * Features:
 * - Verify JWT tokens using JWKS
 * - Add user to request object
 * - Handle token expiration
 */

import { Request, Response, NextFunction } from 'express';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import type { FrontierProfile } from '../types/auth.js';

const JWKS_URI = `${process.env.FRONTIER_AUTH_URL || 'https://auth.frontierstore.net/auth/realms/fsc'}/protocol/openid-connect/certs`;

// JWKS client for verifying JWT
const client = jwksClient.default({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: FrontierProfile;
    }
  }
}

/**
 * Get signing key from JWKS
 */
function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        logger.error('Auth', 'Failed to get signing key', {
          error: err instanceof Error ? err.message : String(err),
        });
        reject(err);
        return;
      }

      const signingKey = key?.getPublicKey?.();
      if (!signingKey) {
        reject(new Error('Unable to get signing key'));
        return;
      }

      resolve(signingKey);
    });
  });
}

/**
 * Verify and decode JWT token
 */
async function verifyToken(token: string): Promise<FrontierProfile> {
  // First, decode without verification to get kid
  const decoded = jwt.decode(token, { complete: true }) as
    (jwt.JwtPayload & { header: { kid: string } }) | null;

  if (!decoded || !decoded.header.kid) {
    throw new Error('Invalid token format');
  }

  // Get signing key
  const signingKey = await getSigningKey(decoded.header.kid);

  // Verify token
  const verified = jwt.verify(token, signingKey, {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    complete: false,
  }) as jwt.JwtPayload & FrontierProfile;

  return verified;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accessToken = req.cookies.access_token;
  
  if (!accessToken) {
    logger.warn('Auth', 'Access denied: No token');
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }
  
  try {
    // Verify and decode token
    const user = await verifyToken(accessToken);
    req.user = user;
    logger.debug('Auth', 'User authenticated', { userId: user.sub });
    next();
  } catch (error) {
    const err = error as Error;
    
    if (err.name === 'TokenExpiredError') {
      logger.warn('Auth', 'Token expired');
      res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      });
    } else {
      logger.warn('Auth', 'Invalid token', {
        error: err.message,
      });
      res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid access token',
      });
    }
  }
}

/**
 * Middleware to optionally authenticate (doesn't block if no token)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accessToken = req.cookies.access_token;
  
  if (!accessToken) {
    return next();
  }
  
  try {
    const user = await verifyToken(accessToken);
    req.user = user;
    logger.debug('Auth', 'Optional auth successful', { userId: user.sub });
  } catch (error) {
    // Ignore errors, continue without auth
    logger.debug('Auth', 'Optional auth failed, continuing without auth');
  }
  
  next();
}
