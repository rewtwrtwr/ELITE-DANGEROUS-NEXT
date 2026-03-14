/**
 * Layout Manager API Routes
 * 
 * REST API endpoints for layout manager configuration.
 */

import { Router, Request, Response } from 'express';
import { LayoutManagerService } from '../LayoutManagerService.js';

let layoutService: LayoutManagerService | null = null;

/**
 * Initialize layout manager routes with service instance
 */
export function initializeLayoutManagerRoutes(service: LayoutManagerService): Router {
  layoutService = service;
  return router;
}

const router = Router();

/**
 * GET /api/v1/layout-manager/status
 * Get current layout manager status
 */
router.get('/status', async (req: Request, res: Response) => {
  if (!layoutService) {
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }

  const status = await layoutService.getStatus();
  res.json(status);
});

/**
 * GET /api/v1/layout-manager/config
 * Get all configured processes
 */
router.get('/config', (req: Request, res: Response) => {
  if (!layoutService) {
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }

  const processes = layoutService.getAllProcesses();
  res.json({ processes });
});

/**
 * POST /api/v1/layout-manager/config
 * Add new process to configuration
 * 
 * Body: { processName: string, language: 'English' | 'Russian' }
 */
router.post('/config', async (req: Request, res: Response) => {
  console.log('[Layout API] POST /config received:', req.body);
  
  if (!layoutService) {
    console.error('[Layout API] Layout service not initialized');
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }

  const { processName, language } = req.body;
  console.log('[Layout API] Adding process:', processName, language);

  if (!processName || !language) {
    return res.status(400).json({ error: 'processName and language are required' });
  }

  if (!['English', 'Russian'].includes(language)) {
    return res.status(400).json({ error: 'Language must be English or Russian' });
  }

  try {
    console.log('[Layout API] Calling layoutService.addProcess...');
    const success = await layoutService.addProcess(processName, language);
    console.log('[Layout API] addProcess result:', success);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to add process (invalid name or duplicate)' });
    }

    res.json({ success: true, message: `Added ${processName} with ${language} layout` });
  } catch (error) {
    console.error('[Layout API] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('already exists')) {
      return res.status(409).json({ error: 'Process already exists' });
    }
    return res.status(500).json({ error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
  }
});

/**
 * PUT /api/v1/layout-manager/config
 * Update existing process configuration (NOT IMPLEMENTED - use delete+add)
 * 
 * Body: { processName: string, language: 'English' | 'Russian' }
 */
router.put('/config', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented - delete and re-add process instead' });
});

/**
 * DELETE /api/v1/layout-manager/config/:processName
 * Remove process from configuration
 */
router.delete('/config/:processName', (req: Request, res: Response) => {
  if (!layoutService) {
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }

  const { processName } = req.params;
  const success = layoutService.removeProcess(processName);

  if (!success) {
    return res.status(404).json({ error: 'Process not found' });
  }

  res.json({ success: true, message: `Removed ${processName}` });
});

/**
 * POST /api/v1/layout-manager/start
 * Start layout monitor
 */
router.post('/start', (req: Request, res: Response) => {
  if (!layoutService) {
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }

  layoutService.start();
  res.json({ success: true, message: 'Layout monitor started' });
});

/**
 * POST /api/v1/layout-manager/stop
 * Stop layout monitor
 */
router.post('/stop', (req: Request, res: Response) => {
  if (!layoutService) {
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }

  layoutService.stop();
  res.json({ success: true, message: 'Layout monitor stopped' });
});

/**
 * POST /api/v1/layout-manager/force-switch
 * Force layout switch (NOT IMPLEMENTED - automatic only)
 */
router.post('/force-switch', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented - layout switching is automatic' });
});

/**
 * GET /api/v1/layout-manager/settings/auto-start
 * Get auto-start setting
 */
router.get('/settings/auto-start', async (_req: Request, res: Response) => {
  const { getAutoStart } = await import('../settings.js');
  const enabled = getAutoStart();
  res.json({ enabled });
});

/**
 * POST /api/v1/layout-manager/settings/auto-start
 * Set auto-start setting
 */
router.post('/settings/auto-start', async (req: Request, res: Response) => {
  const { setAutoStart } = await import('../settings.js');
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be a boolean' });
  }
  
  setAutoStart(enabled);
  res.json({ success: true, enabled });
});

/**
 * GET /api/v1/layout-manager/history
 * Get switch history
 */
router.get('/history', async (req: Request, res: Response) => {
  if (!layoutService) {
    return res.status(503).json({ error: 'Layout manager not initialized' });
  }
  
  const limit = parseInt(req.query.limit as string) || 100;
  
  try {
    const history = await layoutService.getHistory(limit);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history', details: error instanceof Error ? error.message : String(error) });
  }
});

export { router as layoutManagerRoutes };
