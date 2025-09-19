import { normalize, spacing } from './responsive';

// Color palette - Dark Theme
export const colors = {
  // Primary colors
  primary: '#ff4d4f',
  primaryDark: '#dc2626',
  primaryLight: '#ff7875',
  
  // Background colors - Dark Theme
  background: '#0d1117',
  backgroundSecondary: '#161b22',
  surface: '#21262d',
  surfaceSecondary: '#30363d',
  surfaceHighlight: 'rgba(56, 139, 253, 0.1)',
  
  // Text colors - Dark Theme
  text: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  textInverse: '#24292f',
  
  // Status colors
  success: '#238636',
  successLight: '#2ea043',
  warning: '#d29922',
  warningLight: '#fb8500',
  error: '#da3633',
  errorLight: '#f85149',
  
  // Border colors - Dark Theme
  border: '#30363d',
  borderLight: '#21262d',
  borderAccent: '#388bfd26',
  
  // Special colors
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(13, 17, 23, 0.8)',
  
  // Gradient colors for dark theme
  gradientPrimary: ['#1f2937', '#374151', '#4b5563'],
  gradientSecondary: ['#7c3aed', '#8b5cf6', '#a78bfa'],
  gradientSuccess: ['#059669', '#10b981', '#34d399'],
  gradientWarning: ['#d97706', '#f59e0b', '#fbbf24'],
  gradientError: ['#dc2626', '#ef4444', '#f87171'],
};

// Typography scale
export const typography = {
  heading1: {
    fontSize: normalize(28),
    fontWeight: '700' as const,
    lineHeight: normalize(34),
  },
  heading2: {
    fontSize: normalize(24),
    fontWeight: '600' as const,
    lineHeight: normalize(30),
  },
  heading3: {
    fontSize: normalize(20),
    fontWeight: '600' as const,
    lineHeight: normalize(26),
  },
  body: {
    fontSize: normalize(16),
    fontWeight: '400' as const,
    lineHeight: normalize(22),
  },
  bodyMedium: {
    fontSize: normalize(16),
    fontWeight: '500' as const,
    lineHeight: normalize(22),
  },
  bodySmall: {
    fontSize: normalize(14),
    fontWeight: '400' as const,
    lineHeight: normalize(20),
  },
  caption: {
    fontSize: normalize(12),
    fontWeight: '400' as const,
    lineHeight: normalize(16),
  },
  button: {
    fontSize: normalize(16),
    fontWeight: '600' as const,
    lineHeight: normalize(20),
  },
};

// Shadow styles
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
};

// Border radius scale
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
};

// Common component styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Glassmorphism styles
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  glassCardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 8,
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
};

export { spacing };