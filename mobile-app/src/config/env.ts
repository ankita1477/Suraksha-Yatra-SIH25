import Constants from 'expo-constants';

export interface AppConfig {
  // Environment
  nodeEnv: string;
  appName: string;
  appVersion: string;
  appEnvironment: string;

  // API Configuration
  apiBaseUrl: string;
  wsBaseUrl: string;

  // Feature Flags
  enableLocationTracking: boolean;
  enablePushNotifications: boolean;
  enableAnalytics: boolean;
  enableDebugLogs: boolean;

  // Location Services
  locationUpdateInterval: number;
  locationDistanceFilter: number;
  backgroundLocationEnabled: boolean;

  // Notification Configuration
  notificationSoundEnabled: boolean;
  notificationVibrationEnabled: boolean;

  // Security
  tokenRefreshInterval: number;
  sessionTimeout: number;

  // Map Configuration
  defaultMapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  incidentFetchRadius: number;

  // Emergency Configuration
  emergencyContactLimit: number;
  panicButtonCooldown: number;

  // Development Tools
  enableReactDevTools: boolean;
  enableFlipper: boolean;
}

/**
 * Get configuration value with fallback
 */
function getConfigValue(key: string, defaultValue: any, type: 'string' | 'number' | 'boolean' = 'string'): any {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key];
  
  if (value === undefined || value === null) {
    return defaultValue;
  }

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : parseInt(value, 10) || defaultValue;
    case 'boolean':
      return typeof value === 'boolean' ? value : value === 'true';
    default:
      return value;
  }
}

/**
 * Load and validate app configuration
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    // Environment
    nodeEnv: getConfigValue('NODE_ENV', 'development'),
    appName: getConfigValue('APP_NAME', 'Suraksha Yatra'),
    appVersion: getConfigValue('APP_VERSION', '1.0.0'),
    appEnvironment: getConfigValue('APP_ENVIRONMENT', 'development'),

    // API Configuration
    apiBaseUrl: getConfigValue('API_BASE_URL', 'http://localhost:3000/api'),
    wsBaseUrl: getConfigValue('WS_BASE_URL', 'ws://localhost:3000'),

    // Feature Flags
    enableLocationTracking: getConfigValue('ENABLE_LOCATION_TRACKING', true, 'boolean'),
    enablePushNotifications: getConfigValue('ENABLE_PUSH_NOTIFICATIONS', true, 'boolean'),
    enableAnalytics: getConfigValue('ENABLE_ANALYTICS', false, 'boolean'),
    enableDebugLogs: getConfigValue('ENABLE_DEBUG_LOGS', false, 'boolean'),

    // Location Services
    locationUpdateInterval: getConfigValue('LOCATION_UPDATE_INTERVAL', 30000, 'number'),
    locationDistanceFilter: getConfigValue('LOCATION_DISTANCE_FILTER', 100, 'number'),
    backgroundLocationEnabled: getConfigValue('BACKGROUND_LOCATION_ENABLED', true, 'boolean'),

    // Notification Configuration
    notificationSoundEnabled: getConfigValue('NOTIFICATION_SOUND_ENABLED', true, 'boolean'),
    notificationVibrationEnabled: getConfigValue('NOTIFICATION_VIBRATION_ENABLED', true, 'boolean'),

    // Security
    tokenRefreshInterval: getConfigValue('TOKEN_REFRESH_INTERVAL', 1800000, 'number'), // 30 minutes
    sessionTimeout: getConfigValue('SESSION_TIMEOUT', 3600000, 'number'), // 1 hour

    // Map Configuration
    defaultMapRegion: {
      latitude: getConfigValue('DEFAULT_MAP_REGION_LATITUDE', 28.6139, 'number'),
      longitude: getConfigValue('DEFAULT_MAP_REGION_LONGITUDE', 77.2090, 'number'),
      latitudeDelta: getConfigValue('DEFAULT_MAP_ZOOM_DELTA', 0.01, 'number'),
      longitudeDelta: getConfigValue('DEFAULT_MAP_ZOOM_DELTA', 0.01, 'number'),
    },
    incidentFetchRadius: getConfigValue('INCIDENT_FETCH_RADIUS', 5000, 'number'),

    // Emergency Configuration
    emergencyContactLimit: getConfigValue('EMERGENCY_CONTACT_LIMIT', 10, 'number'),
    panicButtonCooldown: getConfigValue('PANIC_BUTTON_COOLDOWN', 5000, 'number'),

    // Development Tools
    enableReactDevTools: getConfigValue('ENABLE_REACT_DEVTOOLS', false, 'boolean'),
    enableFlipper: getConfigValue('ENABLE_FLIPPER', false, 'boolean'),
  };

  // Validate critical configuration
  if (!config.apiBaseUrl) {
    throw new Error('API_BASE_URL is required');
  }

  if (!config.wsBaseUrl) {
    throw new Error('WS_BASE_URL is required');
  }

  return config;
}

/**
 * Get current app configuration
 */
export const config = loadConfig();

/**
 * Check if app is in development mode
 */
export const isDevelopment = config.nodeEnv === 'development';

/**
 * Check if app is in production mode
 */
export const isProduction = config.nodeEnv === 'production';

/**
 * Check if app is in staging mode
 */
export const isStaging = config.nodeEnv === 'staging';

/**
 * Get environment-specific log level
 */
export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  if (config.enableDebugLogs) {
    return 'debug';
  }
  
  if (isDevelopment || isStaging) {
    return 'info';
  }
  
  return 'warn';
}

/**
 * Log messages based on configuration
 */
export function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
  if (!config.enableDebugLogs && level === 'debug') {
    return;
  }

  const logMethod = console[level] || console.log;
  logMethod(`[${config.appEnvironment.toUpperCase()}] ${message}`, ...args);
}

/**
 * Get API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  return `${config.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

/**
 * Get WebSocket URL
 */
export function getWebSocketUrl(path: string = ''): string {
  return `${config.wsBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig): boolean {
  return Boolean(config[feature]);
}

export default {
  config,
  loadConfig,
  isDevelopment,
  isProduction,
  isStaging,
  getLogLevel,
  log,
  getApiUrl,
  getWebSocketUrl,
  isFeatureEnabled,
};