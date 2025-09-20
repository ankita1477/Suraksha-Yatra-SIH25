# 🎯 QUICK APK BUILD FOR HACKATHON

## 🚀 Ready to Build & Share!

Your app is **ready for APK build**! Follow these steps:

### Step 1: Login to Expo
```bash
cd mobile-app
eas login
```
*Create account at expo.dev if you don't have one*

### Step 2: Build APK for Demo
```bash
# Quick demo build (5-10 minutes)
eas build --platform android --profile preview

# OR production build (10-15 minutes)  
eas build --platform android --profile production
```

### Step 3: Download Your APK
1. Go to https://expo.dev/accounts/[your-username]/projects/suraksha-yatra/builds
2. Wait for build to complete
3. Download the APK file
4. **Share with friends!**

## 📱 For Your Friends

### APK Installation:
1. Download APK file
2. Enable "Install from unknown sources" in Android settings
3. Install the APK
4. Open **Suraksha Yatra** app

### Backend Connection:
1. **Start your backend**: 
   ```bash
   cd backend
   npm start
   ```

2. **Find your IP address**:
   ```bash
   ipconfig   # On Windows
   ```
   Look for something like: `192.168.1.100`

3. **In the app, tap 5 times in top-right corner**
4. **Enter your backend URL**: `http://192.168.1.100:4000`
5. **Tap Save** ✅

## 🎮 Demo Features
- ✅ **Time-based greetings** (Good Morning/Afternoon/Evening)
- ✅ **Emergency contacts** (Personal + Public services)  
- ✅ **Real-time location** tracking
- ✅ **AI safety monitoring**
- ✅ **Panic alert** system
- ✅ **Modern dark theme** with vibrant cards
- ✅ **Cross-platform** compatibility

## 📞 Quick Support

### If APK won't install:
- Enable "Unknown sources" in Android Security settings
- Check phone storage space

### If can't connect to backend:
- Ensure phone and laptop on same WiFi
- Use IP address (not localhost)  
- Try the app's API switcher (tap 5 times top-right)

### If build fails:
```bash
npm install
eas build:configure
eas build --platform android --profile preview
```

---

## 🏆 You're Ready for Hackathon!

Your **Suraksha Yatra** app is complete with:
- Modern UI matching design requirements
- Runtime backend configuration
- Emergency services integration  
- AI safety features
- Real-time location tracking

**Just run the build command and share the APK! Good luck! 🎉**