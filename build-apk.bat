@echo off
REM 🚀 Suraksha Yatra - Quick APK Build Script
REM Smart India Hackathon 2025

echo 🛡️  Suraksha Yatra - Building APK for Hackathon Demo
echo ==================================================

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Installing EAS CLI...
    npm install -g @expo/eas-cli
)

REM Navigate to mobile app directory
cd mobile-app

echo 🔧 Setting up EAS build configuration...

REM Login to Expo
echo 🔑 Please login to your Expo account:
call eas login

echo 🏗️  Starting APK build for demo...
echo    This will take a few minutes...

REM Build APK for demo
call eas build --platform android --profile demo --non-interactive

echo ✅ Build started!
echo.
echo 📱 Next steps:
echo 1. Wait for build to complete (5-10 minutes)
echo 2. Download APK from: https://expo.dev
echo 3. Share the APK file with your friends
echo.
echo 🔧 Backend setup:
echo 1. Start your backend: cd ../backend && npm start
echo 2. Find your IP: ipconfig
echo 3. Share IP with friends: http://YOUR_IP:4000
echo.
echo 🎯 Demo ready! Good luck with your hackathon! 🏆

pause