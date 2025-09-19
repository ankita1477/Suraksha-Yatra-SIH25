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
      <div className="map-controls mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-4">
          <button
            onClick={startCreating}
            disabled={createZone.isCreating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {createZone.isCreating ? 'Click on map to place zone' : 'Create Safe Zone'}
          </button>
          
          {createZone.isCreating && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Radius (meters):</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={createZone.radius}
                  onChange={(e) => setCreateZone(prev => ({ 
                    ...prev, 
                    radius: parseInt(e.target.value) || 500 
                  }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={handleCancelCreate}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create Safe Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter zone name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alert Threshold (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    alertThreshold: parseInt(e.target.value) || 30 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time before emergency alert is sent
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Center:</strong> {createZone.center?.lat.toFixed(6)}, {createZone.center?.lng.toFixed(6)}</p>
                <p><strong>Radius:</strong> {createZone.radius} meters</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateZone}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Create Zone
              </button>
              <button
                onClick={handleCancelCreate}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Safe Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={(e) => setSelectedZone(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={selectedZone.description || ''}
                  onChange={(e) => setSelectedZone(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Radius (meters)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={selectedZone.radius}
                  onChange={(e) => setSelectedZone(prev => prev ? { 
                    ...prev, 
                    radius: parseInt(e.target.value) || 500 
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alert Threshold (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={selectedZone.alertThreshold}
                  onChange={(e) => setSelectedZone(prev => prev ? { 
                    ...prev, 
                    alertThreshold: parseInt(e.target.value) || 30 
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={() => setSelectedZone(null)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}