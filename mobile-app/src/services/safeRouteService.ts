import { api } from './api';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface SafeRoute {
  id: string;
  provider: 'google' | 'synthetic';
  etaMinutes: number;
  distanceMeters: number;
  riskScore: number;
  finalScore: number;
  riskBreakdown: {
    weather: number;
    terrain: number;
    incidents: number;
    restricted: number;
    ai: number | null;
  };
  path: LatLng[];
}

export interface SafeRouteHazard {
  id: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high';
  label: string;
}

export interface SafeRouteResponse {
  recommendedRoute: SafeRoute;
  alternatives: SafeRoute[];
  hazards: SafeRouteHazard[];
  rerouteRequired: boolean;
  metadata: {
    provider: 'google' | 'synthetic';
    mode: 'walking' | 'trekking' | 'driving';
    generatedAt: string;
  };
}

export async function fetchSafeRouteRecommendation(params: {
  origin: LatLng;
  destination: LatLng;
  mode?: 'walking' | 'trekking' | 'driving';
  weather?: {
    rain_intensity?: number;
    flood_risk?: number;
    visibility_km?: number;
  };
  terrain?: {
    slope_risk?: number;
    forest_density?: number;
    landslide_risk?: number;
  };
}) {
  const response = await api.post('/ai/routes/recommend', {
    origin: { lat: params.origin.latitude, lng: params.origin.longitude },
    destination: { lat: params.destination.latitude, lng: params.destination.longitude },
    mode: params.mode || 'trekking',
    weather: params.weather,
    terrain: params.terrain,
  });

  const payload = response.data?.data as SafeRouteResponse;
  if (!payload || !payload.recommendedRoute) {
    throw new Error('Invalid safe route response');
  }

  return payload;
}
