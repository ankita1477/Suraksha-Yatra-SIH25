from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
import logging
import os
from datetime import datetime

# Import our ML modules
from ml_models.risk_predictor import RiskPredictor
from ml_models.anomaly_detector import AnomalyDetector
from ml_models.pattern_analyzer import PatternAnalyzer
from database.mongodb_client import DatabaseClient

# Configure logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize components
db_client = DatabaseClient()
risk_predictor = RiskPredictor()
anomaly_detector = AnomalyDetector()
pattern_analyzer = PatternAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'ai-ml-service',
        'version': '1.0.0'
    })

@app.route('/api/predict/route-risk', methods=['POST'])
def predict_route_risk():
    """Predict risk for a specific route"""
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['start_lat', 'start_lng', 'end_lat', 'end_lng']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get route risk prediction
        risk_score = risk_predictor.predict_route_risk(
            start_coords=(data['start_lat'], data['start_lng']),
            end_coords=(data['end_lat'], data['end_lng']),
            time_of_day=data.get('time_of_day'),
            weather_conditions=data.get('weather_conditions')
        )
        
        return jsonify({
            'risk_score': risk_score,
            'risk_level': risk_predictor.get_risk_level(risk_score),
            'recommendations': risk_predictor.get_recommendations(risk_score),
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error predicting route risk: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/predict/area-risk', methods=['POST'])
def predict_area_risk():
    """Get risk score for a specific area"""
    try:
        data = request.get_json()
        
        if 'latitude' not in data or 'longitude' not in data:
            return jsonify({'error': 'Latitude and longitude required'}), 400
        
        risk_data = risk_predictor.predict_area_risk(
            latitude=data['latitude'],
            longitude=data['longitude'],
            radius=data.get('radius', 1000)  # Default 1km radius
        )
        
        return jsonify(risk_data)
        
    except Exception as e:
        logger.error(f"Error predicting area risk: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/detect/movement-anomaly', methods=['POST'])
def detect_movement_anomaly():
    """Detect unusual movement patterns"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'locations']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        anomaly_result = anomaly_detector.detect_movement_anomaly(
            user_id=data['user_id'],
            locations=data['locations']
        )
        
        return jsonify(anomaly_result)
        
    except Exception as e:
        logger.error(f"Error detecting movement anomaly: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/detect/speed-anomaly', methods=['POST'])
def detect_speed_anomaly():
    """Detect speed anomalies"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'speed', 'location']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        anomaly_result = anomaly_detector.detect_speed_anomaly(
            user_id=data['user_id'],
            current_speed=data['speed'],
            location=data['location'],
            context=data.get('context', {})
        )
        
        return jsonify(anomaly_result)
        
    except Exception as e:
        logger.error(f"Error detecting speed anomaly: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/analytics/trends', methods=['GET'])
def get_trends():
    """Get incident trends and patterns"""
    try:
        time_range = request.args.get('time_range', '7d')  # Default 7 days
        location = request.args.get('location')
        
        trends = pattern_analyzer.analyze_trends(
            time_range=time_range,
            location=location
        )
        
        return jsonify(trends)
        
    except Exception as e:
        logger.error(f"Error getting trends: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/models/status', methods=['GET'])
def get_model_status():
    """Get model training status and metrics"""
    try:
        status = {
            'risk_predictor': risk_predictor.get_status(),
            'anomaly_detector': anomaly_detector.get_status(),
            'pattern_analyzer': pattern_analyzer.get_status(),
            'last_updated': datetime.utcnow().isoformat()
        }
        
        return jsonify(status)
        
    except Exception as e:
        logger.error(f"Error getting model status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/models/retrain', methods=['POST'])
def retrain_models():
    """Trigger model retraining"""
    try:
        model_type = request.json.get('model_type', 'all')
        
        if model_type in ['all', 'risk_predictor']:
            risk_predictor.retrain()
        
        if model_type in ['all', 'anomaly_detector']:
            anomaly_detector.retrain()
        
        if model_type in ['all', 'pattern_analyzer']:
            pattern_analyzer.retrain()
        
        return jsonify({
            'message': f'Retraining initiated for {model_type}',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retraining models: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/emergency/optimize-response', methods=['POST'])
def optimize_emergency_response():
    """AI-powered emergency response optimization"""
    try:
        data = request.get_json()
        
        required_fields = ['incident_location', 'incident_type', 'severity']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        optimization = risk_predictor.optimize_emergency_response(
            incident_location=data['incident_location'],
            incident_type=data['incident_type'],
            severity=data['severity'],
            available_resources=data.get('available_resources', [])
        )
        
        return jsonify(optimization)
        
    except Exception as e:
        logger.error(f"Error optimizing emergency response: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create models directory if it doesn't exist
    os.makedirs(Config.MODEL_PATH, exist_ok=True)
    
    logger.info("Starting AI/ML Service...")
    logger.info(f"Model path: {Config.MODEL_PATH}")
    logger.info(f"Database URL: {Config.DATABASE_URL}")
    
    app.run(
        host=Config.API_HOST,
        port=Config.API_PORT,
        debug=(Config.FLASK_ENV == 'development')
    )