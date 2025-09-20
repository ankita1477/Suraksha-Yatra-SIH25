#!/bin/bash

# 🚀 Suraksha Yatra - Quick APK Build Script
# Smart India Hackathon 2025

echo "🛡️  Suraksha Yatra - Building APK for Hackathon Demo"
echo "=================================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Navigate to mobile app directory
cd mobile-app

echo "🔧 Setting up EAS build configuration..."

# Login to Expo (if not already logged in)
echo "🔑 Please login to your Expo account:"
eas login

echo "🏗️  Starting APK build for demo..."
echo "   This will take a few minutes..."

# Build APK for demo
eas build --platform android --profile demo --non-interactive

echo "✅ Build started!"
echo ""
echo "📱 Next steps:"
echo "1. Wait for build to complete (5-10 minutes)"
echo "2. Download APK from: https://expo.dev"
echo "3. Share the APK file with your friends"
echo ""
echo "🔧 Backend setup:"
echo "1. Start your backend: cd ../backend && npm start"
echo "2. Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)"
echo "3. Share IP with friends: http://YOUR_IP:4000"
echo ""
echo "🎯 Demo ready! Good luck with your hackathon! 🏆"