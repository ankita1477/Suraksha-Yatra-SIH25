import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'mongodb://localhost:27017/suraksha_yatra')
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # ML Models
    MODEL_PATH = os.getenv('MODEL_PATH', './models')
    RETRAIN_INTERVAL_HOURS = int(os.getenv('RETRAIN_INTERVAL_HOURS', '24'))
    
    # API
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', '5001'))
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # External APIs
    WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', '')
    MAPS_API_KEY = os.getenv('MAPS_API_KEY', '')
    
    # ML Parameters
    RISK_THRESHOLD = float(os.getenv('RISK_THRESHOLD', '0.7'))
    ANOMALY_THRESHOLD = float(os.getenv('ANOMALY_THRESHOLD', '0.8'))
    
    # Real-time settings
    PREDICTION_CACHE_TTL = int(os.getenv('PREDICTION_CACHE_TTL', '300'))  # 5 minutes