# Suraksha Yatra - Technical Architecture Documentation

## 🚀 Project Overview

Suraksha Yatra is a comprehensive safety and emergency response platform designed to enhance personal security through real-time monitoring, AI-powered analytics, and blockchain-verified incident reporting. The system provides 24/7 protection with intelligent threat detection and emergency response coordination.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Dashboard     │    │   AI/ML Engine  │
│ (React Native)  │◄──►│  (React + TS)   │◄──►│    (Python)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Backend API    │
                    │ (Node.js + TS)  │
                    └─────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │    MongoDB      │ │   Blockchain    │ │   Socket.IO     │
    │   (Database)    │ │  (Ethereum)     │ │ (Real-time WS)  │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 📱 Frontend Stack

### Mobile App (React Native + Expo)
- **Framework**: React Native 0.81.4 with Expo SDK 54
- **Navigation**: React Navigation 7 (Native Stack Navigator)
- **State Management**: Zustand for lightweight global state
- **Maps Integration**: React Native Maps with live incident markers
- **Real-time Communication**: Socket.io-client for live updates
- **Location Services**: Expo Location with background tracking
- **Notifications**: Expo Notifications with push notification support
- **Security**: Expo SecureStore for token management

**Key Features:**
- Real-time location tracking with geofencing
- Emergency SOS button with one-tap alert
- Live incident map with clustering
- Push notifications for safety alerts
- Offline capability with data sync

### Admin Dashboard (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Components**: Custom component library with consistent theming
- **Maps**: Leaflet.js for interactive incident visualization
- **Real-time Updates**: Socket.io for live incident monitoring
- **Charts**: Custom analytics components for data visualization

**Key Features:**
- Real-time incident monitoring dashboard
- User management and role-based access control
- Interactive maps with incident clustering
- Analytics and reporting tools
- Emergency response coordination

## 🔧 Backend Stack

### Core API (Node.js + TypeScript)
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Real-time**: Socket.IO for WebSocket connections
- **Validation**: Zod for runtime type checking
- **Testing**: Jest with comprehensive test coverage

**API Endpoints:**
```
/api/auth/*          - Authentication & authorization
/api/panic/*         - Emergency alert management
/api/incidents/*     - Incident reporting & tracking
/api/location/*      - Real-time location services
/api/user/*          - User profile management
/api/emergency-contacts/* - Contact management
```

### AI/ML Service (Python)
- **Framework**: Flask for REST API
- **ML Libraries**: Scikit-learn, TensorFlow, Pandas, NumPy
- **Database**: MongoDB with PyMongo
- **Geospatial**: Geopy for location analysis
- **Deployment**: Containerized with Docker

**AI Capabilities:**
- **Risk Prediction**: Route safety scoring based on historical data
- **Anomaly Detection**: Unusual movement pattern identification
- **Pattern Analysis**: Incident trend analysis and hotspot detection
- **Predictive Analytics**: Threat level assessment

### Blockchain Service (Ethereum/Polygon)
- **Platform**: Ethereum-compatible (Polygon for lower fees)
- **Smart Contracts**: Solidity for immutable record keeping
- **Web3 Integration**: Ethers.js for blockchain interaction
- **IPFS**: Distributed storage for metadata
- **Development**: Hardhat for smart contract development

**Blockchain Features:**
- **Digital Identity**: Tamper-proof user verification
- **Incident Registry**: Immutable incident logging
- **Reputation System**: Community-based trust scoring
- **Audit Trail**: Complete incident history tracking

## 🗄️ Data Layer

### MongoDB Database Schema
```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  name: String,
  hashedPassword: String,
  role: "user" | "admin" | "emergency_responder",
  profile: {
    phoneNumber: String,
    emergencyContacts: Array,
    preferences: Object
  },
  createdAt: Date,
  updatedAt: Date
}

// Incidents Collection
{
  _id: ObjectId,
  type: "accident" | "crime" | "medical" | "fire" | "other",
  severity: "low" | "medium" | "high" | "critical",
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  description: String,
  userId: ObjectId,
  status: "active" | "resolved" | "investigating",
  verificationLevel: Number,
  createdAt: Date
}

// PanicAlerts Collection
{
  _id: ObjectId,
  userId: ObjectId,
  location: {
    type: "Point", 
    coordinates: [longitude, latitude]
  },
  timestamp: Date,
  acknowledged: Boolean,
  responseTime: Number,
  emergencyContactsNotified: Array
}
```

### Real-time Data Flow
1. **Location Updates**: Mobile app → Backend → Dashboard (via WebSocket)
2. **Panic Alerts**: Mobile app → Backend → AI Analysis → Emergency Contacts + Dashboard
3. **Incident Reports**: Any source → Blockchain verification → Database → Real-time updates

## 🔐 Security Architecture

### Authentication & Authorization
- **Multi-layer Security**: JWT access tokens + refresh tokens
- **Role-based Access Control**: User, Admin, Emergency Responder roles
- **Token Rotation**: Automatic refresh with secure httpOnly cookies
- **Rate Limiting**: API endpoint protection against abuse

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **PII Handling**: Location data anonymized for analytics
- **Blockchain Integrity**: Immutable audit trail for critical events
- **Secure Storage**: Mobile app uses device secure storage

