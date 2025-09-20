# 🚀 Suraksha Yatra - APK Build Guide for Hackathon

## 📱 Quick APK Build for Demo

### Method 1: EAS Build (Recommended for Hackathon)

1. **Install EAS CLI**:
```bash
npm install -g @expo/eas-cli
```

2. **Login to Expo**:
```bash
eas login
```

3. **Configure EAS Build**:
```bash
cd mobile-app
eas build:configure
```

4. **Build APK for Android**:
```bash
# For development build (faster)
eas build --platform android --profile development

# For production build (for final demo)
eas build --platform android --profile production
```

5. **Download & Share**:
- Build will be available at: https://expo.dev/accounts/[your-username]/projects/suraksha-yatra/builds
- Download the APK and share via Google Drive, WeTransfer, or direct file sharing

### Method 2: Local Build (Alternative)

1. **Install Android Studio & SDK**
2. **Build locally**:
```bash
cd mobile-app
npx expo run:android --variant release
```

## 🔧 Backend Configuration for Demo

### Option A: Use Your Local Backend
1. **Start your backend**:
```bash
cd backend
npm start
```

2. **Find your IP address**:
```bash
# Windows
ipconfig
# Look for your WiFi IP (e.g., 192.168.1.100)

# macOS/Linux
ifconfig
```

3. **Update app.json**:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP_ADDRESS:4000"
    }
  }
}
```

### Option B: Use Runtime API Switcher (Recommended)
Your app already has the runtime API switcher! Users can:
1. Open the app
2. Tap the hidden area (top-right corner 5 times)
3. Enter your backend URL: `http://YOUR_IP_ADDRESS:4000`
4. App will connect to your backend instantly!

## 📤 Sharing with Friends/Judges

### Quick Share Steps:

1. **Build the APK** (using Method 1 above)

2. **Upload to Google Drive**:
   - Create a folder: "Suraksha Yatra - SIH 2025"
   - Upload the APK file
   - Set sharing to "Anyone with the link"

3. **Share the link** with:
   - **Instructions**: "Install this APK to test our safety app"
   - **Backend IP**: Your computer's IP address
   - **Demo credentials**: Create test accounts or provide demo login

### Demo Package Contents:
```
📁 Suraksha Yatra Demo
├── 📱 suraksha-yatra.apk
├── 📄 DEMO_INSTRUCTIONS.md
├── 🔗 Backend URL: http://192.168.1.100:4000
└── 🔑 Test Account: demo@test.com / password123
```

## 🎯 Hackathon Demo Tips

### For Judges/Testers:
1. **Install APK**: Enable "Install from unknown sources"
2. **Connect to WiFi**: Same network as your laptop
3. **Use API Switcher**: Tap 5 times in top-right to set backend URL
4. **Demo Features**:
   - Emergency contacts sync
   - Real-time location tracking
   - AI safety monitoring
   - Panic alert system

### Quick Demo Script:
```
1. "Here's our Suraksha Yatra safety app"
2. Show splash screen with greeting
3. Login/Register demo
4. Show home screen with location tracking
5. Demo emergency contacts
6. Show panic alert feature
7. Explain AI safety monitoring
```

## 🔄 OTA Updates (Post-Hackathon)

For updating the backend URL after sharing APK:

1. **Publish update**:
```bash
npx expo publish
```

2. **Users get updates automatically** when they restart the app

3. **Change backend URL** in app.json and publish again

## 🚨 Troubleshooting

### APK Won't Install:
- Enable "Install from unknown sources" in Android settings
- Check if device has enough storage

### Can't Connect to Backend:
- Ensure phone and laptop are on same WiFi
- Use IP address, not localhost
- Check Windows Firewall settings
- Try the runtime API switcher in the app

### Build Errors:
```bash
# Clear cache and retry
cd mobile-app
npx expo install --fix
npm run android
```

## 📞 Quick Support

If you face issues during the hackathon:
1. Check your WiFi network settings
2. Verify backend is running: `http://YOUR_IP:4000/api/health`
3. Use the app's built-in API switcher
4. Try rebuilding with `eas build`

---

**Good luck with your hackathon presentation! 🏆**