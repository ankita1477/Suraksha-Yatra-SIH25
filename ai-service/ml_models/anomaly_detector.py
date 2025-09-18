import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from scipy import stats
import joblib
import os
from datetime import datetime, timedelta
import logging
from database.mongodb_client import DatabaseClient
from geopy.distance import geodesic

logger = logging.getLogger(__name__)

class AnomalyDetector:
    def __init__(self):
        self.db_client = DatabaseClient()
        self.movement_model = None
        self.speed_model = None
        self.scaler = StandardScaler()
        self.model_version = "1.0.0"
        self.last_trained = None
        
        # Anomaly thresholds
        self.speed_threshold_percentile = 95
        self.movement_deviation_threshold = 2.5  # Standard deviations
        self.time_gap_threshold = 300  # 5 minutes in seconds
        
        # Load existing models if available
        self.load_models()
    
    def detect_movement_anomaly(self, user_id, locations):
        """Detect unusual movement patterns"""
        try:
            if len(locations) < 3:
                return {
                    'is_anomaly': False,
                    'confidence': 0.0,
                    'reason': 'Insufficient location data'
                }
            
            # Get user's historical movement patterns
            historical_patterns = self.db_client.get_user_movement_patterns(user_id, days=30)
            
            if len(historical_patterns) < 10:
                return {
                    'is_anomaly': False,
                    'confidence': 0.0,
                    'reason': 'Insufficient historical data'
                }
            
            # Analyze current movement pattern
            current_features = self._extract_movement_features(locations)
            historical_features = [
                self._extract_movement_features(historical_patterns[i:i+len(locations)])
                for i in range(0, len(historical_patterns) - len(locations) + 1, len(locations))
                if i + len(locations) <= len(historical_patterns)
            ]
            
            if len(historical_features) < 5:
                return {
                    'is_anomaly': False,
                    'confidence': 0.0,
                    'reason': 'Insufficient historical patterns'
                }
            
            # Calculate anomaly score
            anomaly_score = self._calculate_movement_anomaly_score(current_features, historical_features)
            
            is_anomaly = anomaly_score > 0.7
            
            # Determine the reason for anomaly
            reason = self._determine_movement_anomaly_reason(current_features, historical_features)
            
            result = {
                'is_anomaly': is_anomaly,
                'confidence': anomaly_score,
                'reason': reason,
                'features': current_features,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Store result for model improvement
            self.db_client.store_prediction(
                'movement_anomaly',
                {'user_id': user_id, 'locations': locations},
                result,
                self.model_version
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error detecting movement anomaly: {str(e)}")
            return {
                'is_anomaly': False,
                'confidence': 0.0,
                'reason': 'Detection error'
            }
    
    def detect_speed_anomaly(self, user_id, current_speed, location, context=None):
        """Detect speed anomalies"""
        try:
            # Get user's historical speed data
            historical_locations = self.db_client.get_user_movement_patterns(user_id, days=15)
            historical_speeds = [
                loc.get('speed', 0) * 3.6  # Convert m/s to km/h
                for loc in historical_locations 
                if loc.get('speed') is not None
            ]
            
            if len(historical_speeds) < 20:
                # Use general speed thresholds if insufficient personal data
                return self._detect_general_speed_anomaly(current_speed, location, context)
            
            # Calculate user-specific speed statistics
            mean_speed = np.mean(historical_speeds)
            std_speed = np.std(historical_speeds)
            percentile_95 = np.percentile(historical_speeds, 95)
            percentile_05 = np.percentile(historical_speeds, 5)
            
            current_speed_kmh = current_speed * 3.6 if current_speed else 0
            
            # Calculate z-score
            z_score = abs((current_speed_kmh - mean_speed) / std_speed) if std_speed > 0 else 0
            
            # Determine if anomalous
            is_high_speed = current_speed_kmh > percentile_95 * 1.5
            is_very_low_speed = current_speed_kmh < percentile_05 * 0.5 and current_speed_kmh > 1
            is_statistical_anomaly = z_score > 3
            
            is_anomaly = is_high_speed or is_very_low_speed or is_statistical_anomaly
            
            # Calculate confidence
            confidence = min(z_score / 3, 1.0) if is_statistical_anomaly else 0.8 if is_high_speed or is_very_low_speed else 0.0
            
            # Determine reason
            if is_high_speed:
                reason = f"Speed significantly higher than usual ({current_speed_kmh:.1f} km/h vs avg {mean_speed:.1f} km/h)"
            elif is_very_low_speed:
                reason = f"Speed unusually low ({current_speed_kmh:.1f} km/h vs avg {mean_speed:.1f} km/h)"
            elif is_statistical_anomaly:
                reason = f"Speed statistically anomalous (z-score: {z_score:.2f})"
            else:
                reason = "Speed within normal range"
            
            result = {
                'is_anomaly': is_anomaly,
                'confidence': confidence,
                'reason': reason,
                'current_speed_kmh': current_speed_kmh,
                'user_avg_speed_kmh': mean_speed,
                'z_score': z_score,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error detecting speed anomaly: {str(e)}")
            return {
                'is_anomaly': False,
                'confidence': 0.0,
                'reason': 'Detection error'
            }
    
    def detect_location_deviation(self, user_id, current_location, planned_route=None):
        """Detect significant deviation from normal routes"""
        try:
            # Get user's common routes
            user_profile = self.db_client.get_user_profile(user_id)
            
            if not user_profile or not user_profile.get('movement_stats', {}).get('common_routes'):
                return {
                    'is_deviation': False,
                    'confidence': 0.0,
                    'reason': 'No established route patterns'
                }
            
            common_routes = user_profile['movement_stats']['common_routes']
            current_lat, current_lng = current_location
            
            # Calculate minimum distance to any common route
            min_distance = float('inf')
            closest_route = None
            
            for route in common_routes:
                route_lat, route_lng = route['start_location'][1], route['start_location'][0]
                distance = geodesic((current_lat, current_lng), (route_lat, route_lng)).kilometers
                
                if distance < min_distance:
                    min_distance = distance
                    closest_route = route
            
            # Define deviation thresholds
            minor_deviation_km = 2.0
            major_deviation_km = 5.0
            
            is_deviation = min_distance > minor_deviation_km
            is_major_deviation = min_distance > major_deviation_km
            
            confidence = min(min_distance / major_deviation_km, 1.0)
            
            if is_major_deviation:
                reason = f"Major route deviation: {min_distance:.1f}km from nearest common route"
            elif is_deviation:
                reason = f"Minor route deviation: {min_distance:.1f}km from nearest common route"
            else:
                reason = "Following established route patterns"
            
            return {
                'is_deviation': is_deviation,
                'is_major_deviation': is_major_deviation,
                'confidence': confidence,
                'reason': reason,
                'distance_from_route_km': min_distance,
                'closest_route': closest_route,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error detecting location deviation: {str(e)}")
            return {
                'is_deviation': False,
                'confidence': 0.0,
                'reason': 'Detection error'
            }
    
    def detect_time_pattern_anomaly(self, user_id, current_time, current_location):
        """Detect anomalies in time-based movement patterns"""
        try:
            # Get historical locations at similar times
            historical_locations = self.db_client.get_user_movement_patterns(user_id, days=30)
            
            # Filter by similar time (within 2 hours)
            current_hour = current_time.hour
            similar_time_locations = []
            
            for loc in historical_locations:
                loc_time = loc.get('createdAt', datetime.utcnow())
                if isinstance(loc_time, str):
                    loc_time = datetime.fromisoformat(loc_time.replace('Z', '+00:00'))
                
                if abs(loc_time.hour - current_hour) <= 2:
                    similar_time_locations.append(loc)
            
            if len(similar_time_locations) < 5:
                return {
                    'is_anomaly': False,
                    'confidence': 0.0,
                    'reason': 'Insufficient historical data for time comparison'
                }
            
            # Calculate average location for this time
            avg_lat = np.mean([loc['location']['coordinates'][1] for loc in similar_time_locations])
            avg_lng = np.mean([loc['location']['coordinates'][0] for loc in similar_time_locations])
            
            # Calculate distance from current location to average location
            distance = geodesic(current_location, (avg_lat, avg_lng)).kilometers
            
            # Calculate standard deviation of historical locations
            distances_from_avg = [
                geodesic((loc['location']['coordinates'][1], loc['location']['coordinates'][0]), (avg_lat, avg_lng)).kilometers
                for loc in similar_time_locations
            ]
            std_distance = np.std(distances_from_avg)
            
            # Determine anomaly
            z_score = distance / std_distance if std_distance > 0 else 0
            is_anomaly = z_score > 2.5
            confidence = min(z_score / 3, 1.0)
            
            reason = f"Location unusual for time {current_hour:02d}:00 (z-score: {z_score:.2f})" if is_anomaly else "Normal location for this time"
            
            return {
                'is_anomaly': is_anomaly,
                'confidence': confidence,
                'reason': reason,
                'distance_from_usual_km': distance,
                'z_score': z_score,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error detecting time pattern anomaly: {str(e)}")
            return {
                'is_anomaly': False,
                'confidence': 0.0,
                'reason': 'Detection error'
            }
    
    def _extract_movement_features(self, locations):
        """Extract features from movement data"""
        if len(locations) < 2:
            return {}
        
        features = {}
        
        # Calculate speeds between points
        speeds = []
        distances = []
        time_intervals = []
        
        for i in range(1, len(locations)):
            prev_loc = locations[i-1]
            curr_loc = locations[i]
            
            # Distance
            prev_coords = (prev_loc['location']['coordinates'][1], prev_loc['location']['coordinates'][0])
            curr_coords = (curr_loc['location']['coordinates'][1], curr_loc['location']['coordinates'][0])
            distance = geodesic(prev_coords, curr_coords).kilometers
            distances.append(distance)
            
            # Time interval
            prev_time = prev_loc.get('createdAt', datetime.utcnow())
            curr_time = curr_loc.get('createdAt', datetime.utcnow())
            
            if isinstance(prev_time, str):
                prev_time = datetime.fromisoformat(prev_time.replace('Z', '+00:00'))
            if isinstance(curr_time, str):
                curr_time = datetime.fromisoformat(curr_time.replace('Z', '+00:00'))
            
            time_diff = (curr_time - prev_time).total_seconds()
            time_intervals.append(time_diff)
            
            # Speed
            if time_diff > 0:
                speed = (distance * 1000) / time_diff  # m/s
                speeds.append(speed)
        
        # Calculate feature statistics
        features.update({
            'avg_speed': np.mean(speeds) if speeds else 0,
            'max_speed': np.max(speeds) if speeds else 0,
            'speed_variance': np.var(speeds) if speeds else 0,
            'total_distance': sum(distances),
            'avg_time_interval': np.mean(time_intervals) if time_intervals else 0,
            'max_time_gap': np.max(time_intervals) if time_intervals else 0,
            'num_stops': sum(1 for speed in speeds if speed < 0.1),  # Very low speed = stop
            'direction_changes': self._count_direction_changes(locations)
        })
        
        return features
    
    def _count_direction_changes(self, locations):
        """Count significant direction changes"""
        if len(locations) < 3:
            return 0
        
        direction_changes = 0
        threshold_angle = 45  # degrees
        
        for i in range(2, len(locations)):
            # Calculate bearings
            bearing1 = self._calculate_bearing(
                locations[i-2]['location']['coordinates'],
                locations[i-1]['location']['coordinates']
            )
            bearing2 = self._calculate_bearing(
                locations[i-1]['location']['coordinates'],
                locations[i]['location']['coordinates']
            )
            
            # Calculate angle difference
            angle_diff = abs(bearing2 - bearing1)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            
            if angle_diff > threshold_angle:
                direction_changes += 1
        
        return direction_changes
    
    def _calculate_bearing(self, point1, point2):
        """Calculate bearing between two points"""
        lat1, lon1 = np.radians(point1[1]), np.radians(point1[0])
        lat2, lon2 = np.radians(point2[1]), np.radians(point2[0])
        
        dlon = lon2 - lon1
        
        y = np.sin(dlon) * np.cos(lat2)
        x = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
        
        bearing = np.arctan2(y, x)
        bearing = np.degrees(bearing)
        bearing = (bearing + 360) % 360
        
        return bearing
    
    def _calculate_movement_anomaly_score(self, current_features, historical_features):
        """Calculate anomaly score for movement pattern"""
        if not historical_features:
            return 0.0
        
        # Calculate z-scores for each feature
        z_scores = []
        
        for feature_name in current_features:
            if feature_name in historical_features[0]:
                historical_values = [hf[feature_name] for hf in historical_features if feature_name in hf]
                
                if len(historical_values) > 1:
                    mean_val = np.mean(historical_values)
                    std_val = np.std(historical_values)
                    
                    if std_val > 0:
                        z_score = abs((current_features[feature_name] - mean_val) / std_val)
                        z_scores.append(z_score)
        
        if not z_scores:
            return 0.0
        
        # Use maximum z-score as anomaly indicator
        max_z_score = max(z_scores)
        
        # Convert to probability-like score
        anomaly_score = min(max_z_score / 3, 1.0)
        
        return anomaly_score
    
    def _determine_movement_anomaly_reason(self, current_features, historical_features):
        """Determine the reason for movement anomaly"""
        if not historical_features:
            return "No historical patterns for comparison"
        
        # Check which feature is most anomalous
        max_z_score = 0
        anomalous_feature = None
        
        for feature_name in current_features:
            if feature_name in historical_features[0]:
                historical_values = [hf[feature_name] for hf in historical_features if feature_name in hf]
                
                if len(historical_values) > 1:
                    mean_val = np.mean(historical_values)
                    std_val = np.std(historical_values)
                    
                    if std_val > 0:
                        z_score = abs((current_features[feature_name] - mean_val) / std_val)
                        if z_score > max_z_score:
                            max_z_score = z_score
                            anomalous_feature = feature_name
        
        if anomalous_feature:
            feature_descriptions = {
                'avg_speed': 'unusual average speed',
                'max_speed': 'unusual maximum speed',
                'speed_variance': 'unusual speed variation',
                'total_distance': 'unusual travel distance',
                'direction_changes': 'unusual movement pattern',
                'num_stops': 'unusual number of stops'
            }
            return feature_descriptions.get(anomalous_feature, f'unusual {anomalous_feature}')
        
        return "Movement pattern within normal range"
    
    def _detect_general_speed_anomaly(self, current_speed, location, context):
        """Detect speed anomaly using general thresholds"""
        current_speed_kmh = current_speed * 3.6 if current_speed else 0
        
        # General speed thresholds
        max_walking_speed = 8  # km/h
        max_cycling_speed = 50  # km/h
        max_vehicle_speed = 200  # km/h
        min_vehicle_speed = 5  # km/h when moving
        
        is_anomaly = False
        reason = "Speed within general limits"
        confidence = 0.0
        
        if current_speed_kmh > max_vehicle_speed:
            is_anomaly = True
            reason = f"Extremely high speed: {current_speed_kmh:.1f} km/h"
            confidence = 0.9
        elif current_speed_kmh > 120:  # High speed threshold
            is_anomaly = True
            reason = f"Very high speed: {current_speed_kmh:.1f} km/h"
            confidence = 0.7
        elif current_speed_kmh < 1 and context and context.get('expected_movement', False):
            is_anomaly = True
            reason = "Unexpected stationary state"
            confidence = 0.6
        
        return {
            'is_anomaly': is_anomaly,
            'confidence': confidence,
            'reason': reason,
            'current_speed_kmh': current_speed_kmh,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def train_models(self):
        """Train anomaly detection models"""
        try:
            logger.info("Training anomaly detection models...")
            
            # Get training data
            historical_data = self.db_client.get_historical_incidents(days=60)
            
            if len(historical_data) < 100:
                logger.warning("Insufficient data for anomaly detection training")
                return False
            
            # Train isolation forest for general anomaly detection
            features = []
            for incident in historical_data:
                if 'location' in incident and 'coordinates' in incident['location']:
                    # Extract features for training
                    feature_vector = self._extract_incident_features(incident)
                    if feature_vector:
                        features.append(feature_vector)
            
            if len(features) < 50:
                logger.warning("Insufficient feature data for training")
                return False
            
            X = np.array(features)
            X_scaled = self.scaler.fit_transform(X)
            
            # Train isolation forest
            self.movement_model = IsolationForest(contamination=0.1, random_state=42)
            self.movement_model.fit(X_scaled)
            
            logger.info("Anomaly detection models trained successfully")
            
            # Save models
            self.save_models()
            self.last_trained = datetime.now()
            
            return True
            
        except Exception as e:
            logger.error(f"Error training anomaly detection models: {str(e)}")
            return False
    
    def _extract_incident_features(self, incident):
        """Extract features from incident for training"""
        try:
            coords = incident['location']['coordinates']
            
            # Basic features
            features = [
                coords[1],  # latitude
                coords[0],  # longitude
                incident.get('createdAt', datetime.now()).hour,
                incident.get('createdAt', datetime.now()).weekday(),
            ]
            
            # Add severity encoding
            severity_encoding = {'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
            features.append(severity_encoding.get(incident.get('severity', 'medium'), 0.5))
            
            return features
            
        except Exception as e:
            logger.warning(f"Error extracting incident features: {str(e)}")
            return None
    
    def save_models(self):
        """Save trained models"""
        try:
            os.makedirs('./models', exist_ok=True)
            
            if self.movement_model:
                joblib.dump(self.movement_model, './models/movement_anomaly_model.joblib')
            
            joblib.dump(self.scaler, './models/anomaly_scaler.joblib')
            
            logger.info("Anomaly detection models saved")
            
        except Exception as e:
            logger.error(f"Error saving anomaly models: {str(e)}")
    
    def load_models(self):
        """Load existing trained models"""
        try:
            movement_path = './models/movement_anomaly_model.joblib'
            scaler_path = './models/anomaly_scaler.joblib'
            
            if os.path.exists(movement_path):
                self.movement_model = joblib.load(movement_path)
            
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            
            if self.movement_model:
                logger.info("Anomaly detection models loaded successfully")
                return True
            
        except Exception as e:
            logger.error(f"Error loading anomaly models: {str(e)}")
        
        return False
    
    def retrain(self):
        """Retrain the models"""
        return self.train_models()
    
    def get_status(self):
        """Get model status"""
        return {
            'movement_model_loaded': self.movement_model is not None,
            'last_trained': self.last_trained.isoformat() if self.last_trained else None,
            'model_version': self.model_version
        }