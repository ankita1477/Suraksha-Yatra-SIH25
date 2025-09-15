# 🛡️ Suraksha Yatra - Smart Tourist Safety Monitoring System

<div align="center">
  <img src="https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif" width="200"/>
  <h3>🎯 Keeping Tourists Safe with Tech Magic! ✨</h3>
  <img src="https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif" width="150"/>
</div>

## 📋 Project Overview

**Suraksha Yatra** is our super cool 😎 Smart Tourist Safety Monitoring & Incident Response System built for SIH 2025! Think of it as a digital superhero 🦸‍♂️ that watches over tourists 24/7 using the awesome power of Blockchain, AI, and Mobile tech! 

<img src="https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif" width="300" align="right"/>

We're basically creating a **digital safety net** for travelers - because nobody should have to worry about safety when they're busy making memories! 📸✨

### 🎯 Problem Statement
- **Ministry**: Development of North Eastern Region / Tourism / Home Affairs
- **Category**: Software (Travel & Tourism Safety)  
- **Problem ID**: SIH25-PS-25002

<div align="center">
  <img src="https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif" width="200"/>
  <p><em>"With great code comes great responsibility!" 🕷️</em></p>
</div>

### 🌟 Key Features (aka Our Superpowers!)
- 🆔 **Blockchain-based Digital Tourist ID** *(Tamper-proof like a superhero suit!)*
- 📱 **Mobile App with Panic Button & Geo-fencing** *(Your pocket guardian angel)*
- 🤖 **AI-powered Anomaly Detection** *(Sherlock Holmes meets Iron Man)*
- 🚨 **Real-time Police/Tourism Dashboard** *(Mission Control for safety heroes)*
- 📍 **Location-based Safety Monitoring** *(GPS with superpowers)*
- 👨‍👩‍👧‍👦 **Family Location Sharing** *(Peace of mind for loved ones)*

<div align="center">
  <img src="https://media.giphy.com/media/26tPoyDhjiJ2g7rEs/giphy.gif" width="250"/>
</div>

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Mobile App<br/>React Native with Expo] <--> B[Backend API<br/>Express.js + PostgreSQL]
    C[Dashboard<br/>React.js] <--> B
    B --> D[AI/ML Engine<br/>TensorFlow/Scikit-learn]
    B --> E[Blockchain<br/>Ethereum/Hyperledger]
    
    F[Tourist] --> A
    G[Police/Tourism Officers] --> C
    H[System Admins] --> C
    
    D --> I[Anomaly Detection]
    D --> J[Route Analysis]
    D --> K[Behavioral Patterns]
    
    E --> L[Digital ID Storage]
    E --> M[Tamper-proof Records]
    E --> N[Smart Contracts]
    
    B --> O[Real-time Alerts]
    B --> P[Location Tracking]
    B --> Q[Incident Management]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