### Privacy Measures
- **Data Minimization**: Only collect necessary location data
- **User Consent**: Explicit permissions for location tracking
- **Right to Deletion**: GDPR-compliant data removal
- **Anonymization**: Analytics use aggregated, anonymized data

## 🌐 Real-time Communication

### WebSocket Architecture
```
Mobile App ──┐
              │
Dashboard ────┼──► Socket.IO Server ──► Event Broadcasting
              │                          │
AI Service ───┘                          ├─► Incident Updates
                                         ├─► Location Updates
                                         ├─► Panic Alerts
                                         └─► Status Changes
```

### Event Types
- `incident`: New incident reported
- `panic_alert`: Emergency SOS triggered
- `location_update`: User location changed
- `alert_acknowledged`: Emergency response confirmed
- `incident_resolved`: Incident status updated

## 🤖 AI/ML Pipeline

### Data Processing Flow
```
Raw Location Data → Feature Engineering → ML Models → Risk Scores
      │                     │                │           │
      └─► Pattern Analysis ─┘                └─► Alerts ─┘
```

### Machine Learning Models
1. **Route Risk Predictor**: 
   - Input: GPS coordinates, time, historical incidents
   - Output: Safety score (0-100)
   - Algorithm: Random Forest Classifier

2. **Anomaly Detector**:
   - Input: Movement patterns, speed, location changes
   - Output: Anomaly confidence score
   - Algorithm: Isolation Forest

3. **Pattern Analyzer**:
   - Input: Historical incident data
   - Output: Trend analysis and hotspot identification
   - Algorithm: DBSCAN clustering + Time series analysis

## 🚀 Deployment & DevOps

### Development Environment
```bash
# Frontend Development
npm run dev          # Dashboard development server
expo start          # Mobile app development

# Backend Development  
npm run dev         # Node.js API with hot reload
python app.py       # AI/ML service
npx hardhat node    # Local blockchain

# Database
mongod             # MongoDB local instance
```

### Production Deployment
- **Mobile App**: Expo Application Services (EAS) for iOS/Android builds
- **Web Dashboard**: Vercel/Netlify for static hosting
- **Backend API**: AWS EC2/Docker containers with load balancing
- **Database**: MongoDB Atlas with replica sets
- **AI Service**: AWS Lambda/EC2 with auto-scaling
- **Blockchain**: Polygon mainnet for production contracts

### Monitoring & Analytics
- **Error Tracking**: Sentry for real-time error monitoring
- **Performance**: Custom analytics dashboard for response times
- **Logs**: Centralized logging with ELK stack
- **Metrics**: Prometheus + Grafana for system monitoring

## 📊 Performance Specifications

### Response Times
- **API Endpoints**: < 200ms average response time
- **Real-time Updates**: < 100ms WebSocket latency
- **ML Predictions**: < 500ms for risk analysis
- **Mobile App**: < 2s cold start time

### Scalability
- **Concurrent Users**: 10,000+ simultaneous connections
- **Database**: Horizontal scaling with MongoDB sharding
- **API**: Auto-scaling based on CPU/memory usage
- **WebSocket**: Redis cluster for connection management

### Reliability
- **Uptime**: 99.9% availability target
- **Data Backup**: Automated daily backups with point-in-time recovery
- **Failover**: Multi-region deployment with automatic failover
- **Testing**: 80%+ code coverage with automated testing

## 🔮 Future Enhancements

### Planned Features
- **IoT Integration**: Smart device connectivity (wearables, sensors)
- **Advanced AI**: Computer vision for incident detection
- **Multi-language**: Internationalization support
- **Offline Mode**: Enhanced offline functionality with sync
- **Social Features**: Community safety reporting and verification

### Technology Roadmap
- **Migration to React Native 0.73+**: Performance improvements
- **GraphQL Integration**: More efficient data fetching
- **Microservices**: Service decomposition for better scalability
- **Edge Computing**: Reduced latency with edge deployment
- **5G Optimization**: Enhanced real-time capabilities

---

## 🛠️ Development Setup

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install Python 3.9+
python --version

# Install MongoDB
mongod --version

# Install Expo CLI
npm install -g @expo/cli
```

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd Suraksha-Yatra-SIH25

# Backend setup
cd backend
npm install
npm run dev

# Mobile app setup  
cd ../mobile-app
npm install
expo start

# Dashboard setup
cd ../dashboard  
npm install
npm run dev

# AI service setup
cd ../ai-service
pip install -r requirements.txt
python app.py

# Blockchain setup
cd ../blockchain-service
npm install
npx hardhat node
```

### Environment Configuration
Create `.env` files in each service directory with required environment variables. See individual README files for specific configuration details.

---

*This documentation provides a comprehensive overview of the Suraksha Yatra platform's technical architecture. For detailed API documentation, deployment guides, and development tutorials, refer to the individual service documentation in each directory.*