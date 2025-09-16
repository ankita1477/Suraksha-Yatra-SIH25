# Suraksha Yatra Mobile App

A comprehensive safety and emergency response mobile application built with React Native and Expo.

## Features

### 🆘 Emergency Response
- **Panic Button**: One-tap emergency alert with location sharing
- **SOS Alerts**: Send emergency signals to contacts and authorities
- **Real-time Location Tracking**: Continuous background location monitoring
- **Emergency Contacts**: Manage and notify emergency contacts instantly

### 🗺️ Safety Mapping
- **Live Incident Map**: View real-time safety incidents in your area
- **Interactive Markers**: Detailed information about incidents and alerts
- **Safe Zone Tracking**: Monitor entry/exit from designated safe zones
- **Location Sharing**: Share your location with trusted contacts

### 🔔 Smart Notifications
- **Emergency Alerts**: High-priority notifications for critical situations
- **Incident Notifications**: Alerts about nearby safety incidents
- **Location Confirmations**: Notifications when location is shared
- **Customizable Settings**: Control notification types and preferences

### 👥 Contact Management
- **Emergency Contacts**: Add, edit, and manage emergency contacts
- **Contact Verification**: Test contact reachability
- **Priority Contacts**: Set primary emergency contacts
- **Bulk Notifications**: Send alerts to all active contacts

## Technical Stack

- **Framework**: React Native with Expo SDK
- **Navigation**: React Navigation 6
- **State Management**: React Hooks + Context
- **Maps**: React Native Maps
- **Notifications**: Expo Notifications
- **Location**: Expo Location with background tasks
- **Storage**: Expo SecureStore + AsyncStorage
- **HTTP Client**: Axios
- **Real-time**: Socket.io

## Architecture

```
src/
├── config/           # Environment configuration
├── navigation/       # Navigation setup and types
├── screens/          # Screen components
│   ├── auth/         # Authentication screens
│   └── main/         # Main app screens
├── services/         # Business logic and API calls
├── utils/            # Utility functions
└── state/            # State management
```

## Installation

1. **Prerequisites**
   ```bash
   npm install -g expo-cli
   npm install -g eas-cli
   ```

2. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.development` to `.env`
   - Update API endpoints and configuration

4. **Start Development Server**
   ```bash
   npm start
   ```

## Environment Configuration

The app supports multiple environments with different configurations:

- **Development** (`.env.development`): Local development with debug features
- **Staging** (`.env.staging`): Testing environment with production-like setup
- **Production** (`.env.production`): Live production environment

### Key Configuration Options

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
WS_BASE_URL=ws://localhost:3000

# Feature Flags
ENABLE_LOCATION_TRACKING=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_ANALYTICS=false

# Location Services
LOCATION_UPDATE_INTERVAL=30000
LOCATION_DISTANCE_FILTER=100
BACKGROUND_LOCATION_ENABLED=true
```

## Core Services

### Location Service
- Foreground and background location tracking
- Anomaly detection integration
- Continuous updates to backend
- Permission management

```typescript
import { startLocationTracking, stopLocationTracking } from './services/locationService';

// Start tracking with callback
await startLocationTracking((location, response) => {
  console.log('Location updated:', location.coords);
  if (response.anomaly) {
    // Handle anomaly detection
  }
});
```

### Notification Service
- Push notification registration
- Local notification scheduling
- Emergency alerts
- Settings management

```typescript
import { sendEmergencyNotification } from './services/notificationService';

// Send emergency notification
await sendEmergencyNotification('panic', {
  latitude: 28.6139,
  longitude: 77.2090
});
```

### Emergency Contacts Service
- CRUD operations for contacts
- Location sharing
- Emergency alerts
- Contact validation

```typescript
import { sendLocationToContacts } from './services/contactsService';

// Share location with emergency contacts
await sendLocationToContacts({
  latitude: 28.6139,
  longitude: 77.2090,
  timestamp: new Date().toISOString()
});
```

## Screens

### HomeScreen
- Dashboard with quick actions
- Location tracking controls
- Emergency buttons
- Settings access

### MapScreen
- Interactive map with incidents
- Real-time updates via Socket.io
- User location display
- Incident details

### PanicScreen
- Emergency panic button
- Location-aware alerts
- Contact notifications
- Confirmation handling

### EmergencyContactsScreen
- Contact management
- Add/edit/delete functionality
- Test notifications
- Emergency alerts

### NotificationSettingsScreen
- Notification preferences
- Sound and vibration settings
- Test notifications
- History management

## Key Features Implementation

### Real-time Location Tracking
```typescript
// Background location with task manager
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as any;
    // Process location updates
  }
});
```

### Emergency Alerts
```typescript
// Panic button with location
const sendPanicAlert = async () => {
  const location = await getCurrentLocation();
  await sendPanicAlertAPI({
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    timestamp: new Date().toISOString()
  });
  
  // Send local notification
  await sendEmergencyNotification('panic', location.coords);
};
```

### Real-time Map Updates
```typescript
// Socket.io integration for live incidents
useEffect(() => {
  socket.on('new_incident', (incident) => {
    setIncidents(prev => [...prev, incident]);
  });
  
  socket.on('panic_alert', (alert) => {
    setPanicAlerts(prev => [...prev, alert]);
  });
}, []);
```

## Permissions Required

### iOS Info.plist
```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access for emergency response and safety tracking.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access for emergency response and safety tracking.</string>
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>background-processing</string>
</array>
```

### Android Permissions
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

## Build and Deployment

### Development Build
```bash
eas build --platform all --profile development
```

### Production Build
```bash
eas build --platform all --profile production
```

### Submit to App Stores
```bash
eas submit --platform all
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Testing
```bash
npm run test:e2e
```

## Security Considerations

- **Token Management**: Secure storage of authentication tokens
- **Location Privacy**: User consent for location sharing
- **Emergency Contacts**: Encrypted storage of sensitive contact data
- **API Communication**: HTTPS/WSS for all communications

## Performance

- **Background Location**: Optimized for battery efficiency
- **Map Rendering**: Efficient marker clustering
- **Notification Throttling**: Prevents notification spam
- **Network Optimization**: Request batching and caching

## Troubleshooting

### Common Issues

1. **Location Not Working**
   - Check permissions in device settings
   - Verify location services are enabled
   - Test with different accuracy settings

2. **Notifications Not Appearing**
   - Check notification permissions
   - Verify notification settings in app
   - Test with different priority levels

3. **Map Not Loading**
   - Check internet connection
   - Verify API endpoints
   - Check map provider credentials

### Debug Mode

Enable debug logging in environment:
```env
ENABLE_DEBUG_LOGS=true
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@surakshatrava.com
- Documentation: [Wiki](https://github.com/your-org/suraksha-yatra/wiki)
- Issues: [GitHub Issues](https://github.com/your-org/suraksha-yatra/issues)