import React, { useState, useEffect } from 'react';

interface PanicAlert {
  _id: string;
  userId: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  lat: number;
  lng: number;
  timestamp: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  token: string;
  onNewAlert?: (alert: PanicAlert) => void;
}

export const PanicAlertsPanel: React.FC<Props> = ({ token }) => {
  const [alerts, setAlerts] = useState<PanicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    acknowledged: '',
    timeRange: '24h'
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/panic-alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        setError('Failed to fetch panic alerts');
      }
    } catch (err) {
      setError('Network error while fetching alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAlerts();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchAlerts, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/panic-alerts/${alertId}/ack`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchAlerts();
      } else {
        setError('Failed to acknowledge alert');
      }
    } catch (err) {
      setError('Network error while acknowledging alert');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.acknowledged === 'true' && !alert.acknowledged) return false;
    if (filters.acknowledged === 'false' && alert.acknowledged) return false;
    
    const alertTime = new Date(alert.createdAt).getTime();
    const now = Date.now();
    const timeRangeMs = filters.timeRange === '1h' ? 3600000 : 
                       filters.timeRange === '12h' ? 43200000 : 
                       filters.timeRange === '24h' ? 86400000 : 
                       filters.timeRange === '7d' ? 604800000 : Infinity;
                       
    if (now - alertTime > timeRangeMs) return false;
    
    return true;
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid rgba(51, 65, 85, 0.3)',
      height: 'fit-content'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            🚨 Panic Alerts
            {unacknowledgedCount > 0 && (
              <span style={{
                padding: '2px 8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                animation: unacknowledgedCount > 0 ? 'pulse 2s infinite' : 'none'
              }}>
                {unacknowledgedCount}
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
            {filteredAlerts.length} alerts · {unacknowledgedCount} unacknowledged
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filters.acknowledged}
            onChange={(e) => setFilters(f => ({ ...f, acknowledged: e.target.value }))}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#e2e8f0',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <option value="">All Status</option>
            <option value="false">Unacknowledged</option>
            <option value="true">Acknowledged</option>
          </select>
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(f => ({ ...f, timeRange: e.target.value }))}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#e2e8f0',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <option value="1h">Last Hour</option>
            <option value="12h">Last 12h</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#fca5a5',
          marginBottom: 16,
          fontSize: 13
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 20,
          gap: 12
        }}>
          <div style={{
            width: 20,
            height: 20,
            border: '2px solid rgba(148, 163, 184, 0.3)',
            borderTop: '2px solid #94a3b8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ color: '#94a3b8' }}>Loading alerts...</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 20,
          color: '#64748b'
        }}>
          <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>🚨</div>
          <div>No panic alerts found</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            {filters.acknowledged || filters.timeRange !== 'all' ? 'Try adjusting filters' : 'Alerts will appear here when triggered'}
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              style={{
                background: alert.acknowledged ? 'rgba(15, 23, 42, 0.4)' : 'rgba(239, 68, 68, 0.1)',
                border: alert.acknowledged ? '1px solid rgba(51, 65, 85, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>🚨</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: alert.acknowledged ? '#94a3b8' : '#ef4444' }}>
                      Emergency Alert
                    </span>
                    {!alert.acknowledged && (
                      <span style={{
                        padding: '2px 6px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        Active
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 8 }}>
                    {alert.message}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                    <div>
                      <strong>User ID:</strong> {alert.userId}
                    </div>
                    <div>
                      <strong>Location:</strong> {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                    </div>
                    <div>
                      <strong>Time:</strong> {new Date(alert.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Status:</strong> {alert.acknowledged ? 
                        <span style={{ color: '#86efac' }}>Acknowledged</span> : 
                        <span style={{ color: '#fca5a5' }}>Pending</span>
                      }
                    </div>
                  </div>
                  {alert.acknowledged && alert.acknowledgedBy && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      <strong>Acknowledged by:</strong> {alert.acknowledgedBy}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert._id)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // Open location in maps (example with Google Maps)
                      const mapsUrl = `https://www.google.com/maps?q=${alert.lat},${alert.lng}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: 6,
                      color: '#93c5fd',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    View Map
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};