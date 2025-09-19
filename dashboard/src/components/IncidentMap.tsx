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

interface Props { 
  incidents: { _id: string; severity: string; location?: any; type: string; status?: string; }[];
  userLocations?: UserLocation[];
  mapId?: string; // Add unique map ID
}

export const IncidentMap: React.FC<Props> = ({ incidents, userLocations = [], mapId = 'default' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const incidentMarkersRef = useRef<L.CircleMarker[]>([]);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Add visibility observer to handle tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (mapRef.current && !document.hidden) {
        // Invalidate size when map becomes visible
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
        
        // Force map to resize after initialization
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
      // Cleanup only when component unmounts
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
  }, []); // Only run once on mount

  useEffect(() => {
    // Update markers when incidents or user locations change
    if (mapRef.current && isInitializedRef.current) {
      try {
        // Clear existing incident markers
        incidentMarkersRef.current.forEach(marker => {
          try {
            mapRef.current?.removeLayer(marker);
          } catch (e) {
            console.warn('Error removing incident marker:', e);
          }
        });
        incidentMarkersRef.current = [];

        // Clear existing user markers
        userMarkersRef.current.forEach(marker => {
          try {
            mapRef.current?.removeLayer(marker);
          } catch (e) {
            console.warn('Error removing user marker:', e);
          }
        });
        userMarkersRef.current = [];

        // Add incident markers
        const validIncidents = incidents.filter(i => 
          i.location?.coordinates && 
          Array.isArray(i.location.coordinates) && 
          i.location.coordinates.length === 2 &&
          typeof i.location.coordinates[0] === 'number' &&
          typeof i.location.coordinates[1] === 'number'
        );
        
        validIncidents.forEach(incident => {
          if (mapRef.current) {
            try {
              const [lng, lat] = incident.location.coordinates;
              
              // Validate coordinates
              if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                console.warn('Invalid coordinates:', lat, lng);
                return;
              }
              
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
              
              marker.addTo(mapRef.current);
              incidentMarkersRef.current.push(marker);
            } catch (error) {
              console.warn('Error adding marker for incident:', incident._id, error);
            }
          }
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
          if (mapRef.current) {
            try {
              const [lng, lat] = userLoc.location.coordinates;
              
              // Validate coordinates
              if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                console.warn('Invalid user coordinates:', lat, lng);
                return;
              }

              // Create custom user icon
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
            } catch (error) {
              console.warn('Error adding marker for user location:', userLoc._id, error);
            }
          }
        });

        // Fit map to all markers if we have any
        const allMarkers = [...incidentMarkersRef.current, ...userMarkersRef.current];
        if (allMarkers.length > 0) {
          try {
            const group = new L.FeatureGroup(allMarkers);
            const bounds = group.getBounds();
            if (bounds.isValid()) {
              mapRef.current.fitBounds(bounds.pad(0.1));
            }
          } catch (e) {
            // Fallback if fitBounds fails
            console.warn('Could not fit bounds:', e);
          }
        }
      } catch (error) {
        console.error('Error updating map markers:', error);
      }
    }
  }, [incidents, userLocations, mapId]);

  return (
    <div 
      ref={mapContainerRef}
      key={mapId} // Force re-render when mapId changes
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
