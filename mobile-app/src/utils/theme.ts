import { normalize, spacing } from './responsive';

// Color palette - Dark Theme with Bright Cards
export const colors = {
  // Primary colors from design reference
  primary: '#FF95DD', // Pink from image
  primaryDark: '#E679C5',
  primaryLight: '#FFB8E8',
  
  // Modern vibrant colors for cards
  vibrantYellow: '#F8FF7F', // Yellow from image
  vibrantPurple: '#87BEFE', // Light blue/purple from image
  vibrantPink: '#FF95DD', // Pink from image
  darkCharcoal: '#1F1F1F', // Dark from image
  deepBlack: '#000000', // Pure black background like reference
  
  // Background colors - Dark Theme like reference image
  background: '#000000', // Pure black like the reference
  backgroundSecondary: '#1a1a1a',
  surface: '#1F1F1F',
  surfaceSecondary: '#2a2a2a',
  surfaceHighlight: 'rgba(255, 149, 221, 0.1)',
  
  // Text colors - Dark Theme
  text: '#FFFFFF', // White text on dark background
  textSecondary: '#B0B0B0', // Light gray for secondary text
  textMuted: '#808080', // Muted gray
  textInverse: '#000000', // Black text for light cards
  
  // Status colors - Bright and vibrant
  success: '#00E676', // Bright green
  successLight: '#69F0AE',
  warning: '#FFD600', // Bright yellow
  warningLight: '#FFFF8D',
  error: '#FF1744', // Bright red
  errorLight: '#FF5983',
  
  // Border colors - Dark Theme
  border: '#333333',
  borderLight: '#2a2a2a',
  borderAccent: 'rgba(255, 149, 221, 0.3)',
  
  // Special colors
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.6)',
  
  // Modern card colors (bright cards on dark background like reference)
  cardPink: '#FF95DD',
  cardYellow: '#F8FF7F',
  cardPurple: '#87BEFE',
  cardGreen: '#4ECDC4', // Added green card
  cardOrange: '#FFB347', // Added orange card
  cardDark: '#1F1F1F',
  cardDeepDark: '#000000',
  
  // Remove old gradient colors and replace with solid modern colors
  solidColors: {
    vibrantPink: '#FF95DD',
    brightYellow: '#F8FF7F', 
    softBlue: '#87BEFE',
    charcoalGray: '#1F1F1F',
    deepGray: '#313131'
  }
};

// Typography scale - Modern with better weights
export const typography = {
  heading1: {
    fontSize: normalize(32),
    fontWeight: '700' as const,
    lineHeight: normalize(40),
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: normalize(28),
    fontWeight: '700' as const,
    lineHeight: normalize(36),
    letterSpacing: -0.25,
  },
  heading3: {
    fontSize: normalize(24),
    fontWeight: '600' as const,
    lineHeight: normalize(32),
    letterSpacing: -0.25,
  },
  heading4: {
    fontSize: normalize(20),
    fontWeight: '600' as const,
    lineHeight: normalize(28),
  },
  body: {
    fontSize: normalize(16),
    fontWeight: '400' as const,
    lineHeight: normalize(24),
  },
  bodyMedium: {
    fontSize: normalize(16),
    fontWeight: '500' as const,
    lineHeight: normalize(24),
  },
  bodyLarge: {
    fontSize: normalize(18),
    fontWeight: '400' as const,
    lineHeight: normalize(26),
  },
  bodySmall: {
    fontSize: normalize(14),
    fontWeight: '400' as const,
    lineHeight: normalize(20),
  },
  caption: {
    fontSize: normalize(12),
    fontWeight: '500' as const,
    lineHeight: normalize(16),
    letterSpacing: 0.5,
  },
  button: {
    fontSize: normalize(16),
    fontWeight: '600' as const,
    lineHeight: normalize(20),
    letterSpacing: 0.25,
  },
  label: {
    fontSize: normalize(14),
    fontWeight: '600' as const,
    lineHeight: normalize(20),
    letterSpacing: 0.25,
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