```

---

## 🛠️ Technology Stack (Our Arsenal of Awesomeness!)

<div align="center">
  <img src="https://media.giphy.com/media/QssGEmpkyEOhBCb7e1/giphy.gif" width="200"/>
  <p><em>Assembling the Tech Avengers! 🦸‍♀️🦸‍♂️</em></p>
</div>

### 📱 Frontend (Mobile App) - *The Hero in Your Pocket*
- **Framework**: React Native with Expo 🚀 *(Because native is the way!)*
- **Platform**: Android & iOS 📱 *(Double the fun!)*
- **Key Libraries**: 
  - React Navigation 🧭 *(Your app's GPS)*
  - React Native Maps 🗺️ *(See the world!)*
  - AsyncStorage 💾 *(Memory like an elephant)*
  - React Native Geolocation 📍 *(Where are you?)*

### 🖥️ Frontend (Dashboard) - *Command Center Vibes*
- **Framework**: React.js ⚛️ *(The reliable sidekick)*
- **UI Library**: Material-UI / Ant Design 🎨 *(Making it pretty!)*
- **Maps**: Google Maps API / Mapbox 🌍 *(See everything!)*
- **State Management**: Redux Toolkit 🔄 *(Keeping things organized)*

<img src="https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif" width="200" align="right"/>

### ⚙️ Backend - *The Brain Behind the Operation*
- **Framework**: Express.js 🚂 *(Fast and furious)*
- **Database**: PostgreSQL 🐘 *(Never forgets anything)*
- **Authentication**: JWT + OAuth2.0 🔐 *(Fort Knox security)*
- **Real-time**: Socket.io ⚡ *(Faster than The Flash)*
- **API Documentation**: Swagger 📚 *(Documentation that doesn't suck)*

### 🤖 AI/ML - *The Smart Cookie*
- **Framework**: TensorFlow / Scikit-learn 🧠 *(Einstein's digital cousin)*
- **Language**: Python 🐍 *(Sssssuper smart)*
- **Features**: 
  - Anomaly Detection 🕵️ *(Sherlock Holmes mode)*
  - Route Deviation Analysis 🛣️ *(GPS with attitude)*
  - Behavioral Pattern Recognition 👁️ *(Mind reader activated)*

### ⛓️ Blockchain - *The Trustworthy Friend*
- **Platform**: Ethereum (Testnet) / Hyperledger Fabric ⛓️ *(Unbreakable chains)*
- **Smart Contracts**: Solidity 📜 *(Smart as Hermione)*
- **Integration**: Web3.js 🌐 *(Bridging worlds)*
- **Purpose**: Digital ID & Tamper-proof Records 🛡️ *(Bulletproof storage)*

---

## 🚀 Getting Started (Let's Build Something Amazing!)

<div align="center">
  <img src="https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif" width="250"/>
  <p><em>Ready to code like a rockstar? 🎸</em></p>
</div>

### Prerequisites (What You Need in Your Toolkit 🧰)
- Node.js (v16+) 📦 *(The package master)*
- Python (v3.8+) 🐍 *(The snake charmer)*
- PostgreSQL 🐘 *(The memory elephant)*
- Expo CLI 📱 *(Mobile magic wand)*
- Git 🌿 *(Version control ninja)*

### 📦 Installation (The Fun Begins!)

<img src="https://media.giphy.com/media/ZVik7pBtu9dNS/giphy.gif" width="200" align="right"/>

1. **Clone the Repository** 📂
   ```bash
   git clone https://github.com/ankita1477/Suraksha-Yatra-SIH25.git
   cd Suraksha-Yatra-SIH25
   ```
   *🎉 Congratulations! You've got the code!*

2. **Setup Backend** ⚙️
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your database and API keys in .env
   npm run dev
   ```
   *🚀 Backend is ready to rock!*

3. **Setup Mobile App** 📱
   ```bash
   cd mobile-app
   npm install
   expo start
   ```
   *📱 Your mobile app is coming to life!*

4. **Setup Dashboard** 🖥️
   ```bash
   cd dashboard
   npm install
   npm start
   ```
   *💻 Dashboard deployed like a boss!*

5. **Setup AI/ML Engine** 🤖
   ```bash
   cd ai-engine
   pip install -r requirements.txt
   python app.py
   ```
   *🧠 AI is now online and thinking!*

<div align="center">
  <img src="https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif" width="200"/>
  <p><em>You did it! Everything is up and running! 🎊</em></p>
</div>

---

## 📁 Project Structure

```
Suraksha-Yatra-SIH25/
│
├── 📱 mobile-app/              # React Native Expo App
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   └── utils/
│   ├── App.js
│   └── package.json
│
├── 🖥️ dashboard/               # React.js Dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
│
├── ⚙️ backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── server.js
│   └── package.json
│
├── 🤖 ai-engine/              # AI/ML Services
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── app.py
│   └── requirements.txt
│
├── ⛓️ blockchain/              # Smart Contracts
│   ├── contracts/
│   ├── migrations/
│   ├── test/
│   └── truffle-config.js
│
├── 📚 docs/                   # Documentation
├── 🧪 tests/                  # Test files
└── 📋 README.md
```

---

## 🎯 MVP Features Implementation (Our 12-Week Adventure!)

<div align="center">
  <img src="https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif" width="250"/>
  <p><em>Let's build this thing step by step! 🏗️</em></p>
</div>

## ⚡ **6-Day MVP Sprint Plan** (Crunch Time Champions!)

<div align="center">
  <img src="https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif" width="200"/>
  <p><em>From zero to hero in 6 days! 🚀</em></p>
</div>

### 🏃‍♂️ **Day 1: Foundation & Setup** (Setup Squad Assemble!)
**Team Focus**: All hands on deck for project foundation
- **Morning (9-12 PM)**:
  - [ ] **Ankita & Sahil**: Setup Express.js backend + PostgreSQL database
  - [ ] **Juhi & Anchal**: Initialize React Native Expo project with navigation
  - [ ] **Anwesha**: Setup basic Ethereum testnet environment
  - [ ] **Saswat**: Prepare Python environment for AI services
  
