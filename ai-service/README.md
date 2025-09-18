# AI/ML Service for Suraksha Yatra

## Overview
This service provides AI/ML capabilities for the Suraksha Yatra safety platform including:

- **Predictive Analytics**: Location-based risk prediction using historical data
- **Anomaly Detection**: Real-time detection of unusual patterns in user behavior
- **Risk Assessment**: ML-based risk scoring for routes and areas
- **Emergency Response Optimization**: AI-powered emergency resource allocation
- **Pattern Recognition**: Analysis of incident patterns and trends

## Features

### 1. Predictive Analytics
- Route risk prediction based on historical incidents
- Time-based risk analysis (hour, day, season)
- Weather-based risk adjustment
- Real-time risk score updates

### 2. Anomaly Detection
- User movement pattern analysis
- Speed anomaly detection
- Location deviation alerts
- Communication pattern analysis

### 3. Machine Learning Models
- Random Forest for risk classification
- LSTM for time-series prediction
- Clustering for pattern identification
- Reinforcement learning for optimization

## API Endpoints

### Risk Analysis
- `POST /api/predict/route-risk` - Predict risk for a specific route
- `POST /api/predict/area-risk` - Get risk score for an area
- `GET /api/analytics/trends` - Get incident trends and patterns

### Anomaly Detection
- `POST /api/detect/movement-anomaly` - Detect unusual movement patterns
- `POST /api/detect/speed-anomaly` - Detect speed anomalies
- `GET /api/detect/alerts` - Get active anomaly alerts

### Model Management
- `GET /api/models/status` - Get model training status
- `POST /api/models/retrain` - Trigger model retraining
- `GET /api/models/metrics` - Get model performance metrics

## Installation

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

## Environment Variables

```env
FLASK_ENV=development
DATABASE_URL=mongodb://localhost:27017/suraksha_yatra
MODEL_PATH=./models
LOG_LEVEL=INFO
```