import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { IncidentModel } from '../models/Incident';

const aiRouter = Router();

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://suraksha-ai-service.onrender.com';
const AI_TIMEOUT = 15000; // 15 seconds for heavier calls
const MAX_RETRIES = 2;

import { recordAISuccess, recordAIFailure, getAIStatus } from '../services/aiStatus';

async function callAI<T>(fn: () => Promise<T>, operation: string, res: any, fallbackFactory?: () => any) {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fn();
      recordAISuccess();
      return data;
    } catch (err: any) {
      attempt++;
      const terminal = attempt > MAX_RETRIES;
      const msg = err.response?.data?.error || err.message || 'Unknown AI error';
      if (terminal) {
        recordAIFailure(`${operation}: ${msg}`);
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          return res.status(503).json({
            error: 'AI service unavailable',
            operation,
            attempts: attempt,
            ...(fallbackFactory ? { fallback: fallbackFactory() } : {}),
            ai_status: getAIStatus(),
          });
        }
        return res.status(500).json({
          error: `${operation} failed`,
          message: msg,
          attempts: attempt,
          ai_status: getAIStatus(),
        });
      }
      // brief delay before retry
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }
}

// Request schemas
const routeRiskSchema = z.object({
  route: z.object({
    start: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    end: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    waypoints: z.array(z.object({
      lat: z.number(),
      lng: z.number()
    })).optional()
  }),
  time_of_day: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  user_id: z.string().optional()
});

const anomalyDetectionSchema = z.object({
  user_id: z.string(),
  location_data: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    timestamp: z.string(),
    speed: z.number().optional(),
    accuracy: z.number().optional()
  }))
});

const patternAnalysisSchema = z.object({
  area: z.object({
    center: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    radius_km: z.number()
  }),
  time_range: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  incident_types: z.array(z.string()).optional()
});

const threatAssessmentSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  user_profile: z.object({
    age_group: z.enum(['young', 'adult', 'senior']).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    travel_mode: z.enum(['walking', 'driving', 'public_transport']).optional()
  }).optional(),
  context: z.object({
    time_of_day: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    day_of_week: z.string().optional(),
    weather: z.enum(['clear', 'rainy', 'foggy']).optional()
  }).optional()
});

const safeRouteSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  mode: z.enum(['walking', 'trekking', 'driving']).optional(),
  weather: z.object({
    rain_intensity: z.number().min(0).max(100).optional(),
    flood_risk: z.number().min(0).max(1).optional(),
    visibility_km: z.number().min(0).max(20).optional(),
  }).optional(),
  terrain: z.object({
    slope_risk: z.number().min(0).max(1).optional(),
    forest_density: z.number().min(0).max(1).optional(),
    landslide_risk: z.number().min(0).max(1).optional(),
  }).optional(),
  restricted_zones: z.array(z.object({
    center: z.object({ lat: z.number(), lng: z.number() }),
    radius_m: z.number().positive(),
    name: z.string().optional(),
  })).optional(),
});

