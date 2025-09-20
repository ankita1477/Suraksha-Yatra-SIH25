# Suraksha Dashboard - Vercel Deployment

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/YOUR_USERNAME/suraksha-dashboard)

### Option 2: Manual Deploy

1. **Fork/Clone this repository**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `dashboard` folder as root directory

3. **Environment Variables** (Auto-configured via vercel.json):
   ```
   VITE_API_BASE=https://suraksha-backend-cz74.onrender.com/api
   VITE_API_BASE_URL=https://suraksha-backend-cz74.onrender.com
   VITE_APP_ENV=production
   ```

4. **Deploy Settings**:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Production URLs

- **Dashboard**: https://your-app.vercel.app
- **Backend API**: https://suraksha-backend-cz74.onrender.com
- **AI Service**: https://suraksha-ai-service.onrender.com

## 📋 Features

- 🎯 Real-time incident monitoring
- 🗺️ Interactive maps with Leaflet
- 📊 Analytics and reporting
- 🚨 Panic alert management
- 👥 User management
- 🔒 JWT authentication
- 🤖 AI-powered safety analytics
- 📱 Responsive design

## 🔧 Configuration

The dashboard automatically connects to your production backend. All API calls are proxied through Vercel's rewrites configuration for optimal performance.

## 🚀 Deployment Status

- ✅ Backend deployed on Render
- ✅ AI service deployed on Render  
- 🔄 Dashboard ready for Vercel deployment

## 📞 Support

For deployment issues, check the Vercel dashboard logs or create an issue in the repository.