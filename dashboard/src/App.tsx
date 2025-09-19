import { useEffect, useState, useCallback } from 'react';
import './App.css';
import { IncidentTable } from './components/IncidentTable';
import type { Incident } from './components/IncidentTable';
import { IncidentMap } from './components/IncidentMap';
import { EmergencyServicesPanel } from './components/EmergencyServicesPanel';
import { PanicAlertsPanel } from './components/PanicAlertsPanel';
import { UserManagement } from './components/UserManagement';
import { NotificationCenter } from './components/NotificationCenter';
import { LoginPanel } from './auth';
import { useAuthToken } from './hooks/useAuthToken';
import { getSocket } from './lib/socket';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const SOCKET_BASE = import.meta.env.VITE_SOCKET_BASE || '';

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ severity?: string }>({});
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'emergency-contacts' | 'panic-alerts' | 'users' | 'notifications'>('incidents');
  const { token, setToken } = useAuthToken();

  const loadInitial = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidents`, { params: { severity: filters.severity }, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      setIncidents(res.data);
    } catch (e) {
      console.error('Failed to fetch incidents', e);
    } finally {
      setLoading(false);
    }
  }, [filters.severity, token]);

  const loadUserInfo = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    } catch (e) {
      console.error('Failed to fetch user info', e);
      // Token might be invalid, clear it
      setToken(null);
    }
  }, [token, setToken]);

  useEffect(() => {
    loadInitial();
    loadUserInfo();
    const socket = getSocket(SOCKET_BASE);
    
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    // Handle regular incidents
    socket.on('incident', (data: Incident) => {
      // Apply current severity filter client-side if present
      if (!filters.severity || filters.severity === data.severity) {
        setIncidents(prev => [data, ...prev].slice(0, 200));
      }
    });

    // Handle panic alerts specifically
    socket.on('panic-alert', (data: any) => {
      console.log('New panic alert received:', data);
      
      // Show browser notification for panic alerts
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Emergency Alert', {
          body: `Panic button pressed at ${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}`,
          icon: '/favicon.ico',
          tag: 'panic-alert'
        });
      }
      
      // Add to incidents if it's a panic type
      if (data.type === 'panic') {
        const incident: Incident = {
          _id: data._id || Date.now().toString(),
          type: 'panic',
          severity: 'critical',
          status: 'open',
          description: data.message || 'Emergency panic alert triggered',
          createdAt: data.timestamp || new Date().toISOString()
        };
        
        if (!filters.severity || filters.severity === incident.severity) {
          setIncidents(prev => [incident, ...prev].slice(0, 200));
        }
      }
    });

    // Handle emergency contact notifications
    socket.on('emergency-notification', (data: any) => {
      console.log('Emergency contact notification:', data);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📞 Emergency Contact Notified', {
          body: `Emergency contact ${data.contactName} has been notified`,
          icon: '/favicon.ico',
          tag: 'emergency-contact'
        });
      }
    });

    // Request notification permission on first connect
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(loadInitial, 60_000); // fallback refresh
    return () => { 
      socket.off('connect');
      socket.off('disconnect');
      socket.off('incident');
      socket.off('panic-alert');
      socket.off('emergency-notification');
      socket.close(); 
      clearInterval(interval); 
    };
  }, [loadInitial, loadUserInfo, filters.severity]);

  async function acknowledge(id: string) {
    try {
      if (!token) return;
      await axios.post(`${API_BASE}/incidents/${id}/ack`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, status: 'acknowledged' } : i));
    } catch (e) {
      console.error('Ack failed', e);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
  }

  if (!token) return <LoginPanel onAuth={(t) => setToken(t)} />;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color:'#f1f5f9', fontFamily:'Inter, system-ui, sans-serif' }}>
      {/* Enhanced Header */}
      <header style={{ 
        background: 'rgba(30, 41, 59, 0.8)', 
        backdropFilter: 'blur(12px)', 
        borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
            borderRadius: 10, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white'
          }}>S</div>
          <div>
            <h1 style={{ fontSize: 24, margin: 0, fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Suraksha Dashboard
            </h1>
            <p style={{ fontSize: 12, margin: 0, color: '#94a3b8' }}>Emergency Response System</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Connection Status */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '6px 12px',
            borderRadius: 20,
            background: connected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: connected ? '#22c55e' : '#ef4444',
              animation: connected ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{ fontSize: 12, color: connected ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* User Info */}
          {user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              padding: '8px 16px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 12,
              border: '1px solid rgba(51, 65, 85, 0.3)'
            }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold',
                color: 'white'
              }}>
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{user.email}</div>
                <div style={{ 
                  fontSize: 10, 
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: user.role === 'admin' ? '#7c3aed' : user.role === 'officer' ? '#059669' : '#0ea5e9',
                  color: 'white',
                  fontWeight: 500,
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: '6px 8px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  color: '#ef4444',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: 500
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '24px' }}>
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: 2, 
          marginBottom: 24,
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: 12,
          padding: 4,
          border: '1px solid rgba(51, 65, 85, 0.3)'
        }}>
          {[
            { id: 'incidents' as const, label: '📊 Incidents', icon: '📊' },
            { id: 'panic-alerts' as const, label: '🚨 Panic Alerts', icon: '🚨' },
            { id: 'emergency-contacts' as const, label: '🏥 Emergency Services', icon: '🏥' },
            { id: 'users' as const, label: '👥 Users', icon: '👥' },
            { id: 'notifications' as const, label: '🔔 Notifications', icon: '🔔' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <span>{tab.icon}</span>
              {tab.label.replace(tab.icon + ' ', '')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'incidents' && (
          <section style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24 }}>
            {/* Incidents Panel */}
            <div style={{ 
              background:'rgba(30, 41, 59, 0.8)', 
              backdropFilter: 'blur(12px)',
              borderRadius:16, 
              padding:24, 
              border: '1px solid rgba(51, 65, 85, 0.3)',
              overflow:'hidden'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:20, fontWeight: 600, color: '#f1f5f9' }}>Active Incidents</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
                    {incidents.length} total · {incidents.filter(i => i.status === 'open').length} open
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select 
                    value={filters.severity || ''} 
                    onChange={e=>setFilters(f=>({...f, severity: e.target.value || undefined}))} 
                    style={{ 
                      background:'rgba(15, 23, 42, 0.8)', 
                      color:'#e2e8f0', 
                      border:'1px solid rgba(51, 65, 85, 0.5)', 
                      borderRadius:8, 
                      padding:'8px 12px', 
                      fontSize:13,
                      cursor: 'pointer'
                    }}
                  >
                    <option value=''>All Severities</option>
                    <option value='critical'>🔴 Critical</option>
                    <option value='high'>🟠 High</option>
                    <option value='medium'>🟡 Medium</option>
                    <option value='low'>🟢 Low</option>
                  </select>
                  {loading && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      fontSize: 12, 
                      color: '#94a3b8' 
                    }}>
                      <div style={{ 
                        width: 16, 
                        height: 16, 
                        border: '2px solid rgba(148, 163, 184, 0.3)',
                        borderTop: '2px solid #94a3b8',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Loading...
                    </div>
                  )}
                </div>
              </div>
              <IncidentTable incidents={incidents} onAck={acknowledge} />
            </div>

            {/* Map Panel */}
            <div style={{ 
              background:'rgba(30, 41, 59, 0.8)', 
              backdropFilter: 'blur(12px)',
              borderRadius:16, 
              padding:24, 
              minHeight:600, 
              display:'flex', 
              flexDirection:'column',
              border: '1px solid rgba(51, 65, 85, 0.3)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ marginTop:0, marginBottom: 4, fontSize:20, fontWeight: 600, color: '#f1f5f9' }}>Live Map</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                  Showing {Math.min(incidents.length, 100)} incidents
                </p>
              </div>
              <div style={{ flex:1, minHeight:400, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(51, 65, 85, 0.3)' }}>
                <IncidentMap incidents={incidents.slice(0,100)} mapId="incidents-map" />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'panic-alerts' && (
          <section style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24 }}>
            <PanicAlertsPanel token={token || ''} />
            <div style={{ 
              background:'rgba(30, 41, 59, 0.8)', 
              backdropFilter: 'blur(12px)',
              borderRadius:16, 
              padding:24, 
              minHeight:600, 
              display:'flex', 
              flexDirection:'column',
              border: '1px solid rgba(51, 65, 85, 0.3)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ marginTop:0, marginBottom: 4, fontSize:20, fontWeight: 600, color: '#f1f5f9' }}>Panic Alerts Map</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                  Real-time emergency locations
                </p>
              </div>
              <div style={{ flex:1, minHeight:400, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(51, 65, 85, 0.3)' }}>
                <IncidentMap incidents={incidents.filter(i => i.type === 'panic').slice(0,100)} mapId="panic-alerts-map" />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'emergency-contacts' && (
          <section>
            <EmergencyServicesPanel token={token || ''} />
          </section>
        )}

        {activeTab === 'users' && (
          <section>
            <UserManagement token={token || ''} />
          </section>
        )}

        {activeTab === 'notifications' && (
          <section>
            <NotificationCenter token={token || ''} />
          </section>
        )}

        {/* Footer */}
        <footer style={{ 
          marginTop: 32, 
          padding: '16px 0',
          borderTop: '1px solid rgba(51, 65, 85, 0.3)',
          fontSize: 12, 
          color: '#64748b',
          textAlign: 'center'
        }}>
          Suraksha Emergency Response System · Real-time monitoring with 60s fallback refresh
        </footer>
      </div>
    </div>
  );
}

export default App;
