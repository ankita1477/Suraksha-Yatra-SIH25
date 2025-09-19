import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

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

interface LocationTrackerProps {
  token?: string;
  onLocationUpdate?: (locations: UserLocation[]) => void;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({ 
  token, 
  onLocationUpdate 
}) => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  const fetchActiveLocations = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const response = await axios.get(`${API_BASE}/location/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newLocations = response.data;
      setLocations(newLocations);
      onLocationUpdate?.(newLocations);
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
      setError(err.response?.data?.error || 'Failed to fetch locations');
    }
  }, [token, onLocationUpdate, API_BASE]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isTracking && token) {
      // Fetch immediately
      fetchActiveLocations();
      
      // Then fetch every 10 seconds
      intervalId = setInterval(fetchActiveLocations, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTracking, token, fetchActiveLocations]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      setError(null);
    }
  };

  return (
    <div className="location-tracker" style={{
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      marginBottom: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#f8fafc',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Real-time Location Tracking
        </h3>
        
        <button
          onClick={toggleTracking}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: isTracking ? '#dc2626' : '#059669',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#fca5a5',
          fontSize: '14px',
          marginBottom: '12px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#94a3b8'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isTracking ? '#10b981' : '#6b7280'
          }} />
          <span style={{ fontSize: '14px' }}>
            Status: {isTracking ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
          Active Users: {locations.length}
        </div>

        {isTracking && (
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>

      {locations.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <details style={{ color: '#e2e8f0' }}>
            <summary style={{ 
              cursor: 'pointer', 
              fontSize: '14px',
              marginBottom: '8px' 
            }}>
              View Active Locations ({locations.length})
            </summary>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              fontSize: '12px'
            }}>
              {locations.map((loc) => (
                <div key={loc._id} style={{
                  padding: '6px 8px',
                  margin: '2px 0',
                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{loc.user?.email || `User ${loc.userId.slice(-6)}`}</span>
                  <span style={{ color: '#94a3b8' }}>
                    {loc.location.coordinates[1].toFixed(4)}, {loc.location.coordinates[0].toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};