- **Afternoon (1-6 PM)**:
  - [ ] **All Team**: Basic authentication system (JWT)
  - [ ] **Sahil**: Database schema design and setup
  - [ ] **Juhi**: Basic mobile app screens (Login, Home, Profile)
  - [ ] **Anchal**: Start React.js dashboard framework

**🎯 End of Day Goal**: Working login system across all platforms

### 📱 **Day 2: Core Mobile App** (Mobile Magic Day!)
**Lead**: Juhi (Mobile) + Anchal (Frontend)
- **Morning**:
  - [ ] **Juhi**: Implement GPS tracking and maps integration
  - [ ] **Juhi**: Add panic button functionality
  - [ ] **Anchal**: Dashboard layout with maps
  - [ ] **Sahil**: Location APIs and real-time endpoints
  
- **Afternoon**:
  - [ ] **Juhi**: Basic geo-fencing implementation
  - [ ] **Anchal**: Real-time alerts display on dashboard
  - [ ] **Ankita**: Integration testing between mobile and backend

**🎯 End of Day Goal**: Mobile app with GPS, panic button, and dashboard showing alerts

### 🆔 **Day 3: Digital ID & Blockchain** (Identity Crisis Solved!)
**Lead**: Anwesha (Blockchain) + Ankita (Integration)
- **Morning**:
  - [ ] **Anwesha**: Smart contract for Digital Tourist ID
  - [ ] **Anwesha**: Deploy contract on Ethereum testnet
  - [ ] **Sahil**: Blockchain integration APIs
  - [ ] **Juhi**: User registration with blockchain ID generation
  
- **Afternoon**:
  - [ ] **Ankita**: Connect mobile app to blockchain APIs
  - [ ] **Anchal**: Display Digital ID on dashboard
  - [ ] **All**: Testing blockchain ID creation flow

**🎯 End of Day Goal**: Working blockchain-based Digital Tourist ID system

### 🤖 **Day 4: AI/ML Intelligence** (Brain Power Activated!)
**Lead**: Saswat (AI/ML) + Backend Integration
- **Morning**:
  - [ ] **Saswat**: Basic anomaly detection algorithms (inactivity, location loss)
  - [ ] **Saswat**: Route deviation detection logic
  - [ ] **Sahil**: AI service APIs and integration endpoints
  - [ ] **Ankita**: Connect AI alerts to notification system
  
- **Afternoon**:
  - [ ] **Saswat**: Real-time anomaly monitoring service
  - [ ] **Anchal**: AI alerts display on dashboard
  - [ ] **Juhi**: Anomaly notifications in mobile app

**🎯 End of Day Goal**: AI system detecting and alerting on tourist anomalies

### 🚨 **Day 5: Dashboard & Monitoring** (Mission Control Day!)
**Lead**: Anchal (Dashboard) + All Team Integration
- **Morning**:
  - [ ] **Anchal**: Complete police/tourism dashboard
  - [ ] **Anchal**: Real-time tourist tracking on maps
  - [ ] **Sahil**: Incident management APIs
  - [ ] **Ankita**: Dashboard-mobile real-time sync
  
- **Afternoon**:
  - [ ] **Anchal**: Incident logging and management
  - [ ] **All Team**: End-to-end testing of complete flow
  - [ ] **Juhi**: Family location sharing feature
  - [ ] **Saswat**: Fine-tune AI parameters

**🎯 End of Day Goal**: Complete dashboard with real-time monitoring and incident management

### 🚀 **Day 6: Polish & Demo Prep** (Showtime!)
**Lead**: Ankita (Project Management) + All Team
- **Morning**:
  - [ ] **All**: Bug fixes and performance optimization
  - [ ] **Anchal**: UI/UX polish and responsive design
  - [ ] **Juhi**: Mobile app final testing and UI improvements
  - [ ] **Sahil**: Security hardening and API optimization
  
- **Afternoon**:
  - [ ] **All**: Demo preparation and presentation setup
  - [ ] **Ankita**: Documentation and deployment guide
  - [ ] **Saswat**: Demo scenarios for AI features
  - [ ] **Anwesha**: Blockchain demo preparation
  - [ ] **All**: Final integration testing and demo rehearsal

**🎯 End of Day Goal**: Polished MVP ready for presentation!

---

## 📋 **Daily Sprint Structure**

### ⏰ **Time Management**
- **9:00-9:30 AM**: Daily standup (what did you do, what will you do, blockers)
- **12:00-1:00 PM**: Lunch break + informal check-ins
- **3:00-3:15 PM**: Quick sync and blocker resolution
- **6:00-6:30 PM**: End of day demo and next day planning

