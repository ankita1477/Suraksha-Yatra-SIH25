import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

interface AnalyticsData {
  totalIncidents: number;
  activeIncidents: number;
  panicAlerts: number;
  totalUsers: number;
  safeZones: number;
  responseTime: number;
  emergencyContacts: number;
  systemUptime: number;
  incidentsByHour: { hour: number; count: number }[];
  severityDistribution: { severity: string; count: number; color: string }[];
}

interface DashboardAnalyticsProps {
  token: string;
  incidents: any[];
  connected: boolean;
}

export function DashboardAnalytics({ token, incidents, connected }: DashboardAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalIncidents: 0,
    activeIncidents: 0,
    panicAlerts: 0,
    totalUsers: 0,
    safeZones: 0,
    responseTime: 0,
    emergencyContacts: 0,
    systemUptime: 99.8,
    incidentsByHour: [],
    severityDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [token]);

  useEffect(() => {
    // Update analytics when incidents change
    if (incidents.length > 0) {
      updateAnalyticsFromIncidents();
    }
  }, [incidents]);

  const loadAnalytics = async () => {
    if (!token) return;
    
    try {
      const [usersRes, safeZonesRes, contactsRes] = await Promise.all([
        axios.get(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/safe-zones`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/emergency-contacts`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);

      setAnalytics(prev => ({
        ...prev,
        totalUsers: usersRes.data.length || 0,
        safeZones: safeZonesRes.data.length || 0,
        emergencyContacts: contactsRes.data.data?.contacts?.length || 0
      }));
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAnalyticsFromIncidents = () => {
    const totalIncidents = incidents.length;
    const activeIncidents = incidents.filter(i => i.status === 'open').length;
    const panicAlerts = incidents.filter(i => i.type === 'panic').length;

    // Calculate average response time (mock calculation)
    const responseTime = incidents.length > 0 ? 
      Math.round(incidents.reduce((acc, _) => acc + (Math.random() * 10 + 2), 0) / incidents.length) : 0;

    // Group incidents by hour for the last 24 hours
    const now = new Date();
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours();
      const count = incidents.filter(incident => {
        const incidentDate = new Date(incident.createdAt);
        const hourStart = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        return incidentDate >= hourStart && incidentDate < hourEnd;
      }).length;
      return { hour, count };
    });

    // Calculate severity distribution
    const severityMap = new Map([
      ['critical', { count: 0, color: 'bg-red-500' }],
      ['high', { count: 0, color: 'bg-orange-500' }],
      ['medium', { count: 0, color: 'bg-yellow-500' }],
      ['low', { count: 0, color: 'bg-green-500' }]
    ]);

    incidents.forEach(incident => {
      const severity = incident.severity || 'medium';
      if (severityMap.has(severity)) {
        severityMap.get(severity)!.count++;
      }
    });

    const severityDistribution = Array.from(severityMap.entries()).map(([severity, { count, color }]) => ({
      severity,
      count,
      color
    }));

    setAnalytics(prev => ({
      ...prev,
      totalIncidents,
      activeIncidents,
      panicAlerts,
      responseTime,
      incidentsByHour: last24Hours,
      severityDistribution
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-slate-700 rounded w-20"></div>
                <div className="h-8 bg-slate-700 rounded w-12"></div>
              </div>
              <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const analyticsCards = [
    {
      title: 'Total Incidents',
      value: analytics.totalIncidents,
      icon: '📊',
      color: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Active Alerts',
      value: analytics.activeIncidents,
      icon: '🚨',
      color: 'from-red-500/10 to-red-600/10',
      borderColor: 'border-red-500/20',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/20'
    },
    {
      title: 'Panic Alerts',
      value: analytics.panicAlerts,
      icon: '⚠️',
      color: 'from-orange-500/10 to-orange-600/10',
      borderColor: 'border-orange-500/20',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    {
      title: 'System Status',
      value: connected ? 'ONLINE' : 'OFFLINE',
      icon: connected ? '🟢' : '🔴',
      color: connected ? 'from-green-500/10 to-green-600/10' : 'from-red-500/10 to-red-600/10',
      borderColor: connected ? 'border-green-500/20' : 'border-red-500/20',
      textColor: connected ? 'text-green-400' : 'text-red-400',
      bgColor: connected ? 'bg-green-500/20' : 'bg-red-500/20'
    },
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: '👥',
      color: 'from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-500/20',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Safe Zones',
      value: analytics.safeZones,
      icon: '🛡️',
      color: 'from-emerald-500/10 to-emerald-600/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20'
    },
    {
      title: 'Avg Response',
      value: `${analytics.responseTime}min`,
      icon: '⏱️',
      color: 'from-cyan-500/10 to-cyan-600/10',
      borderColor: 'border-cyan-500/20',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20'
    },
    {
      title: 'Emergency Contacts',
      value: analytics.emergencyContacts,
      icon: '🏥',
      color: 'from-pink-500/10 to-pink-600/10',
      borderColor: 'border-pink-500/20',
      textColor: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.color} backdrop-blur-xl rounded-2xl p-6 border ${card.borderColor} hover:border-opacity-40 transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${card.textColor} text-sm font-semibold mb-1`}>{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                <span className={`${card.textColor} text-xl`}>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Hour Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Incidents (Last 24 Hours)</h3>
          <div className="flex items-end gap-1 h-32">
            {analytics.incidentsByHour.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-400 hover:to-blue-300"
                  style={{ height: `${Math.max((data.count / Math.max(...analytics.incidentsByHour.map(d => d.count))) * 100, 5)}%` }}
                  title={`${data.hour}:00 - ${data.count} incidents`}
                ></div>
                <span className="text-xs text-slate-400 mt-1">{data.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Severity Distribution</h3>
          <div className="space-y-3">
            {analytics.severityDistribution.map((severity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${severity.color}`}></div>
                <span className="text-sm text-slate-300 capitalize flex-1">{severity.severity}</span>
                <span className="text-sm font-semibold text-slate-100">{severity.count}</span>
                <div className="w-24 bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${severity.color} transition-all duration-500`}
                    style={{
                      width: `${analytics.totalIncidents > 0 ? (severity.count / analytics.totalIncidents) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}