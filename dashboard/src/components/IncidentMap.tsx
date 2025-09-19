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

interface Props { 
  incidents: { _id: string; severity: string; location?: any; type: string; }[];
  mapId?: string; // Add unique map ID
}

export const IncidentMap: React.FC<Props> = ({ incidents, mapId = 'default' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
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
    // Update markers when incidents change
    if (mapRef.current && isInitializedRef.current) {
      try {
        // Clear existing markers
        markersRef.current.forEach(marker => {
          try {
            mapRef.current?.removeLayer(marker);
          } catch (e) {
            console.warn('Error removing marker:', e);
          }
        });
        markersRef.current = [];

        // Add new markers
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
              
              const marker = L.circleMarker([lat, lng], { 
                radius: 8, 
                color: color, 
                fillColor: color, 
                fillOpacity: 0.7,
                weight: 2,
                opacity: 1
              });
              
              marker.bindPopup(`
                <div style="font-family: system-ui; padding: 4px;">
                  <strong style="color: ${color};">${incident.type.toUpperCase()}</strong><br/>
                  <span>Severity: ${incident.severity}</span><br/>
                  <small>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                </div>
              `);
              
              marker.addTo(mapRef.current);
              markersRef.current.push(marker);
            } catch (error) {
              console.warn('Error adding marker for incident:', incident._id, error);
            }
          }
        });

        // Fit map to markers if we have incidents
        if (validIncidents.length > 0 && markersRef.current.length > 0) {
          try {
            const group = new L.FeatureGroup(markersRef.current);
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
  }, [incidents, mapId]);

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