### 🔧 **Tools & Communication**
- **GitHub**: Version control and task tracking
- **Discord/Slack**: Real-time communication
- **Shared Google Drive**: Documentation and resources
- **Live Share (VS Code)**: Pair programming sessions

### � **MVP Core Features (Must-Have)**
1. ✅ Tourist registration with blockchain Digital ID
2. ✅ Mobile app with GPS tracking and panic button
3. ✅ Basic geo-fencing alerts
4. ✅ AI anomaly detection (inactivity, location loss)
5. ✅ Police/Tourism dashboard with real-time monitoring
6. ✅ Basic incident management

### 🚀 **Demo Day Prep Checklist**
- [ ] **Working mobile app** on physical device
- [ ] **Live dashboard** showing real-time data
- [ ] **Blockchain Digital ID** creation demo
- [ ] **AI anomaly detection** simulation
- [ ] **Panic button to dashboard** alert flow
- [ ] **Presentation slides** with architecture and features
- [ ] **Demo script** with specific scenarios

<div align="center">
  <img src="https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif" width="200"/>
  <p><em>6 days, 6 heroes, 1 amazing MVP! 🎉</em></p>
</div>

---

## 📈 **Long-term Roadmap** (Post-MVP Enhancements)

### Phase 1: Core Setup (Week 1-2)
- [ ] Project structure setup 📁 *(Organizing like Marie Kondo)*
- [ ] Basic React Native app with navigation 📱 *(Baby steps!)*
- [ ] Express.js backend with PostgreSQL 🗄️ *(Building the backbone)*
- [ ] Basic authentication system 🔐 *(Who goes there?)*
- [ ] GitHub repository setup 🌿 *(Version control activated)*

<img src="https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif" width="150" align="right"/>

### Phase 2: Digital ID & Authentication (Week 3-4) 🆔 *"Identity Crisis Solved"*
- [ ] Blockchain integration for Digital ID ⛓️ *(Creating digital DNA)*
- [ ] User registration and login 👤 *(Welcome aboard!)*
- [ ] KYC integration 📄 *(Know your customer, literally)*
- [ ] Smart contract development 📜 *(Digital contracts that are actually smart)*

### Phase 3: Location & Safety Features (Week 5-6) 📍 *"The Guardian Angels"*
- [ ] GPS tracking implementation 🛰️ *(Satellite surveillance activated)*
- [ ] Geo-fencing system 🚧 *(Virtual boundaries that actually work)*
- [ ] Panic button functionality 🚨 *(The big red button of safety)*
- [ ] Real-time location sharing 📡 *(Share the adventure!)*

### Phase 4: AI/ML Integration (Week 7-8) 🤖 *"The Brain Surgeons"*
- [ ] Anomaly detection algorithms 🕵️ *(Sherlock Holmes 2.0)*
- [ ] Route deviation detection 🛣️ *(When GPS gets confused)*
- [ ] Inactivity monitoring ⏰ *(Are you still there?)*
- [ ] Behavioral pattern analysis 📊 *(Understanding human nature)*

### Phase 5: Dashboard & Monitoring (Week 9-10) 📊 *"Mission Control"*
- [ ] Police/Tourism dashboard 🖥️ *(Command center vibes)*
- [ ] Real-time alerts system 🚨 *(Faster than the speed of light)*
- [ ] Incident management 📋 *(Keeping track of everything)*
- [ ] Reporting and analytics 📈 *(Data that tells stories)*

### Phase 6: Testing & Deployment (Week 11-12) 🚀 *"The Final Countdown"*
- [ ] Comprehensive testing 🧪 *(Breaking things before users do)*
- [ ] Performance optimization ⚡ *(Making it lightning fast)*
- [ ] Security audit 🔒 *(Fort Knox level security)*
- [ ] Deployment and documentation 📚 *(Launch time!)*

<div align="center">
  <img src="https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif" width="200"/>
  <p><em>12 weeks later... WE DID IT! 🎉</em></p>
</div>

---

## 🔧 Development Guidelines

### 🎨 Code Standards
- Use ESLint and Prettier for JavaScript/TypeScript
- Follow PEP 8 for Python code
- Use meaningful commit messages
- Write comprehensive documentation

### 🧪 Testing
- Unit tests for all components
- Integration tests for APIs
- End-to-end testing for critical flows
- Load testing for performance validation

### 🔒 Security
- AES-256 encryption for data
- OAuth2.0 for authentication
- Input validation and sanitization
- Regular security audits

