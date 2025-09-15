import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props { incidents: { _id: string; severity: string; location?: any; type: string; }[] }

export const IncidentMap: React.FC<Props> = ({ incidents }) => {
  useEffect(() => {
    const map = L.map('incident-map', { center: [20.26, 85.82], zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    incidents.filter(i => i.location?.coordinates).forEach(i => {
      const [lng, lat] = i.location.coordinates;
      const color = severityColor(i.severity);
      const marker = L.circleMarker([lat, lng], { radius: 6, color, fillColor: color, fillOpacity: 0.8 });
      marker.bindPopup(`<strong>${i.type}</strong><br/>Severity: ${i.severity}`);
      marker.addTo(map);
    });
    return () => { map.remove(); };
  }, [incidents]);
  return <div id="incident-map" style={{ width:'100%', height: '100%', borderRadius:8 }} />;
};

function severityColor(s: string) {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#10b981';
  }
}
