import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SafeZone {
  _id: string;
  name: string;
  description?: string;
  center: { lat: number; lng: number };
  radius: number;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
}

interface SafeZoneMapProps {
  safeZones: SafeZone[];
  onCreateSafeZone: (safeZone: Omit<SafeZone, '_id' | 'createdAt' | 'isActive'>) => void;
  onUpdateSafeZone: (id: string, updates: Partial<SafeZone>) => void;
  onDeleteSafeZone: (id: string) => void;
}

interface CreateZoneState {
  isCreating: boolean;
  center: { lat: number; lng: number } | null;
  radius: number;
}

function MapClickHandler({ 
  isCreating, 
  onMapClick 
}: { 
  isCreating: boolean; 
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      if (isCreating) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function SafeZoneMap({ 
  safeZones, 
  onCreateSafeZone, 
  onUpdateSafeZone, 
  onDeleteSafeZone 
}: SafeZoneMapProps) {
  const [createZone, setCreateZone] = useState<CreateZoneState>({
    isCreating: false,
    center: null,
    radius: 500
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    alertThreshold: 30
  });
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    if (createZone.isCreating) {
      setCreateZone(prev => ({
        ...prev,
        center: { lat, lng }
      }));
      setShowForm(true);
    }
  };

  const handleCreateZone = () => {
    if (!createZone.center || !formData.name.trim()) return;

    onCreateSafeZone({
      name: formData.name,
      description: formData.description,
      center: createZone.center,
      radius: createZone.radius,
      alertThreshold: formData.alertThreshold
    });

    // Reset form
    setCreateZone({ isCreating: false, center: null, radius: 500 });
    setShowForm(false);
    setFormData({ name: '', description: '', alertThreshold: 30 });
  };

  const handleCancelCreate = () => {
    setCreateZone({ isCreating: false, center: null, radius: 500 });
    setShowForm(false);
    setFormData({ name: '', description: '', alertThreshold: 30 });
  };

  const startCreating = () => {
    setCreateZone(prev => ({ ...prev, isCreating: true }));
  };

  const deleteZone = (zone: SafeZone) => {
    if (window.confirm(`Are you sure you want to delete "${zone.name}"?`)) {
      onDeleteSafeZone(zone._id);
      setSelectedZone(null);
    }
  };

  return (
    <div className="safe-zone-map">
      <div className="map-controls mb-4 p-4 bg-slate-800/70 backdrop-blur border border-slate-600/40 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={startCreating}
            disabled={createZone.isCreating}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white shadow"
          >
            {createZone.isCreating ? 'Click on map to place zone' : 'Create Safe Zone'}
          </button>
          {createZone.isCreating && (
            <>
              <div className="flex items-center gap-2 text-slate-300">
                <label className="text-xs font-medium uppercase tracking-wide">Radius (m)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={createZone.radius}
                  onChange={(e) => setCreateZone(prev => ({ ...prev, radius: parseInt(e.target.value) || 500 }))}
                  className="w-24 px-2 py-1 rounded-md bg-slate-900/80 border border-slate-600/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCancelCreate}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-600/60 hover:bg-slate-500/70 text-slate-100 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="map-container relative">
        <MapContainer
          center={[28.6139, 77.2090]} // Delhi center
          zoom={12}
          style={{ height: '600px', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler 
            isCreating={createZone.isCreating} 
            onMapClick={handleMapClick} 
          />

          {/* Existing safe zones */}
          {safeZones.map((zone) => (
            <React.Fragment key={zone._id}>
              <Circle
                center={[zone.center.lat, zone.center.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: '#10B981',
                  fillColor: '#10B981',
                  fillOpacity: 0.2,
                  weight: 2
                }}
                eventHandlers={{
                  click: () => setSelectedZone(zone)
                }}
              />
              <Marker position={[zone.center.lat, zone.center.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{zone.name}</h3>
                    {zone.description && (
                      <p className="text-gray-600 text-sm mb-2">{zone.description}</p>
                    )}
                    <div className="text-sm space-y-1">
                      <p><strong>Radius:</strong> {zone.radius}m</p>
                      <p><strong>Alert Threshold:</strong> {zone.alertThreshold}s</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setSelectedZone(zone)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteZone(zone)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Preview zone being created */}
          {createZone.center && (
            <>
              <Circle
                center={[createZone.center.lat, createZone.center.lng]}
                radius={createZone.radius}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.3,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
              <Marker position={[createZone.center.lat, createZone.center.lng]} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Create Zone Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900/90 border border-slate-700/60 shadow-2xl rounded-2xl w-full max-w-md p-6 text-slate-200">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Create Safe Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder:text-slate-500"
                  placeholder="Enter zone name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder:text-slate-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Alert Threshold (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                />
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">Time before emergency alert is sent</p>
              </div>
              <div className="text-xs grid grid-cols-2 gap-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
                <p className="text-slate-400"><span className="font-semibold text-slate-300">Center:</span> {createZone.center?.lat.toFixed(5)}, {createZone.center?.lng.toFixed(5)}</p>
                <p className="text-slate-400"><span className="font-semibold text-slate-300">Radius:</span> {createZone.radius} m</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateZone}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600/40 text-white shadow disabled:cursor-not-allowed transition-colors"
              >
                Create Zone
              </button>
              <button
                onClick={handleCancelCreate}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-slate-600/70 hover:bg-slate-500/70 text-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900/90 border border-slate-700/60 shadow-2xl rounded-2xl w-full max-w-md p-6 text-slate-200">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Edit Safe Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Name</label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={(e) => setSelectedZone(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Description</label>
                <textarea
                  value={selectedZone.description || ''}
                  onChange={(e) => setSelectedZone(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Radius (m)</label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    value={selectedZone.radius}
                    onChange={(e) => setSelectedZone(prev => prev ? { ...prev, radius: parseInt(e.target.value) || 500 } : null)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide mb-1 text-slate-300 uppercase">Alert Threshold</label>
                  <input
                    type="number"
                    min="10"
                    max="3600"
                    value={selectedZone.alertThreshold}
                    onChange={(e) => setSelectedZone(prev => prev ? { ...prev, alertThreshold: parseInt(e.target.value) || 30 } : null)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  onUpdateSafeZone(selectedZone._id, {
                    name: selectedZone.name,
                    description: selectedZone.description,
                    radius: selectedZone.radius,
                    alertThreshold: selectedZone.alertThreshold
                  });
                  setSelectedZone(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setSelectedZone(null)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-slate-600/70 hover:bg-slate-500/70 text-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteZone(selectedZone)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-500 text-white shadow transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}