/**
 * Elite Dangerous NEXT Theme
 * EDCoPilot-inspired flat design with orange accents
 * 
 * Design principles:
 * - Pure black background (#000000)
 * - Orange accent (#ff8c00) for active states
 * - No shadows, no rounded corners
 * - Monospace fonts for content
 */

export const theme = {
  colors: {
    // Backgrounds - pure black
    background: '#000000',
    backgroundSecondary: '#0d0d0d',
    backgroundTertiary: '#141414',
    backgroundHover: '#1a1a1a',
    
    // Accent - orange (EDCoPilot style)
    accent: '#ff8c00',
    accentHover: '#ff9f1c',
    accentActive: '#cc7000',
    
    // Text
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    textMuted: '#606060',
    
    // Status colors
    success: '#00ff88',
    warning: '#ff8c00',
    error: '#ff4444',
    info: '#00bfff',
    
    // Borders - subtle, not prominent
    border: '#2a2a2a',
    borderHover: '#3a3a3a',
    
    // Category accent (all orange for EDCoPilot consistency)
    category: '#ff8c00',
  },
  
  fonts: {
    primary: "'Segoe UI', 'Arial', sans-serif",
    heading: "'Segoe UI', 'Arial', sans-serif",
    mono: "'Consolas', 'JetBrains Mono', 'Courier New', monospace",
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  
  borderRadius: {
    sm: '0',
    md: '0',
    lg: '0',
  },
  
  transitions: {
    fast: '0.1s ease',
    normal: '0.15s ease',
    slow: '0.2s ease',
  },
};

export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontFamily: theme.fonts.primary,
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: '18px',
    fontWeight: 600,
    color: theme.colors.accent,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  
  titleSecondary: {
    fontFamily: theme.fonts.primary,
    fontSize: '12px',
    color: theme.colors.textMuted,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  
  navButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textMuted,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: theme.transitions.normal,
  },
  
  navButtonActive: {
    backgroundColor: theme.colors.accent,
    color: '#000000',
  },
  
  primaryButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.accent,
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    color: '#000000',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: theme.transitions.normal,
  },
  
  primaryButtonActive: {
    transform: 'scale(0.98)',
  },
  
  secondaryButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textSecondary,
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: theme.transitions.normal,
  },
  
  input: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.backgroundTertiary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.text,
    fontSize: '13px',
    outline: 'none',
    transition: theme.transitions.normal,
  },
  
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  
  cardHover: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  
  mono: {
    fontFamily: theme.fonts.mono,
    fontSize: '12px',
  },
  
  label: {
    fontSize: '11px',
    color: theme.colors.textMuted,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  
  value: {
    fontSize: '13px',
    color: theme.colors.text,
    fontWeight: 600,
  },
  
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
    backgroundColor: theme.colors.background,
    borderBottom: `1px solid ${theme.colors.border}`,
    fontSize: '12px',
  },
  
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  
  liveIndicatorActive: {
    color: theme.colors.success,
  },
  
  liveIndicatorInactive: {
    color: theme.colors.textMuted,
  },
  
  liveDot: {
    width: '6px',
    height: '6px',
  },
  
  gameStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  
  gameStatusRunning: {
    color: theme.colors.success,
  },
  
  gameStatusStopped: {
    color: theme.colors.textMuted,
  },
  
  tabButton: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: `${theme.borderRadius.sm} ${theme.borderRadius.sm} 0 0`,
    color: theme.colors.textMuted,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: theme.transitions.normal,
  },
  
  tabButtonActive: {
    backgroundColor: theme.colors.accent,
    color: '#000000',
  },
  
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: '11px',
    fontWeight: 600,
    color: theme.colors.accent,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: theme.spacing.md,
  },
  
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  
  statLabel: {
    fontSize: '10px',
    color: theme.colors.textMuted,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  
  statValue: {
    fontFamily: theme.fonts.mono,
    fontSize: '14px',
    fontWeight: 600,
  },
  
  sidebar: {
    width: '60px',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRight: `1px solid ${theme.colors.border}`,
    padding: `${theme.spacing.sm} 0`,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  
  sidebarIconButton: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.textMuted,
    fontSize: '20px',
    cursor: 'pointer',
    transition: theme.transitions.normal,
  },
  
  sidebarIconButtonActive: {
    backgroundColor: theme.colors.accent,
    color: '#000000',
  },
  
  content: {
    flex: 1,
    padding: 0,
    overflowY: 'auto' as const,
  },
  
  eventRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    fontFamily: theme.fonts.mono,
    fontSize: '12px',
  },
  
  eventRowHover: {
    backgroundColor: theme.colors.backgroundHover,
  },
  
  eventTimestamp: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  
  eventType: {
    color: theme.colors.accent,
    fontWeight: 600,
    fontFamily: theme.fonts.mono,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
  },
  
  eventData: {
    color: theme.colors.textSecondary,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  
  footer: {
    padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
    borderTop: `2px solid ${theme.colors.accent}`,
    textAlign: 'center' as const,
    fontSize: '11px',
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.backgroundSecondary,
  },
};

export default theme;
