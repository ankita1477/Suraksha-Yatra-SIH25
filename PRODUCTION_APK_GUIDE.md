# Production APK Build Guide

This guide shows how to build a full production APK that can be shared with anyone for testing.

## ✅ Configuration Complete

The app is now configured to build production APKs:
- `eas.json` → production profile builds APK (not AAB)
- `app.json` → android.versionCode set to 1
- Backend URLs hardcoded to production

## 🚀 Build Production APK

**Prerequisites:**
1. EAS CLI installed: `npm install -g eas-cli`
2. Logged into Expo: `eas login`
3. Project setup: `eas build:configure` (if first time)

**Build Command:**
```bash
cd mobile-app
eas build --platform android --profile production
```

**Expected Output:**
- Build will take 5-15 minutes
- Download link will appear in terminal
- APK will be ~50-100MB
- Signed with auto-generated release keystore

## 📱 APK Distribution

### Option 1: Direct Download
1. Copy the download link from EAS build output
2. Share link with testers
3. Testers download and install APK directly

### Option 2: File Sharing
1. Download APK to your computer
2. Upload to Google Drive, Dropbox, etc.
3. Share download link

### Option 3: QR Code
1. Use EAS build QR code from terminal
2. Testers scan QR code to download

## 🔒 Installation Requirements

**For Testers:**
- Android device (5.0+)
- Enable "Install from unknown sources" or "Allow from this source"
- ~100MB free storage

**Installation Steps for Testers:**
1. Download APK file
2. Open Downloads folder
3. Tap APK file
4. Allow installation when prompted
5. App will appear in app drawer

## 🧪 Testing Checklist

**Basic Functions:**
- [ ] App opens without crashing
- [ ] Login/Register works
- [ ] Location permission granted
- [ ] Emergency contacts can be added
- [ ] Panic button appears and works
- [ ] Map loads correctly

**Connectivity Test:**
- [ ] Long-press diagnostics on login screen
- [ ] Backend and AI show "OK" status
- [ ] If FAIL, share screenshot for debugging

## 📝 Build Versioning

**For Future Builds:**
1. Increment `versionCode` in `app.json`:
   ```json
   "versionCode": 2
   ```
2. Optionally update `version` string:
   ```json
   "version": "1.0.1"
   ```
3. Rebuild with same command

**Version History:**
- v1.0.0 (versionCode: 1) - Initial production release

## 🚨 Troubleshooting

**Build Fails:**
- Check Expo account has build minutes
- Verify project ownership
- Try: `eas build:configure` then rebuild

**APK Won't Install:**
- Enable "Unknown sources" in Android settings
- Check device storage space
- Try installing via USB debugging

**App Crashes:**
- Check if device meets Android 5.0+ requirement
- Look for permission dialog blocks
- Test on different device

## 🔄 Quick Update Workflow

**For Hot Fixes:**
```bash
# 1. Make code changes
# 2. Update version
# 3. Rebuild
eas build --platform android --profile production
# 4. Share new download link
```

**For Major Updates:**
- Consider incrementing main version number
- Update app store listings if planning store release
- Test thoroughly before distribution

## 📤 Ready to Share

Your production APK build command:
```bash
cd mobile-app
eas build --platform android --profile production
```

The resulting APK will be a full standalone app that works on any Android device without requiring Expo Go or development tools.