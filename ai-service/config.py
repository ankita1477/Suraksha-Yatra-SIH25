import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AI Service Configuration
AI_HOST = os.getenv('AI_HOST', '0.0.0.0')
# Hosting providers may set PORT dynamically; fallback to AI_PORT for local runs.
AI_PORT = int(os.getenv('PORT', os.getenv('AI_PORT', 5000)))
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# MongoDB Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017/suraksha')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'suraksha')

# ML Model Configuration
MODEL_UPDATE_INTERVAL = int(os.getenv('MODEL_UPDATE_INTERVAL', 3600))  # seconds
MIN_DATA_POINTS = int(os.getenv('MIN_DATA_POINTS', 100))
RISK_PREDICTION_RADIUS = float(os.getenv('RISK_PREDICTION_RADIUS', 1.0))  # km

# Anomaly Detection Configuration
ANOMALY_THRESHOLD = float(os.getenv('ANOMALY_THRESHOLD', 0.7))
MOVEMENT_SPEED_THRESHOLD = float(os.getenv('MOVEMENT_SPEED_THRESHOLD', 100))  # km/h

# Pattern Analysis Configuration
HOTSPOT_RADIUS = float(os.getenv('HOTSPOT_RADIUS', 0.5))  # km
MIN_INCIDENTS_FOR_HOTSPOT = int(os.getenv('MIN_INCIDENTS_FOR_HOTSPOT', 5))

# Gemini AI Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# API Configuration
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:4000/api')
API_TIMEOUT = int(os.getenv('API_TIMEOUT', 30))  # seconds