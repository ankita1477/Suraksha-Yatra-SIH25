// Design tokens and theming utilities for consistent styling
export const palette = {
  background: '#0b1220',
  surface: '#111827',
  surfaceAlt: 'rgba(17,24,39,0.7)',
  border: 'rgba(71,85,105,0.35)',
  borderStrong: 'rgba(148,163,184,0.35)',
  textPrimary: '#e5e7eb',
  textSecondary: '#94a3b8',
  accent: '#3b82f6',
  accentAlt: '#6366f1',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#0ea5e9',
  overlay: 'rgba(15,23,42,0.6)',
};

export const spacing = (factor: number) => factor * 4;

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  glowDanger: {
    shadowColor: palette.danger,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  glowAccent: {
    shadowColor: palette.accent,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  }
};

export const typography = {
  heading: { fontSize: 20, fontWeight: '700', color: palette.textPrimary },
  subheading: { fontSize: 14, fontWeight: '600', color: palette.textSecondary },
  body: { fontSize: 14, color: palette.textSecondary },
  label: { fontSize: 12, fontWeight: '600', color: palette.textSecondary },
};

export const theme = {
  palette,
  spacing,
  radii,
  shadows,
  typography,
};

export type Theme = typeof theme;

export default theme;
