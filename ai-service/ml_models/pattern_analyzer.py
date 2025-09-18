import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import logging
from database.mongodb_client import DatabaseClient
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict

logger = logging.getLogger(__name__)

class PatternAnalyzer:
    def __init__(self):
        self.db_client = DatabaseClient()
        self.model_version = "1.0.0"
        self.last_analyzed = None
        
    def analyze_trends(self, time_range='7d', location=None):
        """Analyze incident trends and patterns"""
        try:
            # Parse time range
            days = int(time_range.replace('d', ''))
            
            # Get incidents for analysis
            if location:
                # Parse location coordinates
                lat, lng = map(float, location.split(','))
                location_bounds = [(lng - 0.1, lat - 0.1), (lng + 0.1, lat + 0.1)]
                incidents = self.db_client.get_historical_incidents(days=days, location_bounds=location_bounds)
            else:
                incidents = self.db_client.get_historical_incidents(days=days)
            
            if len(incidents) < 10:
                return {
                    'error': 'Insufficient data for trend analysis',
                    'incident_count': len(incidents)
                }
            
            # Perform various trend analyses
            trends = {
                'summary': self._analyze_summary_stats(incidents),
                'temporal_trends': self._analyze_temporal_trends(incidents),
                'spatial_trends': self._analyze_spatial_trends(incidents),
                'severity_trends': self._analyze_severity_trends(incidents),
                'type_trends': self._analyze_type_trends(incidents),
                'hotspots': self._identify_hotspots(incidents),
                'predictions': self._generate_predictions(incidents),
                'recommendations': self._generate_recommendations(incidents)
            }
            
            self.last_analyzed = datetime.now()
            return trends
            
        except Exception as e:
            logger.error(f"Error analyzing trends: {str(e)}")
            return {'error': 'Trend analysis failed'}
    
    def _analyze_summary_stats(self, incidents):
        """Analyze basic summary statistics"""
        total_incidents = len(incidents)
        
        # Count by severity
        severity_counts = defaultdict(int)
        type_counts = defaultdict(int)
        
        for incident in incidents:
            severity_counts[incident.get('severity', 'unknown')] += 1
            type_counts[incident.get('type', 'unknown')] += 1
        
        # Calculate daily average
        if incidents:
            date_range = (datetime.utcnow() - incidents[-1]['createdAt']).days + 1
            daily_average = total_incidents / max(date_range, 1)
        else:
            daily_average = 0
        
        return {
            'total_incidents': total_incidents,
            'daily_average': round(daily_average, 2),
            'severity_distribution': dict(severity_counts),
            'type_distribution': dict(type_counts),
            'most_common_severity': max(severity_counts.items(), key=lambda x: x[1])[0] if severity_counts else 'unknown',
            'most_common_type': max(type_counts.items(), key=lambda x: x[1])[0] if type_counts else 'unknown'
        }
    
    def _analyze_temporal_trends(self, incidents):
        """Analyze temporal patterns in incidents"""
        hourly_counts = defaultdict(int)
        daily_counts = defaultdict(int)
        weekly_counts = defaultdict(int)
        
        for incident in incidents:
            timestamp = incident['createdAt']
            
            # Hour of day (0-23)
            hourly_counts[timestamp.hour] += 1
            
            # Day of week (0=Monday, 6=Sunday)
            daily_counts[timestamp.weekday()] += 1
            
            # Week number
            week = timestamp.isocalendar()[1]
            weekly_counts[week] += 1
        
        # Find peak times
        peak_hour = max(hourly_counts.items(), key=lambda x: x[1])[0] if hourly_counts else 0
        peak_day = max(daily_counts.items(), key=lambda x: x[1])[0] if daily_counts else 0
        
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        return {
            'hourly_distribution': dict(hourly_counts),
            'daily_distribution': dict(daily_counts),
            'weekly_trend': dict(weekly_counts),
            'peak_hour': peak_hour,
            'peak_day': day_names[peak_day] if peak_day < 7 else 'Unknown',
            'night_incidents': sum(hourly_counts[h] for h in range(22, 24)) + sum(hourly_counts[h] for h in range(0, 6)),
            'day_incidents': sum(hourly_counts[h] for h in range(6, 22))
        }
    
    def _analyze_spatial_trends(self, incidents):
        """Analyze spatial patterns in incidents"""
        if not incidents:
            return {}
        
        # Extract coordinates
        coordinates = []
        for incident in incidents:
            if 'location' in incident and 'coordinates' in incident['location']:
                coords = incident['location']['coordinates']
                coordinates.append([coords[1], coords[0]])  # [lat, lng]
        
        if len(coordinates) < 5:
            return {'error': 'Insufficient location data'}
        
        coordinates = np.array(coordinates)
        
        # Calculate bounding box
        min_lat, max_lat = coordinates[:, 0].min(), coordinates[:, 0].max()
        min_lng, max_lng = coordinates[:, 1].min(), coordinates[:, 1].max()
        
        # Calculate center
        center_lat = (min_lat + max_lat) / 2
        center_lng = (min_lng + max_lng) / 2
        
        # Calculate spread
        lat_spread = max_lat - min_lat
        lng_spread = max_lng - min_lng
        
        # Perform clustering to identify hotspots
        if len(coordinates) >= 10:
            clustering = DBSCAN(eps=0.01, min_samples=3).fit(coordinates)
            n_clusters = len(set(clustering.labels_)) - (1 if -1 in clustering.labels_ else 0)
        else:
            n_clusters = 0
        
        return {
            'center': [center_lat, center_lng],
            'bounding_box': {
                'min_lat': min_lat,
                'max_lat': max_lat,
                'min_lng': min_lng,
                'max_lng': max_lng
            },
            'spread': {
                'lat_range': lat_spread,
                'lng_range': lng_spread
            },
            'cluster_count': n_clusters,
            'incident_density': len(incidents) / max(lat_spread * lng_spread, 0.001)
        }
    
    def _analyze_severity_trends(self, incidents):
        """Analyze severity trends over time"""
        severity_timeline = defaultdict(lambda: defaultdict(int))
        
        for incident in incidents:
            date = incident['createdAt'].date()
            severity = incident.get('severity', 'unknown')
            severity_timeline[date][severity] += 1
        
        # Calculate severity trend (increasing/decreasing)
        dates = sorted(severity_timeline.keys())
        if len(dates) >= 7:
            # Compare first week vs last week
            first_week = dates[:7]
            last_week = dates[-7:]
            
            first_week_critical = sum(severity_timeline[date]['critical'] for date in first_week)
            last_week_critical = sum(severity_timeline[date]['critical'] for date in last_week)
            
            if last_week_critical > first_week_critical * 1.5:
                trend = 'increasing_severity'
            elif last_week_critical < first_week_critical * 0.5:
                trend = 'decreasing_severity'
            else:
                trend = 'stable_severity'
        else:
            trend = 'insufficient_data'
        
        return {
            'timeline': {str(date): dict(counts) for date, counts in severity_timeline.items()},
            'trend': trend,
            'total_critical': sum(incident.get('severity') == 'critical' for incident in incidents),
            'total_high': sum(incident.get('severity') == 'high' for incident in incidents),
            'total_medium': sum(incident.get('severity') == 'medium' for incident in incidents),
            'total_low': sum(incident.get('severity') == 'low' for incident in incidents)
        }
    
    def _analyze_type_trends(self, incidents):
        """Analyze incident type trends"""
        type_counts = defaultdict(int)
        type_timeline = defaultdict(lambda: defaultdict(int))
        
        for incident in incidents:
            incident_type = incident.get('type', 'unknown')
            type_counts[incident_type] += 1
            
            date = incident['createdAt'].date()
            type_timeline[date][incident_type] += 1
        
        # Calculate growth rates for each type
        growth_rates = {}
        dates = sorted(type_timeline.keys())
        
        if len(dates) >= 7:
            for incident_type in type_counts.keys():
                first_week_count = sum(type_timeline[date][incident_type] for date in dates[:7])
                last_week_count = sum(type_timeline[date][incident_type] for date in dates[-7:])
                
                if first_week_count > 0:
                    growth_rate = ((last_week_count - first_week_count) / first_week_count) * 100
                    growth_rates[incident_type] = round(growth_rate, 1)
        
        return {
            'type_distribution': dict(type_counts),
            'growth_rates': growth_rates,
            'timeline': {str(date): dict(counts) for date, counts in type_timeline.items()},
            'fastest_growing': max(growth_rates.items(), key=lambda x: x[1])[0] if growth_rates else None
        }
    
    def _identify_hotspots(self, incidents):
        """Identify incident hotspots using clustering"""
        if len(incidents) < 10:
            return {'error': 'Insufficient data for hotspot analysis'}
        
        # Extract coordinates
        coordinates = []
        incident_data = []
        
        for incident in incidents:
            if 'location' in incident and 'coordinates' in incident['location']:
                coords = incident['location']['coordinates']
                coordinates.append([coords[1], coords[0]])  # [lat, lng]
                incident_data.append(incident)
        
        if len(coordinates) < 10:
            return {'error': 'Insufficient location data'}
        
        coordinates = np.array(coordinates)
        
        # Perform DBSCAN clustering
        clustering = DBSCAN(eps=0.005, min_samples=5).fit(coordinates)
        
        hotspots = []
        for cluster_id in set(clustering.labels_):
            if cluster_id != -1:  # Ignore noise points
                cluster_points = coordinates[clustering.labels_ == cluster_id]
                cluster_incidents = [incident_data[i] for i, label in enumerate(clustering.labels_) if label == cluster_id]
                
                # Calculate cluster statistics
                center_lat = cluster_points[:, 0].mean()
                center_lng = cluster_points[:, 1].mean()
                incident_count = len(cluster_incidents)
                
                # Analyze cluster severity
                severity_counts = defaultdict(int)
                type_counts = defaultdict(int)
                
                for incident in cluster_incidents:
                    severity_counts[incident.get('severity', 'unknown')] += 1
                    type_counts[incident.get('type', 'unknown')] += 1
                
                # Calculate risk score
                severity_weights = {'critical': 1.0, 'high': 0.8, 'medium': 0.5, 'low': 0.2}
                risk_score = sum(severity_weights.get(sev, 0.5) * count for sev, count in severity_counts.items()) / incident_count
                
                hotspots.append({
                    'id': f'hotspot_{cluster_id}',
                    'center': [center_lat, center_lng],
                    'incident_count': incident_count,
                    'risk_score': round(risk_score, 2),
                    'severity_distribution': dict(severity_counts),
                    'type_distribution': dict(type_counts),
                    'radius_km': self._calculate_cluster_radius(cluster_points)
                })
        
        # Sort by risk score
        hotspots.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return {
            'hotspots': hotspots[:10],  # Top 10 hotspots
            'total_hotspots': len(hotspots),
            'noise_points': sum(1 for label in clustering.labels_ if label == -1)
        }
    
    def _calculate_cluster_radius(self, cluster_points):
        """Calculate the radius of a cluster"""
        if len(cluster_points) < 2:
            return 0
        
        center = cluster_points.mean(axis=0)
        distances = np.sqrt(((cluster_points - center) ** 2).sum(axis=1))
        
        # Use 90th percentile as radius to exclude outliers
        radius_degrees = np.percentile(distances, 90)
        radius_km = radius_degrees * 111.32  # Convert degrees to km (approximate)
        
        return round(radius_km, 2)
    
    def _generate_predictions(self, incidents):
        """Generate simple predictions based on trends"""
        if len(incidents) < 14:
            return {'error': 'Insufficient data for predictions'}
        
        # Calculate daily incident counts for the last 14 days
        daily_counts = defaultdict(int)
        for incident in incidents[-100:]:  # Last 100 incidents
            date = incident['createdAt'].date()
            daily_counts[date] += 1
        
        dates = sorted(daily_counts.keys())[-14:]  # Last 14 days
        counts = [daily_counts[date] for date in dates]
        
        if len(counts) < 7:
            return {'error': 'Insufficient recent data'}
        
        # Simple linear trend prediction
        x = np.arange(len(counts))
        trend = np.polyfit(x, counts, 1)[0]  # Slope of linear fit
        
        # Predict next 7 days
        last_count = counts[-1]
        predictions = []
        
        for i in range(1, 8):
            predicted_count = max(0, int(last_count + trend * i))
            predictions.append(predicted_count)
        
        # Calculate confidence based on trend consistency
        recent_trend = np.mean(counts[-3:]) - np.mean(counts[-7:-3])
        confidence = max(0, min(1, 1 - abs(recent_trend) / max(np.mean(counts), 1)))
        
        return {
            'next_7_days': predictions,
            'trend_direction': 'increasing' if trend > 0.1 else 'decreasing' if trend < -0.1 else 'stable',
            'trend_strength': abs(trend),
            'confidence': round(confidence, 2),
            'expected_total_next_week': sum(predictions)
        }
    
    def _generate_recommendations(self, incidents):
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Analyze temporal patterns
        hourly_counts = defaultdict(int)
        for incident in incidents:
            hourly_counts[incident['createdAt'].hour] += 1
        
        if hourly_counts:
            peak_hour = max(hourly_counts.items(), key=lambda x: x[1])[0]
            night_incidents = sum(hourly_counts[h] for h in range(22, 24)) + sum(hourly_counts[h] for h in range(0, 6))
            total_incidents = len(incidents)
            
            if night_incidents / total_incidents > 0.3:
                recommendations.append({
                    'type': 'temporal',
                    'priority': 'high',
                    'message': 'High nighttime incident rate detected. Consider increased night patrols.',
                    'data': {'night_percentage': round(night_incidents / total_incidents * 100, 1)}
                })
            
            if peak_hour in [17, 18, 19]:
                recommendations.append({
                    'type': 'temporal',
                    'priority': 'medium',
                    'message': 'Peak incidents during evening hours. Focus resources during 5-7 PM.',
                    'data': {'peak_hour': peak_hour}
                })
        
        # Analyze severity trends
        critical_count = sum(1 for incident in incidents if incident.get('severity') == 'critical')
        if critical_count / len(incidents) > 0.15:
            recommendations.append({
                'type': 'severity',
                'priority': 'critical',
                'message': 'High rate of critical incidents. Review emergency response protocols.',
                'data': {'critical_percentage': round(critical_count / len(incidents) * 100, 1)}
            })
        
        # Analyze incident types
        type_counts = defaultdict(int)
        for incident in incidents:
            type_counts[incident.get('type', 'unknown')] += 1
        
        if type_counts.get('panic', 0) / len(incidents) > 0.2:
            recommendations.append({
                'type': 'incident_type',
                'priority': 'high',
                'message': 'High rate of panic alerts. Consider user education on proper panic button usage.',
                'data': {'panic_percentage': round(type_counts['panic'] / len(incidents) * 100, 1)}
            })
        
        return recommendations
    
    def get_status(self):
        """Get analyzer status"""
        return {
            'last_analyzed': self.last_analyzed.isoformat() if self.last_analyzed else None,
            'model_version': self.model_version
        }
    
    def retrain(self):
        """Retrain/refresh analysis (placeholder for consistency)"""
        # Pattern analysis doesn't require training like ML models
        # This method exists for API consistency
        self.last_analyzed = datetime.now()
        return True