// Route Risk Prediction
aiRouter.post('/risk/predict', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parse = routeRiskSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        issues: parse.error.issues 
      });
    }

    const { route, time_of_day, user_id } = parse.data;

    // Call AI service
    const aiResponse = await callAI(
      () => axios.post(
        `${AI_SERVICE_URL}/api/risk/predict`,
        {
          route,
          time_of_day: time_of_day || getCurrentTimeOfDay(),
          user_id: user_id || req.user?.id
        },
        { timeout: AI_TIMEOUT }
      ),
      'risk_prediction',
      res,
      () => ({
        risk_score: 30.0,
        risk_level: 'moderate',
        recommendations: ['Exercise normal caution', 'Stay aware of surroundings']
      })
    );

    if (!res.headersSent) {
      res.json({ success: true, data: (aiResponse as any).data || aiResponse });
    }

  } catch (error: any) {
    console.error('Risk prediction error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        fallback: {
          risk_score: 30.0,
          risk_level: 'moderate',
          recommendations: ['Exercise normal caution', 'Stay aware of surroundings']
        }
      });
    }

    res.status(500).json({ 
      error: 'Risk prediction failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Anomaly Detection
aiRouter.post('/anomaly/detect', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parse = anomalyDetectionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        issues: parse.error.issues 
      });
    }

    const { user_id, location_data } = parse.data;

    // Ensure user can only check their own anomalies or is admin
    if (user_id !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Call AI service
    const aiResponse = await callAI(
      () => axios.post(
        `${AI_SERVICE_URL}/api/anomaly/detect`,
        { user_id, location_data },
        { timeout: AI_TIMEOUT }
      ),
      'anomaly_detection',
      res,
      () => ({ is_anomaly: false, confidence_score: 0.0, details: 'Service temporarily unavailable'})
    );
    if (!res.headersSent) {
      res.json({ success: true, data: (aiResponse as any).data || aiResponse });
    }

  } catch (error: any) {
    console.error('Anomaly detection error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        fallback: {
          is_anomaly: false,
          confidence_score: 0.0,
          details: 'Service temporarily unavailable'
        }
      });
    }

    res.status(500).json({ 
      error: 'Anomaly detection failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Pattern Analysis
aiRouter.post('/patterns/analyze', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parse = patternAnalysisSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        issues: parse.error.issues 
      });
    }

    const { area, time_range, incident_types } = parse.data;

    // Default time range if not provided
    const defaultTimeRange = time_range || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      end: new Date().toISOString()
    };

    // Call AI service
    const aiResponse = await callAI(
      () => axios.post(
        `${AI_SERVICE_URL}/api/patterns/analyze`,
        {
          area,
          time_range: defaultTimeRange,
          incident_types
        },
        { timeout: AI_TIMEOUT * 2 }
      ),
      'pattern_analysis',
      res,
      () => ({ hotspots: [], trends: {}, risk_zones: [], insights: [] })
    );
    if (!res.headersSent) {
      res.json({ success: true, data: (aiResponse as any).data || aiResponse });
    }

  } catch (error: any) {
    console.error('Pattern analysis error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        fallback: {
          hotspots: [],
          trends: {},
          risk_zones: [],
          insights: []
        }
      });
    }

    res.status(500).json({ 
      error: 'Pattern analysis failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Threat Assessment
aiRouter.post('/threat/assess', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parse = threatAssessmentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        issues: parse.error.issues 
      });
    }

    const { location, user_profile, context } = parse.data;

    // Default context if not provided
    const defaultContext = context || {
      time_of_day: getCurrentTimeOfDay(),
      day_of_week: new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase()
    };

    // Call AI service
    const aiResponse = await callAI(
      () => axios.post(
        `${AI_SERVICE_URL}/api/threat/assess`,
        {
          location,
          user_profile: user_profile || {},
          context: defaultContext
        },
        { timeout: AI_TIMEOUT }
      ),
      'threat_assessment',
      res,
      () => ({ threat_level: 'moderate', threat_score: 30, contributing_factors: [], recommendations: ['Exercise normal caution']})
    );
    if (!res.headersSent) {
      res.json({ success: true, data: (aiResponse as any).data || aiResponse });
    }

  } catch (error: any) {
    console.error('Threat assessment error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        fallback: {
          threat_level: 'moderate',
          threat_score: 30,
          contributing_factors: [],
          recommendations: ['Exercise normal caution']
        }
      });
    }

    res.status(500).json({ 
      error: 'Threat assessment failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Safe Route Recommendation
aiRouter.post('/routes/recommend', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parse = safeRouteSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: 'Invalid input',
        issues: parse.error.issues,
      });
    }

    const input = parse.data;
    const mode = input.mode || 'walking';
    const restrictedZones = input.restricted_zones || getDefaultRestrictedZones();

    let candidates = await fetchRouteCandidates(input.origin, input.destination, mode);
    if (!candidates.length) {
      candidates = buildSyntheticCandidates(input.origin, input.destination);
    }

    const incidents = await IncidentModel.find({
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      location: { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const evaluated = await Promise.all(
      candidates.map(async (candidate, index) => {
        const weatherRisk = estimateWeatherRisk(input.weather, candidate.path);
        const terrainRisk = estimateTerrainRisk(input.terrain, candidate.path);
        const incidentRisk = estimateIncidentRisk(candidate.path, incidents as any[]);
        const restrictedPenalty = estimateRestrictedPenalty(candidate.path, restrictedZones);

        const heuristicRisk = clamp01(
          weatherRisk * 0.3 + terrainRisk * 0.25 + incidentRisk * 0.35 + restrictedPenalty * 0.1
        );

        const aiRisk = await getAIRouteRisk(candidate.path);
        const routeRisk = aiRisk !== null
          ? clamp01(heuristicRisk * 0.7 + aiRisk * 0.3)
          : heuristicRisk;

        return {
          ...candidate,
          routeRisk,
          breakdown: {
            weather: round3(weatherRisk),
            terrain: round3(terrainRisk),
            incidents: round3(incidentRisk),
            restricted: round3(restrictedPenalty),
            ai: aiRisk === null ? null : round3(aiRisk),
          },
          ordinal: index,
        };
      })
    );

    const fastestEta = Math.min(...evaluated.map((x) => x.etaMinutes));
    const scored = evaluated
      .map((r) => {
        const etaPenalty = clamp01((r.etaMinutes - fastestEta) / Math.max(fastestEta, 1));
        const finalScore = clamp01(r.routeRisk * 0.8 + etaPenalty * 0.2);
        return {
          ...r,
          finalScore,
          etaPenalty,
        };
      })
      .sort((a, b) => a.finalScore - b.finalScore);

    const recommended = scored[0];
    const alternatives = scored.slice(1, 3);

    const hazards = buildRouteHazards(recommended.path, incidents as any[], restrictedZones);

    const rerouteRequired = recommended.routeRisk >= 0.7 || hazards.some((h) => h.severity === 'high');

    res.json({
      success: true,
      data: {
        recommendedRoute: serializeRoute(recommended),
        alternatives: alternatives.map(serializeRoute),
        hazards,
        rerouteRequired,
        metadata: {
          provider: candidates[0]?.provider || 'synthetic',
          mode,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Safe route recommendation error:', error.message);
    res.status(500).json({
      error: 'Safe route recommendation failed',
      message: error.response?.data?.error || error.message,
    });
  }
});

// Area Risk Summary (convenience endpoint)
aiRouter.get('/risk/area/:lat/:lng', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    const radius = parseFloat(req.query.radius as string) || 2.0;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Use pattern analysis to get area risk
    const aiResponse = await callAI(
      () => axios.post(
        `${AI_SERVICE_URL}/api/patterns/analyze`,
        {
          area: {
            center: { lat, lng },
            radius_km: radius
          },
          time_range: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        },
        { timeout: AI_TIMEOUT }
      ),
      'area_risk_summary',
      res,
      () => ({ hotspots: [], trends: {}, risk_zones: [], insights: [] })
    );

    // Extract area summary from pattern analysis
  if (res.headersSent) return; // error already handled
  const data = (aiResponse as any).data || aiResponse;
    const totalIncidents = data.trends?.total_incidents || 0;
    const totalPanicAlerts = data.trends?.total_panic_alerts || 0;
    const hotspotCount = data.hotspots?.length || 0;

    res.json({
      success: true,
      data: {
        location: { lat, lng },
        radius_km: radius,
        total_incidents: totalIncidents,
        total_panic_alerts: totalPanicAlerts,
        hotspot_count: hotspotCount,
        risk_level: totalIncidents > 20 ? 'high' : totalIncidents > 10 ? 'moderate' : 'low',
        daily_average: data.trends?.daily_average || 0,
        insights: data.insights || []
      }
    });

  } catch (error: any) {
    console.error('Area risk summary error:', error.message);
    res.status(500).json({ 
      error: 'Area risk summary failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// AI Service Health Check
// Consolidated Health Check (auth not required)
aiRouter.get('/health', async (_req, res) => {
  try {
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    recordAISuccess();
    res.json({ success: true, ai: aiResponse.data, ai_status: getAIStatus() });
  } catch (error: any) {
    recordAIFailure(error.message);
    res.status(503).json({ success: false, error: 'unavailable', ai_status: getAIStatus() });
  }
});

// AI Service Test Endpoint (no auth required for testing)
aiRouter.post('/test/risk/predict', async (req, res) => {
  try {
    const testData = {
      route: {
        start: { lat: 28.6139, lng: 77.2090 },
        end: { lat: 28.5355, lng: 77.3910 }
      },
      time_of_day: "evening"
    };

    // Call AI service directly
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/risk/predict`, testData, { timeout: AI_TIMEOUT });

    res.json({
      success: true,
      test_mode: true,
      ai_service_response: aiResponse.data,
      test_data_used: testData
    });
  } catch (error: any) {
    console.error('AI service test error:', error.message);
    res.status(503).json({
      success: false,
      error: 'AI service test failed',
      details: error.message,
      ai_service_url: AI_SERVICE_URL
    });
  }
});

// AI Service Health Check (no auth required for testing)
// AI status diagnostics (auth optional but could restrict later)
aiRouter.get('/status', (_req, res) => {
  res.json({ ai_service_url: AI_SERVICE_URL, ...getAIStatus() });
});

// Helper function to determine current time of day
function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

type LatLng = { lat: number; lng: number };

type RouteCandidate = {
  id: string;
  provider: 'google' | 'synthetic';
  etaMinutes: number;
  distanceMeters: number;
  path: LatLng[];
};

async function fetchRouteCandidates(origin: LatLng, destination: LatLng, mode: string): Promise<RouteCandidate[]> {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleApiKey) {
    return buildSyntheticCandidates(origin, destination);
  }

  const modeMap: Record<string, string> = {
    walking: 'walking',
    trekking: 'walking',
    driving: 'driving',
  };

  const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: modeMap[mode] || 'walking',
      alternatives: 'true',
      key: googleApiKey,
    },
    timeout: 8000,
  });

  const routes = Array.isArray(response.data?.routes) ? response.data.routes : [];
  const candidates = routes.slice(0, 4).map((route: any, index: number) => {
    const points = decodePolyline(route.overview_polyline?.points || '');
    const legs = Array.isArray(route.legs) ? route.legs : [];
    const distanceMeters = legs.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0);
    const etaMinutes = Math.max(1, Math.round(legs.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0) / 60));
    return {
      id: `google-${index + 1}`,
      provider: 'google' as const,
      etaMinutes,
      distanceMeters,
      path: points.length ? points : [origin, destination],
    };
  });

  return candidates;
}

function buildSyntheticCandidates(origin: LatLng, destination: LatLng): RouteCandidate[] {
  const baseDistance = haversineMeters(origin, destination);
  const offsets = [0, 0.0025, -0.0025];

  return offsets.map((offset, idx) => {
    const path = interpolateRoute(origin, destination, offset);
    const distance = polylineDistance(path);
    const etaMinutes = Math.max(1, Math.round(distance / 70));
    return {
      id: `synthetic-${idx + 1}`,
      provider: 'synthetic' as const,
      etaMinutes,
      distanceMeters: Math.max(distance, baseDistance),
      path,
    };
  });
}

function interpolateRoute(origin: LatLng, destination: LatLng, offset: number): LatLng[] {
  const points: LatLng[] = [];
  const steps = 12;
  const dx = destination.lng - origin.lng;
  const dy = destination.lat - origin.lat;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const wave = Math.sin(t * Math.PI) * offset;
    points.push({
      lat: origin.lat + (destination.lat - origin.lat) * t + ny * wave,
      lng: origin.lng + (destination.lng - origin.lng) * t + nx * wave,
    });
  }

  return points;
}

function decodePolyline(encoded: string): LatLng[] {
  if (!encoded) return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
}

function estimateWeatherRisk(weather: any, path: LatLng[]): number {
  const fallback = deterministicNoise(path[0], 0.15, 0.45);
  if (!weather) return fallback;

  const rain = clamp01((weather.rain_intensity ?? 20) / 100);
  const flood = clamp01(weather.flood_risk ?? 0.2);
  const visibilityPenalty = clamp01(1 - ((weather.visibility_km ?? 8) / 20));
  return clamp01(rain * 0.4 + flood * 0.45 + visibilityPenalty * 0.15);
}

function estimateTerrainRisk(terrain: any, path: LatLng[]): number {
  const fallback = deterministicNoise(path[path.length - 1], 0.2, 0.5);
  if (!terrain) return fallback;

  const slope = clamp01(terrain.slope_risk ?? 0.4);
  const forest = clamp01(terrain.forest_density ?? 0.3);
  const landslide = clamp01(terrain.landslide_risk ?? 0.25);
  return clamp01(slope * 0.45 + forest * 0.15 + landslide * 0.4);
}

function estimateIncidentRisk(path: LatLng[], incidents: any[]): number {
  if (!incidents.length) return 0.05;

  let weightedHits = 0;
  for (const incident of incidents) {
    const coords = incident?.location?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const point = { lat: coords[1], lng: coords[0] };
    const distance = distancePointToPolylineMeters(point, path);
    if (distance > 600) continue;

    const severityWeight: Record<string, number> = {
      low: 0.4,
      medium: 0.7,
      high: 1,
      critical: 1.3,
    };
    const sev = severityWeight[incident.severity || 'medium'] || 0.7;
    const proximity = clamp01(1 - distance / 600);
    weightedHits += sev * proximity;
  }

  return clamp01(weightedHits / 8);
}

function estimateRestrictedPenalty(path: LatLng[], zones: Array<{ center: LatLng; radius_m: number }>): number {
  if (!zones.length) return 0;
  let worst = 0;
  for (const point of path) {
    for (const zone of zones) {
      const d = haversineMeters(point, zone.center);
      if (d <= zone.radius_m) {
        const inZonePenalty = clamp01(1 - d / zone.radius_m);
        if (inZonePenalty > worst) worst = inZonePenalty;
      }
    }
  }
  return worst;
}

async function getAIRouteRisk(path: LatLng[]): Promise<number | null> {
  try {
    if (path.length < 2) return null;
    const waypointStride = Math.max(2, Math.floor(path.length / 6));
    const waypoints = path.filter((_, idx) => idx > 0 && idx < path.length - 1 && idx % waypointStride === 0);

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/risk/predict`,
      {
        route: {
          start: path[0],
          end: path[path.length - 1],
          waypoints,
        },
        time_of_day: getCurrentTimeOfDay(),
      },
      { timeout: 7000 }
    );
    const score = Number(response.data?.risk_score);
    if (Number.isNaN(score)) return null;
    return clamp01(score / 100);
  } catch {
    return null;
  }
}

function serializeRoute(route: any) {
  return {
    id: route.id,
    provider: route.provider,
    etaMinutes: route.etaMinutes,
    distanceMeters: Math.round(route.distanceMeters),
    riskScore: round3(route.routeRisk),
    finalScore: round3(route.finalScore),
    riskBreakdown: route.breakdown,
    path: route.path.map((p: LatLng) => ({ latitude: p.lat, longitude: p.lng })),
  };
}

function buildRouteHazards(path: LatLng[], incidents: any[], zones: Array<{ center: LatLng; radius_m: number; name?: string }>) {
  const hazards: Array<{ id: string; lat: number; lng: number; severity: 'low' | 'medium' | 'high'; label: string }> = [];

  incidents.slice(0, 150).forEach((incident: any, idx: number) => {
    const coords = incident?.location?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return;
    const point = { lat: coords[1], lng: coords[0] };
    const distance = distancePointToPolylineMeters(point, path);
    if (distance > 350) return;
    hazards.push({
      id: `incident-${incident._id || idx}`,
      lat: point.lat,
      lng: point.lng,
      severity: (incident.severity || 'medium') as 'low' | 'medium' | 'high',
      label: incident.type || 'Incident hotspot',
    });
  });

  zones.forEach((zone, idx) => {
    if (path.some((p) => haversineMeters(p, zone.center) <= zone.radius_m)) {
      hazards.push({
        id: `restricted-${idx}`,
        lat: zone.center.lat,
        lng: zone.center.lng,
        severity: 'high',
        label: zone.name || 'Restricted zone',
      });
    }
  });

  return hazards.slice(0, 25);
}

function getDefaultRestrictedZones() {
  return [
    { center: { lat: 28.7041, lng: 77.1025 }, radius_m: 350, name: 'Restricted perimeter' },
    { center: { lat: 30.3165, lng: 78.0322 }, radius_m: 450, name: 'Landslide caution zone' },
  ];
}

function distancePointToPolylineMeters(point: LatLng, path: LatLng[]): number {
  if (path.length < 2) return 999999;
  let best = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < path.length - 1; i += 1) {
    const d = distancePointToSegmentMeters(point, path[i], path[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

function distancePointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = p.lng;
  const py = p.lat;

  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby || 1;
  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));

  const closest = { lat: ay + aby * t, lng: ax + abx * t };
  return haversineMeters(p, closest);
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function polylineDistance(path: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    total += haversineMeters(path[i], path[i + 1]);
  }
  return total;
}

function deterministicNoise(anchor: LatLng, min: number, max: number): number {
  const raw = Math.abs(Math.sin(anchor.lat * 12.9898 + anchor.lng * 78.233));
  return min + (max - min) * (raw % 1);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

export { aiRouter };