from pymongo import MongoClient
from config import Config
import logging
from datetime import datetime, timedelta
import pandas as pd

logger = logging.getLogger(__name__)

class DatabaseClient:
    def __init__(self):
        self.client = MongoClient(Config.DATABASE_URL)
        self.db = self.client.get_default_database()
        
        # Collections
        self.incidents = self.db.incidents
        self.user_locations = self.db.userlocations
        self.users = self.db.users
        self.panic_alerts = self.db.panicalerts
        
        logger.info("Database client initialized")
    
    def get_historical_incidents(self, days=30, location_bounds=None):
        """Get historical incidents for training"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = {
                'createdAt': {'$gte': start_date}
            }
            
            if location_bounds:
                # Add geospatial query if location bounds provided
                query['location'] = {
                    '$geoWithin': {
                        '$box': location_bounds
                    }
                }
            
            incidents = list(self.incidents.find(query))
            return incidents
            
        except Exception as e:
            logger.error(f"Error fetching historical incidents: {str(e)}")
            return []
    
    def get_user_movement_patterns(self, user_id, days=7):
        """Get user movement patterns for anomaly detection"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            locations = list(self.user_locations.find({
                'userId': user_id,
                'createdAt': {'$gte': start_date}
            }).sort('createdAt', 1))
            
            return locations
            
        except Exception as e:
            logger.error(f"Error fetching user movement patterns: {str(e)}")
            return []
    
    def get_area_incident_stats(self, latitude, longitude, radius_km=1):
        """Get incident statistics for a specific area"""
        try:
            # Convert radius to degrees (approximate)
            radius_deg = radius_km / 111.32
            
            query = {
                'location': {
                    '$near': {
                        '$geometry': {
                            'type': 'Point',
                            'coordinates': [longitude, latitude]
                        },
                        '$maxDistance': radius_km * 1000  # Convert to meters
                    }
                }
            }
            
            incidents = list(self.incidents.find(query))
            
            # Calculate statistics
            total_incidents = len(incidents)
            severity_counts = {}
            type_counts = {}
            
            for incident in incidents:
                severity = incident.get('severity', 'unknown')
                incident_type = incident.get('type', 'unknown')
                
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
                type_counts[incident_type] = type_counts.get(incident_type, 0) + 1
            
            return {
                'total_incidents': total_incidents,
                'severity_distribution': severity_counts,
                'type_distribution': type_counts,
                'incidents': incidents
            }
            
        except Exception as e:
            logger.error(f"Error fetching area incident stats: {str(e)}")
            return {
                'total_incidents': 0,
                'severity_distribution': {},
                'type_distribution': {},
                'incidents': []
            }
    
    def get_time_based_patterns(self, location_bounds=None):
        """Get time-based incident patterns"""
        try:
            pipeline = [
                {
                    '$match': {
                        'createdAt': {
                            '$gte': datetime.utcnow() - timedelta(days=90)
                        }
                    }
                },
                {
                    '$group': {
                        '_id': {
                            'hour': {'$hour': '$createdAt'},
                            'dayOfWeek': {'$dayOfWeek': '$createdAt'},
                            'severity': '$severity'
                        },
                        'count': {'$sum': 1}
                    }
                }
            ]
            
            if location_bounds:
                pipeline[0]['$match']['location'] = {
                    '$geoWithin': {
                        '$box': location_bounds
                    }
                }
            
            patterns = list(self.incidents.aggregate(pipeline))
            return patterns
            
        except Exception as e:
            logger.error(f"Error fetching time-based patterns: {str(e)}")
            return []
    
    def get_user_profile(self, user_id):
        """Get user profile for personalized risk assessment"""
        try:
            user = self.users.find_one({'_id': user_id})
            
            if user:
                # Get user's historical data
                recent_locations = self.get_user_movement_patterns(user_id, days=30)
                
                # Calculate user-specific metrics
                total_distance = self._calculate_total_distance(recent_locations)
                avg_speed = self._calculate_average_speed(recent_locations)
                common_routes = self._identify_common_routes(recent_locations)
                
                return {
                    'user_info': user,
                    'movement_stats': {
                        'total_distance_km': total_distance,
                        'average_speed_kmh': avg_speed,
                        'common_routes': common_routes
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            return None
    
    def store_prediction(self, prediction_type, input_data, result, model_version):
        """Store prediction results for model improvement"""
        try:
            prediction_doc = {
                'type': prediction_type,
                'input_data': input_data,
                'result': result,
                'model_version': model_version,
                'timestamp': datetime.utcnow()
            }
            
            self.db.predictions.insert_one(prediction_doc)
            
        except Exception as e:
            logger.error(f"Error storing prediction: {str(e)}")
    
    def _calculate_total_distance(self, locations):
        """Calculate total distance traveled from location data"""
        if len(locations) < 2:
            return 0
        
        total_distance = 0
        for i in range(1, len(locations)):
            # Simple distance calculation (should use proper geospatial calculation)
            prev_loc = locations[i-1]['location']['coordinates']
            curr_loc = locations[i]['location']['coordinates']
            
            # Approximate distance using Euclidean distance
            lat_diff = curr_loc[1] - prev_loc[1]
            lon_diff = curr_loc[0] - prev_loc[0]
            distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111.32  # Convert to km
            
            total_distance += distance
        
        return total_distance
    
    def _calculate_average_speed(self, locations):
        """Calculate average speed from location data"""
        if len(locations) < 2:
            return 0
        
        speeds = []
        for location in locations:
            if 'speed' in location and location['speed'] is not None:
                speeds.append(location['speed'] * 3.6)  # Convert m/s to km/h
        
        return sum(speeds) / len(speeds) if speeds else 0
    
    def _identify_common_routes(self, locations):
        """Identify common routes from location data"""
        # Simplified route identification
        # In a real implementation, this would use clustering algorithms
        routes = []
        
        if len(locations) > 10:
            # Group locations into potential routes
            # This is a simplified version
            start_points = locations[::10]  # Sample every 10th location
            
            for i, start in enumerate(start_points[:5]):  # Limit to 5 routes
                routes.append({
                    'route_id': i,
                    'start_location': start['location']['coordinates'],
                    'frequency': len(locations) // 10  # Simplified frequency
                })
        
        return routes