import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from datetime import datetime, timedelta
import logging
from database.mongodb_client import DatabaseClient
from geopy.distance import geodesic

logger = logging.getLogger(__name__)

class RiskPredictor:
    def __init__(self):
        self.db_client = DatabaseClient()
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'hour', 'day_of_week', 'month',
            'historical_incidents_count',
            'population_density',
            'weather_risk_score',
            'distance_to_hospital',
            'distance_to_police',
            'average_speed',
            'route_complexity'
        ]
        self.model_version = "1.0.0"
        self.last_trained = None
        
        # Load existing model if available
        self.load_model()
    
    def prepare_features(self, start_coords, end_coords, time_of_day=None, weather_conditions=None):
        """Prepare features for risk prediction"""
        try:
            if time_of_day is None:
                current_time = datetime.now()
                hour = current_time.hour
                day_of_week = current_time.weekday()
                month = current_time.month
            else:
                # Parse time_of_day if provided
                time_obj = datetime.strptime(time_of_day, '%H:%M')
                hour = time_obj.hour
                day_of_week = datetime.now().weekday()
                month = datetime.now().month
            
            # Calculate route midpoint for area analysis
            mid_lat = (start_coords[0] + end_coords[0]) / 2
            mid_lng = (start_coords[1] + end_coords[1]) / 2
            
            # Get historical incidents in the area
            area_stats = self.db_client.get_area_incident_stats(mid_lat, mid_lng, radius_km=2)
            historical_incidents_count = area_stats['total_incidents']
            
            # Calculate route distance
            route_distance = geodesic(start_coords, end_coords).kilometers
            
            # Weather risk score (simplified)
            weather_risk_score = self._calculate_weather_risk(weather_conditions)
            
            # Distance to emergency services (simplified - would use real API)
            distance_to_hospital = self._estimate_distance_to_service(mid_lat, mid_lng, 'hospital')
            distance_to_police = self._estimate_distance_to_service(mid_lat, mid_lng, 'police')
            
            # Route complexity (based on distance and area density)
            route_complexity = min(route_distance / 10, 1.0)  # Normalized complexity
            
            # Population density estimate (simplified)
            population_density = self._estimate_population_density(mid_lat, mid_lng)
            
            # Average speed estimate
            average_speed = self._estimate_average_speed(route_distance, hour)
            
            features = {
                'hour': hour,
                'day_of_week': day_of_week,
                'month': month,
                'historical_incidents_count': historical_incidents_count,
                'population_density': population_density,
                'weather_risk_score': weather_risk_score,
                'distance_to_hospital': distance_to_hospital,
                'distance_to_police': distance_to_police,
                'average_speed': average_speed,
                'route_complexity': route_complexity
            }
            
            return features
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            # Return default features if error occurs
            return {col: 0.5 for col in self.feature_columns}
    
    def predict_route_risk(self, start_coords, end_coords, time_of_day=None, weather_conditions=None):
        """Predict risk score for a route"""
        try:
            if self.model is None:
                logger.warning("Model not trained, using default risk calculation")
                return self._calculate_default_risk(start_coords, end_coords)
            
            features = self.prepare_features(start_coords, end_coords, time_of_day, weather_conditions)
            feature_array = np.array([[features[col] for col in self.feature_columns]])
            
            # Scale features
            feature_array_scaled = self.scaler.transform(feature_array)
            
            # Predict risk score
            risk_score = self.model.predict(feature_array_scaled)[0]
            
            # Ensure risk score is between 0 and 1
            risk_score = max(0, min(1, risk_score))
            
            # Store prediction for model improvement
            self.db_client.store_prediction(
                'route_risk',
                {'start_coords': start_coords, 'end_coords': end_coords, 'features': features},
                risk_score,
                self.model_version
            )
            
            return risk_score
            
        except Exception as e:
            logger.error(f"Error predicting route risk: {str(e)}")
            return self._calculate_default_risk(start_coords, end_coords)
    
    def predict_area_risk(self, latitude, longitude, radius=1000):
        """Predict risk for a specific area"""
        try:
            area_stats = self.db_client.get_area_incident_stats(latitude, longitude, radius/1000)
            
            # Calculate base risk from historical data
            total_incidents = area_stats['total_incidents']
            severity_dist = area_stats['severity_distribution']
            
            # Weight by severity
            severity_weights = {'critical': 1.0, 'high': 0.8, 'medium': 0.5, 'low': 0.2}
            weighted_incidents = sum(
                severity_weights.get(severity, 0.5) * count 
                for severity, count in severity_dist.items()
            )
            
            # Normalize based on area size and time (last 30 days)
            area_km2 = (radius / 1000) ** 2 * 3.14159
            risk_density = weighted_incidents / (area_km2 * 30)  # incidents per km² per day
            
            # Convert to risk score (0-1)
            base_risk = min(risk_density / 0.1, 1.0)  # 0.1 incidents/km²/day = max risk
            
            # Adjust for time of day
            current_hour = datetime.now().hour
            time_multiplier = self._get_time_risk_multiplier(current_hour)
            
            final_risk = min(base_risk * time_multiplier, 1.0)
            
            return {
                'risk_score': final_risk,
                'risk_level': self.get_risk_level(final_risk),
                'area_stats': area_stats,
                'factors': {
                    'historical_incidents': total_incidents,
                    'risk_density': risk_density,
                    'time_multiplier': time_multiplier
                }
            }
            
        except Exception as e:
            logger.error(f"Error predicting area risk: {str(e)}")
            return {
                'risk_score': 0.5,
                'risk_level': 'medium',
                'area_stats': {},
                'factors': {}
            }
    
    def get_risk_level(self, risk_score):
        """Convert risk score to risk level"""
        if risk_score >= 0.8:
            return 'critical'
        elif risk_score >= 0.6:
            return 'high'
        elif risk_score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def get_recommendations(self, risk_score):
        """Get safety recommendations based on risk score"""
        if risk_score >= 0.8:
            return [
                "Consider postponing travel if possible",
                "Share your location with emergency contacts",
                "Use main roads and avoid isolated areas",
                "Travel in groups if possible",
                "Keep emergency numbers ready"
            ]
        elif risk_score >= 0.6:
            return [
                "Stay alert and aware of surroundings",
                "Share your location with contacts",
                "Avoid isolated areas",
                "Keep phone charged and accessible"
            ]
        elif risk_score >= 0.4:
            return [
                "Exercise normal caution",
                "Keep emergency contacts updated",
                "Stay on well-lit paths"
            ]
        else:
            return [
                "Safe travel conditions",
                "Maintain basic safety awareness"
            ]
    
    def optimize_emergency_response(self, incident_location, incident_type, severity, available_resources):
        """AI-powered emergency response optimization"""
        try:
            # Calculate response priorities
            priorities = []
            
            for resource in available_resources:
                distance = geodesic(
                    incident_location,
                    (resource['latitude'], resource['longitude'])
                ).kilometers
                
                # Calculate priority score
                distance_score = max(0, 1 - (distance / 50))  # 50km max distance
                capability_score = self._calculate_capability_score(resource, incident_type)
                availability_score = 1.0 if resource['available'] else 0.1
                
                priority_score = (distance_score * 0.4 + 
                                capability_score * 0.4 + 
                                availability_score * 0.2)
                
                priorities.append({
                    'resource_id': resource['id'],
                    'resource_type': resource['type'],
                    'priority_score': priority_score,
                    'estimated_arrival_time': distance / 60 * 60,  # Assuming 60 km/h average
                    'recommendation': 'primary' if priority_score > 0.7 else 'secondary'
                })
            
            # Sort by priority
            priorities.sort(key=lambda x: x['priority_score'], reverse=True)
            
            return {
                'recommended_resources': priorities[:3],  # Top 3 recommendations
                'estimated_response_time': priorities[0]['estimated_arrival_time'] if priorities else None,
                'optimization_factors': {
                    'incident_severity': severity,
                    'incident_type': incident_type,
                    'available_resources_count': len(available_resources)
                }
            }
            
        except Exception as e:
            logger.error(f"Error optimizing emergency response: {str(e)}")
            return {'error': 'Optimization failed'}
    
    def train_model(self):
        """Train the risk prediction model"""
        try:
            logger.info("Starting model training...")
            
            # Get training data
            incidents = self.db_client.get_historical_incidents(days=90)
            
            if len(incidents) < 50:
                logger.warning("Insufficient data for training")
                return False
            
            # Prepare training dataset
            X, y = self._prepare_training_data(incidents)
            
            if len(X) == 0:
                logger.warning("No valid training data prepared")
                return False
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Model trained - MSE: {mse:.4f}, R²: {r2:.4f}")
            
            # Save model
            self.save_model()
            self.last_trained = datetime.now()
            
            return True
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return False
    
    def _prepare_training_data(self, incidents):
        """Prepare training data from incidents"""
        X = []
        y = []
        
        severity_scores = {'critical': 1.0, 'high': 0.8, 'medium': 0.5, 'low': 0.2}
        
        for incident in incidents:
            try:
                if 'location' not in incident or 'coordinates' not in incident['location']:
                    continue
                
                coords = incident['location']['coordinates']
                lat, lng = coords[1], coords[0]
                
                # Use incident time for feature preparation
                incident_time = incident.get('createdAt', datetime.now())
                time_str = incident_time.strftime('%H:%M')
                
                # Prepare features (using incident location as both start and end)
                features = self.prepare_features(
                    (lat, lng), (lat, lng), 
                    time_of_day=time_str
                )
                
                # Get target (risk score based on severity)
                severity = incident.get('severity', 'medium')
                risk_score = severity_scores.get(severity, 0.5)
                
                X.append([features[col] for col in self.feature_columns])
                y.append(risk_score)
                
            except Exception as e:
                logger.warning(f"Error preparing training sample: {str(e)}")
                continue
        
        return np.array(X), np.array(y)
    
    def save_model(self):
        """Save the trained model"""
        try:
            model_path = os.path.join('./models', 'risk_predictor.joblib')
            scaler_path = os.path.join('./models', 'risk_scaler.joblib')
            
            os.makedirs('./models', exist_ok=True)
            
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info("Model saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def load_model(self):
        """Load existing trained model"""
        try:
            model_path = os.path.join('./models', 'risk_predictor.joblib')
            scaler_path = os.path.join('./models', 'risk_scaler.joblib')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                logger.info("Model loaded successfully")
                return True
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
        
        return False
    
    def retrain(self):
        """Retrain the model"""
        return self.train_model()
    
    def get_status(self):
        """Get model status"""
        return {
            'model_loaded': self.model is not None,
            'last_trained': self.last_trained.isoformat() if self.last_trained else None,
            'model_version': self.model_version,
            'feature_count': len(self.feature_columns)
        }
    
    # Helper methods
    def _calculate_default_risk(self, start_coords, end_coords):
        """Calculate a basic risk score when model is not available"""
        distance = geodesic(start_coords, end_coords).kilometers
        hour = datetime.now().hour
        
        # Simple heuristic based on distance and time
        distance_risk = min(distance / 100, 0.3)  # Max 0.3 risk from distance
        time_risk = self._get_time_risk_multiplier(hour) * 0.3
        base_risk = 0.4  # Base urban risk
        
        return min(distance_risk + time_risk + base_risk, 1.0)
    
    def _calculate_weather_risk(self, weather_conditions):
        """Calculate risk score based on weather"""
        if not weather_conditions:
            return 0.3  # Default moderate risk
        
        weather_risks = {
            'clear': 0.1,
            'cloudy': 0.2,
            'rain': 0.6,
            'heavy_rain': 0.8,
            'storm': 0.9,
            'fog': 0.7,
            'snow': 0.8
        }
        
        return weather_risks.get(weather_conditions.lower(), 0.3)
    
    def _estimate_distance_to_service(self, lat, lng, service_type):
        """Estimate distance to emergency services"""
        # Simplified estimation - in real implementation, use API
        if service_type == 'hospital':
            return min(np.random.exponential(5), 20)  # 0-20km
        elif service_type == 'police':
            return min(np.random.exponential(3), 15)  # 0-15km
        return 10
    
    def _estimate_population_density(self, lat, lng):
        """Estimate population density"""
        # Simplified estimation - in real implementation, use demographic API
        return np.random.uniform(0.2, 0.8)
    
    def _estimate_average_speed(self, distance, hour):
        """Estimate average speed based on distance and time"""
        if hour >= 7 and hour <= 9 or hour >= 17 and hour <= 19:
            # Rush hour - slower speeds
            return max(20, 40 - distance * 2)
        else:
            return max(30, 60 - distance)
    
    def _get_time_risk_multiplier(self, hour):
        """Get risk multiplier based on time of day"""
        if hour >= 22 or hour <= 5:
            return 1.3  # Night time - higher risk
        elif hour >= 6 and hour <= 8 or hour >= 17 and hour <= 19:
            return 1.1  # Rush hour - moderate increase
        else:
            return 1.0  # Normal day time
    
    def _calculate_capability_score(self, resource, incident_type):
        """Calculate how well a resource can handle an incident type"""
        capability_matrix = {
            'ambulance': {'medical': 1.0, 'accident': 0.9, 'panic': 0.7, 'fire': 0.3},
            'police': {'panic': 1.0, 'crime': 1.0, 'accident': 0.8, 'medical': 0.4},
            'fire_department': {'fire': 1.0, 'accident': 0.8, 'medical': 0.6, 'panic': 0.5},
            'rescue_team': {'accident': 1.0, 'medical': 0.8, 'panic': 0.9, 'fire': 0.7}
        }
        
        resource_type = resource.get('type', 'unknown')
        return capability_matrix.get(resource_type, {}).get(incident_type, 0.5)