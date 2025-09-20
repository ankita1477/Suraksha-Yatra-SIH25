import { api } from './api';

export interface Route {
  start: {
    lat: number;
    lng: number;
  };
  end: {
    lat: number;
    lng: number;
  };
}

export interface Location {
  lat: number;
  lng: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface RiskPredictionRequest {
  route: Route;
  user_id: string;
  time_of_travel: string;
}

export interface RiskPredictionResponse {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

export interface AnomalyDetectionRequest {
  user_id: string;
  location: Location;
  timestamp: string;
}

export interface AnomalyDetectionResponse {
  is_anomaly: boolean;
  anomaly_score: number;
  anomaly_type: string;
  confidence: number;
}

export interface PatternAnalysisRequest {
  user_id: string;
  time_range: TimeRange;
}

export interface PatternAnalysisResponse {
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    locations: Location[];
  }>;
  insights: string[];
  safety_score: number;
}

export interface ThreatAssessmentRequest {
  location: Location;
  radius: number;
  time_window: number;
}

export interface ThreatAssessmentResponse {
  threat_level: 'low' | 'medium' | 'high';
  threat_score: number;
  incidents_count: number;
  risk_factors: string[];
  recommendations: string[];
}

class AIService {
  /**
   * Predict risk for a given route
   */
  async predictRisk(request: RiskPredictionRequest): Promise<RiskPredictionResponse> {
    try {
      const response = await api.post('/ai/risk/predict', request);
      return response.data;
    } catch (error) {
      console.error('Risk prediction error:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in user behavior/location
   */
  async detectAnomaly(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResponse> {
    try {
      const response = await api.post('/ai/anomaly/detect', request);
      return response.data;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      throw error;
    }
  }

  /**
   * Analyze user patterns
   */
  async analyzePatterns(request: PatternAnalysisRequest): Promise<PatternAnalysisResponse> {
    try {
      const response = await api.post('/ai/patterns/analyze', request);
      return response.data;
    } catch (error) {
      console.error('Pattern analysis error:', error);
      throw error;
    }
  }

  /**
   * Assess threat level for a location
   */
  async assessThreat(request: ThreatAssessmentRequest): Promise<ThreatAssessmentResponse> {
    try {
      const response = await api.post('/ai/threat/assess', request);
      return response.data;
    } catch (error) {
      console.error('Threat assessment error:', error);
      throw error;
    }
  }

  /**
   * Get risk assessment for current location
   */
  async getCurrentLocationRisk(location: Location): Promise<ThreatAssessmentResponse> {
    return this.assessThreat({
      location,
      radius: 1000, // 1km radius
      time_window: 24 // last 24 hours
    });
  }

  /**
   * Check if current location/behavior is anomalous
   */
  async checkCurrentAnomaly(userId: string, location: Location): Promise<AnomalyDetectionResponse> {
    return this.detectAnomaly({
      user_id: userId,
      location,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get safety insights for user
   */
  async getSafetyInsights(userId: string): Promise<PatternAnalysisResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    return this.analyzePatterns({
      user_id: userId,
      time_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  }
}

export default new AIService();