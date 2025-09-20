import { useEffect, useState, useCallback } from 'react';
import { EnhancedIncidentTable } from './components/EnhancedIncidentTable';
import type { Incident } from './components/EnhancedIncidentTable';
import { EnhancedIncidentMap } from './components/EnhancedIncidentMap';
import { EmergencyServicesPanel } from './components/EmergencyServicesPanel';
import { EmergencyContactsPanel } from './components/EmergencyContactsPanel';
import { PanicAlertsPanel } from './components/PanicAlertsPanel';
import { UserManagement } from './components/UserManagement';
import { SafeZoneManagement } from './components/SafeZoneManagement';
import { NotificationCenter } from './components/NotificationCenter';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { ToastProvider, useToast, showSuccess, showError, showWarning, showInfo } from './components/ToastProvider';
import { LoginPanel } from './auth';
import { useAuthToken } from './hooks/useAuthToken';
import { getSocket } from './lib/socket';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const SOCKET_BASE = import.meta.env.VITE_SOCKET_BASE || 'http://127.0.0.1:4000';

function DashboardApp() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ severity?: string }>({});
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'emergency-contacts' | 'emergency-services' | 'panic-alerts' | 'users' | 'notifications' | 'safe-zones'>('incidents');
  const { token, setToken } = useAuthToken();
  const { addToast } = useToast();

  const loadInitial = useCallback(async () => {
    if (!token) return; // Don't make requests without token
    try {
      const res = await axios.get(`${API_BASE}/incidents`, { 
        params: { severity: filters.severity }, 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });
      setIncidents(res.data);
    } catch (e) {
      console.error('Failed to fetch incidents', e);
      // Don't clear token on network errors, only on auth errors
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [filters.severity, token]);

  const loadUserInfo = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });
      setUser(res.data);
    } catch (e) {
      console.error('Failed to fetch user info', e);
      // Only clear token if it's actually unauthorized (401), not on network errors
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setToken(null);
      }
    }
  }, [token]);

  useEffect(() => {
    // Only run if we have a token
    if (!token) return;
    
    // Debounce the initial load to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      loadInitial();
      loadUserInfo();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [token]); // Only depend on token, not the functions to prevent dependency loop

  useEffect(() => {
    try {
      const socket = getSocket(SOCKET_BASE);
      
      socket.on('connect', () => {
        console.log('Dashboard connected to WebSocket');
        setConnected(true);
        addToast(showSuccess('Connection Established', 'Real-time monitoring is now active'));
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Dashboard disconnected from WebSocket:', reason);
        setConnected(false);
        addToast(showWarning('Connection Lost', 'Attempting to reconnect...'));
      });

      socket.on('connect_error', (error) => {
        console.error('Dashboard socket connection error:', error);
        setConnected(false);
        addToast(showError('Connection Error', 'Failed to connect to real-time services'));
      });
      
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
      
      // Show toast notification
      addToast(showError('🚨 PANIC ALERT', `Emergency at ${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}`, 10000));
      
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
      
      addToast(showInfo('📞 Emergency Contact', `${data.contactName} has been notified`));
      
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

    // Only set interval if we have a token
    const interval = token ? setInterval(() => {
      if (token) { // Double-check token still exists
        loadInitial();
      }
    }, 60_000) : null; // fallback refresh only if authenticated
    
    return () => { 
      const socket = getSocket(SOCKET_BASE);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('incident');
      socket.off('panic-alert');
      socket.off('emergency-notification');
      if (interval) clearInterval(interval); 
    };
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      setConnected(false);
    }
  }, [filters.severity]); // Only depend on filters, not token to prevent reconnection on every auth change

  async function acknowledge(id: string) {
    try {
      if (!token) return;
      await axios.post(`${API_BASE}/incidents/${id}/ack`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, status: 'acknowledged' } : i));
      addToast(showSuccess('Incident Acknowledged', 'Incident has been successfully acknowledged'));
    } catch (e) {
      console.error('Ack failed', e);
      addToast(showError('Acknowledgment Failed', 'Could not acknowledge the incident'));
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    addToast(showInfo('Logged Out', 'You have been successfully logged out'));
  }

  if (!token) return <LoginPanel onAuth={(t) => setToken(t)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 font-sans">
      {/* Enhanced Header */}
      <header className="bg-slate-800/95 backdrop-blur-xl border-b border-slate-600/30 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-700 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold m-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
              Suraksha Dashboard
            </h1>
            <p className="text-xs text-slate-400 m-0 font-medium">Emergency Response & Safety Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-600/30">
            <div className="text-center">
              <div className="text-sm font-bold text-green-400">{incidents.filter(i => i.status === 'open').length}</div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
            <div className="w-px h-8 bg-slate-600/50"></div>
            <div className="text-center">
              <div className="text-sm font-bold text-red-400">{incidents.filter(i => i.type === 'panic').length}</div>
              <div className="text-xs text-slate-400">Alerts</div>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            connected 
              ? 'bg-green-500/10 border-green-500/20 text-green-300' 
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              connected 
                ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' 
                : 'bg-red-400'
            }`}></div>
            <span className="text-xs font-semibold">
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-600/30 hover:bg-slate-900/80 transition-all">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-200">{user.email}</div>
                <div className={`text-xs px-2 py-1 rounded-full text-white font-semibold uppercase ${
                  user.role === 'admin' ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 
                  user.role === 'officer' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : 'bg-gradient-to-r from-sky-600 to-sky-700'
                }`}>
                  {user.role}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs cursor-pointer transition-all font-semibold hover:bg-red-500/20 hover:border-red-500/50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Minimalistic Sidebar Navigation */}
        <nav className="w-20 hover:w-72 bg-gradient-to-b from-gray-900/98 to-gray-800/98 backdrop-blur-2xl border-r border-gray-700/30 min-h-[calc(100vh-89px)] p-4 shadow-2xl transition-all duration-300 ease-in-out group overflow-hidden">
          <div className="space-y-2">
            {[
              { id: 'incidents' as const, label: 'Incidents', icon: '📊', iconClass: 'fas fa-chart-line', badge: incidents.filter(i => i.status === 'open').length, color: 'from-blue-400 to-cyan-400' },
              { id: 'panic-alerts' as const, label: 'Panic Alerts', icon: '⚠️', iconClass: 'fas fa-exclamation-triangle', badge: incidents.filter(i => i.type === 'panic').length, color: 'from-red-400 to-pink-400' },
              { id: 'emergency-contacts' as const, label: 'Emergency Contacts', icon: '☎️', iconClass: 'fas fa-phone', color: 'from-green-400 to-emerald-400' },
              { id: 'emergency-services' as const, label: 'Emergency Services', icon: '🏥', iconClass: 'fas fa-hospital', color: 'from-purple-400 to-violet-400' },
              { id: 'safe-zones' as const, label: 'Safe Zones', icon: '🛡️', iconClass: 'fas fa-shield-alt', color: 'from-yellow-400 to-orange-400' },
              { id: 'users' as const, label: 'User Management', icon: '👥', iconClass: 'fas fa-users', color: 'from-indigo-400 to-blue-400' },
              { id: 'notifications' as const, label: 'Notifications', icon: '🔔', iconClass: 'fas fa-bell', color: 'from-pink-400 to-rose-400' }
            ].map(tab => (
              <div key={tab.id} className="relative">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full h-12 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center group-hover:justify-start group-hover:px-4 border border-transparent relative overflow-hidden ${
                    activeTab === tab.id 
                      ? `bg-gradient-to-r ${tab.color} text-black shadow-lg` 
                      : 'text-gray-300 hover:bg-gray-800/60 hover:text-white hover:border-gray-600/30'
                  }`}
                  title={tab.label}
                >
                  <i className={`${tab.iconClass} text-lg transition-all duration-300`}></i>
                  <span className="absolute left-16 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 whitespace-nowrap font-medium">
                    {tab.label}
                  </span>
                  {tab.badge && tab.badge > 0 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-black/20 text-black' 
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Minimalistic Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-700/30 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full h-10 bg-gray-800/60 border border-green-400/30 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-400/10 transition-all duration-300 flex items-center justify-center group-hover:justify-start group-hover:px-3 gap-2">
                <i className="fas fa-plus text-sm"></i>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Alert</span>
              </button>
              <button className="w-full h-10 bg-gray-800/60 border border-blue-400/30 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-400/10 transition-all duration-300 flex items-center justify-center group-hover:justify-start group-hover:px-3 gap-2">
                <i className="fas fa-map-marker-alt text-sm"></i>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Zone</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Enhanced Main Content Area with vibrant design */}
        <main className="flex-1 p-8 overflow-auto max-h-[calc(100vh-89px)] bg-gradient-to-br from-gray-900/30 via-black/50 to-gray-900/30">
          {/* Tab Content */}
          {activeTab === 'incidents' && (
            <section className="space-y-8">
              {/* Enhanced Analytics Dashboard with vibrant cards */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-2xl rounded-3xl p-8 border-2 border-pink-400/20 shadow-2xl shadow-pink-400/10">
                  <DashboardAnalytics 
                    token={token || ''} 
                    incidents={incidents} 
                    connected={connected} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
                {/* Enhanced Incidents Panel */}
                <div className="bg-gradient-to-br from-yellow-400/10 to-orange-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-yellow-400/20 shadow-2xl shadow-yellow-400/10">
                  <div className="flex justify-between items-center mb-6 gap-3">
                    <div>
                      <h2 className="m-0 text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Active Incidents</h2>
                      <p className="mt-2 mb-0 text-sm text-gray-300">
                        {incidents.length} total · {incidents.filter(i => i.status === 'open').length} open
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select 
                        value={filters.severity || ''} 
                        onChange={e=>setFilters(f=>({...f, severity: e.target.value || undefined}))} 
                        className="bg-gray-900/80 text-gray-200 border border-yellow-400/30 rounded-xl px-4 py-2 text-sm cursor-pointer focus:outline-none focus:border-yellow-400 hover:border-yellow-400/50 transition-all duration-300"
                      >
                        <option value=''>All Severities</option>
                        <option value='critical'>🔴 Critical</option>
                        <option value='high'>🟠 High</option>
                        <option value='medium'>🟡 Medium</option>
                        <option value='low'>🟢 Low</option>
                      </select>
                      {loading && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                  <EnhancedIncidentTable incidents={incidents} onAck={acknowledge} />
                </div>

                {/* Map Panel */}
                <div className="bg-gradient-to-br from-blue-400/10 to-cyan-400/10 backdrop-blur-2xl rounded-3xl p-8 min-h-[600px] flex flex-col border-2 border-blue-400/20 shadow-2xl shadow-blue-400/10">
                  <div className="mb-6">
                    <h2 className="mt-0 mb-2 text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Live Map</h2>
                    <p className="m-0 text-sm text-gray-300">
                      Showing {Math.min(incidents.length, 100)} incidents
                    </p>
                  </div>
                  <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border-2 border-blue-400/20">
                    <EnhancedIncidentMap incidents={incidents.slice(0,100)} mapId="incidents-map" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'panic-alerts' && (
            <section className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
              <div className="bg-gradient-to-br from-red-400/10 to-pink-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-red-400/20 shadow-2xl shadow-red-400/10">
                <PanicAlertsPanel token={token || ''} />
              </div>
              <div className="bg-gradient-to-br from-purple-400/10 to-violet-400/10 backdrop-blur-2xl rounded-3xl p-8 min-h-[600px] flex flex-col border-2 border-purple-400/20 shadow-2xl shadow-purple-400/10">
                <div className="mb-6">
                  <h2 className="mt-0 mb-2 text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">Panic Alerts Map</h2>
                  <p className="m-0 text-sm text-gray-300">
                    Real-time emergency locations
                  </p>
                </div>
                <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border-2 border-purple-400/20">
                  <EnhancedIncidentMap incidents={incidents.filter(i => i.type === 'panic').slice(0,100)} mapId="panic-alerts-map" />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'emergency-contacts' && (
            <section className="bg-gradient-to-br from-green-400/10 to-emerald-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-green-400/20 shadow-2xl shadow-green-400/10">
              <EmergencyContactsPanel token={token || ''} />
            </section>
          )}

          {activeTab === 'emergency-services' && (
            <section className="bg-gradient-to-br from-purple-400/10 to-violet-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-purple-400/20 shadow-2xl shadow-purple-400/10">
              <EmergencyServicesPanel token={token || ''} />
            </section>
          )}

          {activeTab === 'users' && (
            <section className="bg-gradient-to-br from-blue-400/10 to-cyan-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-blue-400/20 shadow-2xl shadow-blue-400/10">
              <UserManagement token={token || ''} />
            </section>
          )}

          {activeTab === 'safe-zones' && (
            <section className="bg-gradient-to-br from-yellow-400/10 to-orange-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-yellow-400/20 shadow-2xl shadow-yellow-400/10">
              <SafeZoneManagement />
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="bg-gradient-to-br from-pink-400/10 to-rose-400/10 backdrop-blur-2xl rounded-3xl p-8 border-2 border-pink-400/20 shadow-2xl shadow-pink-400/10">
              <NotificationCenter token={token || ''} />
            </section>
          )}

          {/* Enhanced Footer with vibrant styling */}
          <footer className="mt-12 pt-6 border-t-2 border-pink-400/20 text-sm text-gray-400 text-center">
            <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl px-6 py-4 border border-gray-600/30">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent font-bold">
                Suraksha Emergency Response System
              </span>
              <span className="text-gray-500 mx-2">·</span>
              <span className="font-semibold">AI-Powered Real-time Monitoring</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className="text-xs">60s fallback refresh</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// Main App component with ToastProvider wrapper
function App() {
  return (
    <ToastProvider>
      <DashboardApp />
    </ToastProvider>
  );
}

export default App;
