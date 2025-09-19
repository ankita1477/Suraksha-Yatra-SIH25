import { Dimensions, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define breakpoints for different device sizes
export const DEVICE_SIZES = {
  SMALL: 375,   // iPhone SE, iPhone 12 mini
  MEDIUM: 390,  // iPhone 12, iPhone 13
  LARGE: 428,   // iPhone 12 Pro Max, iPhone 13 Pro Max
  TABLET: 768,  // iPad mini
};

// Check device type
export const isSmallDevice = () => SCREEN_WIDTH <= DEVICE_SIZES.SMALL;
export const isMediumDevice = () => SCREEN_WIDTH > DEVICE_SIZES.SMALL && SCREEN_WIDTH <= DEVICE_SIZES.MEDIUM;
export const isLargeDevice = () => SCREEN_WIDTH > DEVICE_SIZES.MEDIUM && SCREEN_WIDTH <= DEVICE_SIZES.LARGE;
export const isTablet = () => SCREEN_WIDTH > DEVICE_SIZES.TABLET;

// Responsive width based on screen percentage
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height based on screen percentage
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font size
export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base on iPhone 11 width
  const newSize = size * scale;
  
  if (PixelRatio.get() < 2) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// Responsive spacing
export const spacing = {
  xs: isSmallDevice() ? 4 : 6,
  sm: isSmallDevice() ? 8 : 12,
  md: isSmallDevice() ? 12 : 16,
  lg: isSmallDevice() ? 16 : 20,
  xl: isSmallDevice() ? 20 : 24,
  xxl: isSmallDevice() ? 24 : 32,
};

// Safe minimum touch target size (44px recommended by Apple/Google)
export const TOUCH_TARGET_SIZE = 44;

// Get responsive button height
export const getButtonHeight = (): number => {
  if (isSmallDevice()) return 44;
  if (isMediumDevice()) return 48;
  return 52;
};

// Get responsive input height
export const getInputHeight = (): number => {
  if (isSmallDevice()) return 40;
  if (isMediumDevice()) return 44;
  return 48;
};

// Screen dimensions export
export { SCREEN_WIDTH, SCREEN_HEIGHT };