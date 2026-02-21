/**
 * Not Found Handler Middleware
 *
 * Handles 404 errors for API routes while allowing SPA behavior for static files.
 * - API routes (/api/*, /auth/*) return JSON 404
 * - Other routes pass through to SPA fallback
 */

import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const apiPaths = ['/api', '/auth'];

  // Check if this is an API route that wasn't handled
  if (apiPaths.some(path => req.path.startsWith(path))) {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // For non-API routes, let Express static middleware handle it
  // (will return index.html for SPA fallback)
  next();
}

export default notFoundHandler;