---

## 👥 Team Collaboration (Working Together Like Avengers!)

<div align="center">
  <img src="https://media.giphy.com/media/l1ughbsd9qXz2s9SE/giphy.gif" width="250"/>
  <p><em>Teamwork makes the dream work! 💪</em></p>
</div>

### 📋 Task Management *(Organizing Chaos Like a Pro)*
- Use GitHub Issues for task tracking 📝 *(Todo lists that don't get lost)*
- Create branches for each feature 🌿 *(Parallel universe coding)*
- Pull request reviews mandatory 👀 *(No code goes unnoticed)*
- Daily standup meetings ☕ *(Coffee + Updates = Perfect combo)*

### 📚 Documentation *(Making Future You Happy)*
- API documentation with Swagger 📖 *(Self-documenting awesomeness)*
- Code comments for complex logic 💭 *(Explaining the magic tricks)*
- README files for each module 📄 *(Breadcrumbs for developers)*
- Architecture decision records (ADRs) 🏗️ *(Why we chose what we chose)*

<img src="https://media.giphy.com/media/3oriNYQX2lC6dfW2Ji/giphy.gif" width="200" align="right"/>

---

## 🚀 Deployment (Taking Over the World!)

<div align="center">
  <img src="https://media.giphy.com/media/26gJy9p3W2PPkP8EE/giphy.gif" width="200"/>
  <p><em>Ready for world domination? 🌍</em></p>
</div>

### 🌐 Production Environment *(The Big Leagues)*
- **Backend**: AWS EC2 / DigitalOcean ☁️ *(Cloud nine hosting)*
- **Database**: AWS RDS PostgreSQL 🗄️ *(Elephant in the cloud)*
- **Mobile**: Play Store / App Store 📱 *(Global reach activated)*
- **Dashboard**: Netlify / Vercel 🌐 *(Lightning fast deployment)*
- **Blockchain**: Ethereum Mainnet / Private Network ⛓️ *(Decentralized awesomeness)*

---

## 📞 Contact & Support (We're Here to Help!)

<div align="center">
  <img src="https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif" width="150"/>
</div>

### 👨‍💻👩‍💻 Meet Our Amazing Team! (The Dream Squad!)

<div align="center">
  <img src="https://media.giphy.com/media/l1ughbsd9qXz2s9SE/giphy.gif" width="200"/>
  <p><em>Six minds, one mission! 🚀</em></p>
</div>

| 🦸‍♀️🦸‍♂️ **Team Member** | 🎯 **Role** | 💫 **Superpower** |
|---|---|---|
| **Ankita Rahi** 👑 | Team Lead & Full Stack Developer | *Making impossible possible* |
| **Anchal Kumari** 💻 | Frontend Specialist | *UI/UX Magic* |
| **Juhi Rani** 📱 | Mobile App Developer | *React Native Ninja* |
| **Saswat Ranjan Behera** 🤖 | AI/ML Engineer | *Algorithm Wizard* |
| **Anwesha Mishra** ⛓️ | Blockchain Developer | *Decentralization Expert* |
| **Sahil Behera** 🗄️ | Backend & DevOps | *Server Superhero* |

<div align="center">
  <img src="https://media.giphy.com/media/3oriNYQX2lC6dfW2Ji/giphy.gif" width="180"/>
  <p><em>Together we code, together we conquer! 💪</em></p>
</div>

### 📬 Get in Touch
- **Team Lead**: Ankita Rahi 👑 *(The mastermind)*
- **Email**: [team.surakshayatra@example.com] 📧 *(Slide into our inbox)*
- **GitHub**: [https://github.com/ankita1477/Suraksha-Yatra-SIH25](https://github.com/ankita1477/Suraksha-Yatra-SIH25) 🌿 *(Where the magic happens)*

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Translation: Use it, share it, love it! 💕*

---

## 🙏 Acknowledgments (Our Heroes!)

<div align="center">
  <img src="https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif" width="200"/>
</div>

- Smart India Hackathon 2025 🏆 *(The stage for our brilliance)*
- Ministry of Development of North Eastern Region 🏛️ *(Our awesome sponsors)*
- Ministry of Tourism 🗺️ *(Making travel safer)*
- Ministry of Home Affairs 🏠 *(Keeping everyone secure)*

---

<div align="center">
  <img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" width="300"/>
  
  **Happy Coding! 🚀**
  
  *Building safer tourism experiences with technology... and a lot of coffee! ☕*
  
  <img src="https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif" width="200"/>
</div>
