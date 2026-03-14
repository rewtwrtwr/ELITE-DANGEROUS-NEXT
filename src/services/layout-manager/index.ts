/**
 * Layout Manager Service
 * 
 * Automatically switches keyboard layout based on active window/process.
 * Integrates LayoutManager Pro functionality into ELITE-DANGEROUS-NEXT.
 */

export { LayoutManagerService } from './LayoutManagerService.js';
export { layoutManagerRoutes, initializeLayoutManagerRoutes } from './routes/layout-manager.routes.js';
export type { LayoutConfig, ProcessConfig } from './types.js';
