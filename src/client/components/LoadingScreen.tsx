/**
 * Loading Screen Component
 * Shows progress while loading all events into memory
 * EDCoPilot Terminal Style
 */

import React from "react";

interface LoadingScreenProps {
  progress: number;
  status: string;
  percent: number;
  visible: boolean;
}

const COLORS = {
  bg: '#000000',
  bgSecondary: '#0d0d0d',
  accent: '#ff8c00',
  accentDim: 'rgba(255, 140, 0, 0.3)',
  textMuted: '#6b7280',
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: COLORS.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  },
  icon: {
    fontSize: "48px",
    marginBottom: "20px",
  },
  title: {
    color: COLORS.accent,
    fontSize: "18px",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    marginBottom: "10px",
    textShadow: `0 0 8px ${COLORS.accentDim}`,
  },
  status: {
    color: COLORS.textMuted,
    fontSize: "14px",
    marginBottom: "20px",
    textAlign: "center" as const,
    maxWidth: "400px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  progressBarContainer: {
    width: "300px",
    height: "4px",
    background: COLORS.bgSecondary,
    overflow: "hidden",
    border: "1px solid #1f2937",
  },
  progressBarFill: {
    height: "100%",
    background: COLORS.accent,
    transition: "width 0.3s ease-out",
    boxShadow: `0 0 8px ${COLORS.accentDim}`,
  },
  percent: {
    color: COLORS.accent,
    marginTop: "15px",
    fontSize: "24px",
    fontWeight: "bold" as const,
    fontFamily: "'JetBrains Mono', monospace",
    textShadow: `0 0 8px ${COLORS.accentDim}`,
  },
  subStatus: {
    color: COLORS.textMuted,
    fontSize: "12px",
    marginTop: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  status,
  percent,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.title}>ELITE DANGEROUS NEXT</div>
      <div style={styles.status}>{status}</div>
      <div style={styles.progressBarContainer}>
        <div
          style={{
            ...styles.progressBarFill,
            width: `${percent}%`,
          }}
        />
      </div>
      <div style={styles.percent}>{percent.toFixed(1)}%</div>
      <div style={styles.subStatus}>
        {progress.toLocaleString()} events loaded
      </div>
    </div>
  );
};

export default LoadingScreen;
