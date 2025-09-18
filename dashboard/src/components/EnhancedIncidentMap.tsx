import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icons in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface UserLocation {
  _id: string;
  userId: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  speed?: number;
  accuracy?: number;
  timestamp: string;
  user?: {
    email: string;
    name?: string;
  };
}

interface Incident {
  _id: string;
  severity: string;
  location?: any;
  type: string;
  status?: string;
}

interface ClusterGroup {
  incidents: Incident[];
  center: [number, number]; // [lat, lng]
  bounds: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
}

interface Props { 
  incidents: Incident[];
  userLocations?: UserLocation[];
  mapId?: string;
  onIncidentClick?: (incident: Incident) => void;
  enableClustering?: boolean;
  clusterDistance?: number; // Distance in pixels to cluster markers
}

export const EnhancedIncidentMap: React.FC<Props> = ({ 
  incidents, 
  userLocations = [], 
  mapId = 'default',
  onIncidentClick,
  enableClustering = true,
  clusterDistance = 50
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const incidentMarkersRef = useRef<L.CircleMarker[]>([]);
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Add visibility observer to handle tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (mapRef.current && !document.hidden) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current && mapContainerRef.current && !isInitializedRef.current) {
      try {
        isInitializedRef.current = true;
        
        mapRef.current = L.map(mapContainerRef.current, { 
          center: [20.26, 85.82], 
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
          minZoom: 3,
          tileSize: 256,
          zoomOffset: 0
        }).addTo(mapRef.current);
        
        // Add zoom event listener for clustering
        mapRef.current.on('zoomend', updateMarkers);
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 100);
        
      } catch (error) {
        console.error('Error initializing map:', error);
        isInitializedRef.current = false;
      }
    }

    return () => {
      if (mapRef.current && isInitializedRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        } finally {
          mapRef.current = null;
          isInitializedRef.current = false;
        }
      }
    };
  }, []);

  const createClusterGroups = (incidents: Incident[]): ClusterGroup[] => {
    if (!enableClustering || !mapRef.current) return [];

    const zoom = mapRef.current.getZoom();
    const clusters: ClusterGroup[] = [];
    const processed = new Set<string>();

    // Don't cluster at high zoom levels
    if (zoom > 14) return [];

    incidents.forEach(incident => {
      if (processed.has(incident._id) || !incident.location?.coordinates) return;

      const [lng, lat] = incident.location.coordinates;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const point = mapRef.current!.latLngToContainerPoint([lat, lng]);
      const nearbyIncidents = [incident];
      processed.add(incident._id);

      // Find nearby incidents
      incidents.forEach(otherIncident => {
        if (processed.has(otherIncident._id) || !otherIncident.location?.coordinates) return;

        const [otherLng, otherLat] = otherIncident.location.coordinates;
        if (otherLat < -90 || otherLat > 90 || otherLng < -180 || otherLng > 180) return;

        const otherPoint = mapRef.current!.latLngToContainerPoint([otherLat, otherLng]);
        const distance = Math.sqrt(
          Math.pow(point.x - otherPoint.x, 2) + Math.pow(point.y - otherPoint.y, 2)
        );

        if (distance <= clusterDistance) {
          nearbyIncidents.push(otherIncident);
          processed.add(otherIncident._id);
        }
      });

      if (nearbyIncidents.length > 1) {
        // Calculate cluster bounds and center
        const lats = nearbyIncidents.map(i => i.location.coordinates[1]);
        const lngs = nearbyIncidents.map(i => i.location.coordinates[0]);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        clusters.push({
          incidents: nearbyIncidents,
          center: [centerLat, centerLng],
          bounds: [[minLat, minLng], [maxLat, maxLng]]
        });
      }
    });

    return clusters;
  };

  const updateMarkers = () => {
    if (!mapRef.current || !isInitializedRef.current) return;

    try {
      // Clear existing markers
      [...incidentMarkersRef.current, ...clusterMarkersRef.current, ...userMarkersRef.current].forEach(marker => {
        try {
          mapRef.current?.removeLayer(marker);
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      incidentMarkersRef.current = [];
      clusterMarkersRef.current = [];
      userMarkersRef.current = [];

      // Get valid incidents
      const validIncidents = incidents.filter(i => 
        i.location?.coordinates && 
        Array.isArray(i.location.coordinates) && 
        i.location.coordinates.length === 2 &&
        typeof i.location.coordinates[0] === 'number' &&
        typeof i.location.coordinates[1] === 'number'
      );

      // Create clusters
      const clusters = createClusterGroups(validIncidents);
      const clusteredIncidentIds = new Set(
        clusters.flatMap(cluster => cluster.incidents.map(i => i._id))
      );

      // Add cluster markers
      clusters.forEach(cluster => {
        if (!mapRef.current) return;

        const severityCounts = cluster.incidents.reduce((acc, incident) => {
          acc[incident.severity] = (acc[incident.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dominantSeverity = Object.entries(severityCounts)
          .sort(([,a], [,b]) => b - a)[0][0];

        const clusterIcon = L.divIcon({
          className: 'cluster-marker',
          html: `<div style="
            width: 40px; 
            height: 40px; 
            background: ${severityColor(dominantSeverity)}; 
            border: 3px solid white; 
            border-radius: 50%; 
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${cluster.incidents.length}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker(cluster.center, { icon: clusterIcon });
        
        const popupContent = `
          <div style="font-family: system-ui; padding: 8px; min-width: 200px;">
            <strong>Incident Cluster (${cluster.incidents.length})</strong><br/>
            ${Object.entries(severityCounts).map(([severity, count]) => 
              `<span style="color: ${severityColor(severity)};">${severity}: ${count}</span>`
            ).join('<br/>')}
            <br/><button onclick="zoomToCluster(${cluster.center[0]}, ${cluster.center[1]})" style="margin-top: 8px; padding: 4px 8px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">Zoom In</button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(mapRef.current);
        clusterMarkersRef.current.push(marker);
      });

      // Add individual incident markers (not clustered)
      validIncidents.forEach(incident => {
        if (clusteredIncidentIds.has(incident._id) || !mapRef.current) return;

        const [lng, lat] = incident.location.coordinates;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
        
        const color = severityColor(incident.severity);
        const statusColor = getStatusColor(incident.status);
        
        const marker = L.circleMarker([lat, lng], { 
          radius: 8, 
          color: color, 
          fillColor: statusColor, 
          fillOpacity: 0.7,
          weight: 2,
          opacity: 1
        });
        
        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 8px; min-width: 200px;">
            <strong style="color: ${color};">${incident.type.toUpperCase()}</strong><br/>
            <span>Severity: <span style="color: ${color};">${incident.severity}</span></span><br/>
            <span>Status: <span style="color: ${statusColor};">${incident.status || 'open'}</span></span><br/>
            <small>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
            ${incident.status === 'open' ? '<br/><button onclick="acknowledgeIncident(\'' + incident._id + '\')" style="margin-top: 8px; padding: 4px 8px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">Acknowledge</button>' : ''}
          </div>
        `);

        if (onIncidentClick) {
          marker.on('click', () => onIncidentClick(incident));
        }
        
        marker.addTo(mapRef.current);
        incidentMarkersRef.current.push(marker);
      });

      // Add user location markers
      const validUserLocations = userLocations.filter(loc => 
        loc.location?.coordinates && 
        Array.isArray(loc.location.coordinates) && 
        loc.location.coordinates.length === 2 &&
        typeof loc.location.coordinates[0] === 'number' &&
        typeof loc.location.coordinates[1] === 'number'
      );

      validUserLocations.forEach(userLoc => {
        if (!mapRef.current) return;

        const [lng, lat] = userLoc.location.coordinates;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `<div style="
            width: 16px; 
            height: 16px; 
            background: #3b82f6; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: -4px;
              left: -4px;
              width: 24px;
              height: 24px;
              background: rgba(59, 130, 246, 0.3);
              border-radius: 50%;
              animation: user-pulse 2s infinite;
            "></div>
          </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([lat, lng], { icon: userIcon });
        
        const timeSinceUpdate = new Date().getTime() - new Date(userLoc.timestamp).getTime();
        const minutesAgo = Math.floor(timeSinceUpdate / 60000);
        
        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 8px; min-width: 180px;">
            <strong style="color: #3b82f6;">👤 User Location</strong><br/>
            <span>User: ${userLoc.user?.email || `ID: ${userLoc.userId.slice(-6)}`}</span><br/>
            <span>Last Update: ${minutesAgo < 1 ? 'Just now' : `${minutesAgo}m ago`}</span><br/>
            ${userLoc.speed ? `<span>Speed: ${(userLoc.speed * 3.6).toFixed(1)} km/h</span><br/>` : ''}
            ${userLoc.accuracy ? `<span>Accuracy: ±${userLoc.accuracy.toFixed(0)}m</span><br/>` : ''}
            <small>Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
          </div>
        `);
        
        marker.addTo(mapRef.current);
        userMarkersRef.current.push(marker);
      });

      // Fit map to all markers if we have any
      const allMarkers = [...incidentMarkersRef.current, ...clusterMarkersRef.current, ...userMarkersRef.current];
      if (allMarkers.length > 0) {
        try {
          const group = new L.FeatureGroup(allMarkers);
          const bounds = group.getBounds();
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds.pad(0.1));
          }
        } catch (e) {
          console.warn('Could not fit bounds:', e);
        }
      }
    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [incidents, userLocations, mapId, enableClustering, clusterDistance]);

  // Expose zoom function globally for cluster popup buttons
  useEffect(() => {
    (window as any).zoomToCluster = (lat: number, lng: number) => {
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 16);
      }
    };
    return () => {
      delete (window as any).zoomToCluster;
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef}
      key={mapId}
      style={{ 
        width:'100%', 
        height: '100%', 
        borderRadius: 8,
        minHeight: '400px',
        background: 'rgba(15, 23, 42, 0.8)',
        position: 'relative'
      }} 
    />
  );
};

function severityColor(s: string) {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#10b981';
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'acknowledged': return '#eab308';
    case 'resolved': return '#10b981';
    case 'open':
    default: return '#ef4444';
  }
}