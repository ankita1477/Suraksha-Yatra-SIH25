# AI/ML Service for Suraksha Yatra

This service provides AI and machine learning capabilities for the Suraksha Yatra platform, including risk prediction, anomaly detection, pattern analysis, and predictive analytics.

## Features

### 1. Risk Prediction
- Route safety scoring based on historical incident data
- Time-based risk modifiers
- Route characteristics analysis
- Area risk summaries

### 2. Anomaly Detection
- Unusual movement pattern identification
- Speed anomaly detection
- Location-based anomaly detection
- Time-based anomaly detection

### 3. Pattern Analysis
- Incident hotspot identification
- Temporal trend analysis
- Risk zone mapping
- Actionable insights generation

### 4. Predictive Analytics
- Threat level assessment
- Context-aware risk evaluation
- Safety recommendations

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the service:
```bash
python app.py
```

## API Endpoints

### Risk Prediction
- `POST /api/risk/predict` - Predict route safety score

### Anomaly Detection
- `POST /api/anomaly/detect` - Detect movement anomalies

### Pattern Analysis
- `POST /api/patterns/analyze` - Analyze incident patterns

### Threat Assessment
- `POST /api/threat/assess` - Assess threat level

### Health Check
- `GET /health` - Service health status

## Configuration

Configure the service using environment variables:

```bash
# Service Configuration
AI_HOST=0.0.0.0
AI_PORT=5000
DEBUG=false

# Database Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=suraksha_yatra

# ML Configuration
MODEL_UPDATE_INTERVAL=3600
MIN_DATA_POINTS=100
RISK_PREDICTION_RADIUS=1.0
ANOMALY_THRESHOLD=0.7
MOVEMENT_SPEED_THRESHOLD=100
```

## Usage Examples

### Risk Prediction
```python
import requests

response = requests.post('http://localhost:5000/api/risk/predict', json={
    "route": {
        "start": {"lat": 28.6139, "lng": 77.2090},
        "end": {"lat": 28.7041, "lng": 77.1025}
    },
    "time_of_day": "evening"
})
```

### Anomaly Detection
```python
response = requests.post('http://localhost:5000/api/anomaly/detect', json={
    "user_id": "user123",
    "location_data": [
        {
            "lat": 28.6139,
            "lng": 77.2090,
            "timestamp": "2023-01-01T10:00:00Z",
            "speed": 25.5
        }
    ]
})
```

## Development

The service is structured as follows:

```
ai-service/
├── app.py                  # Main Flask application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── database/
│   └── mongodb_client.py  # Database client
└── ml_models/
    ├── risk_predictor.py   # Risk prediction model
    ├── anomaly_detector.py # Anomaly detection model
    └── pattern_analyzer.py # Pattern analysis model
```

## Integration with Backend

The AI service is designed to work with the Node.js backend. The backend can call these endpoints to get AI-powered insights and integrate them into the main application workflow.