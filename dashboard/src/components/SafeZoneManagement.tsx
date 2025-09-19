import { useState, useEffect } from 'react';
import { SafeZoneMap } from '../components/SafeZoneMap';
import { getSocket } from '../lib/socket';

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

interface UserSafetyStatus {
  userId: string;
  isInSafeZone: boolean;
  currentSafeZones: string[];
  lastUpdate: string;
  alertSent: boolean;
}

export function SafeZoneManagement() {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [userStatuses, setUserStatuses] = useState<UserSafetyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get socket instance
  const socket = getSocket('http://localhost:4000');

  useEffect(() => {
    fetchSafeZones();
    setupSocketListeners();

    return () => {
      socket.off('safe-zone-created');
      socket.off('safe-zone-updated');
      socket.off('safe-zone-deleted');
      socket.off('user-safety-status');
    };
  }, []);

  const fetchSafeZones = async () => {
    try {
      const token = localStorage.getItem('dash_token') || localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/safe-zones', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch safe zones');
      }

      const data = await response.json();
      setSafeZones(data.safeZones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch safe zones');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socket.on('safe-zone-created', (safeZone: SafeZone) => {
      setSafeZones(prev => [safeZone, ...prev]);
    });

    socket.on('safe-zone-updated', (updatedZone: SafeZone) => {
      setSafeZones(prev => prev.map(zone => 
        zone._id === updatedZone._id ? updatedZone : zone
      ));
    });

    socket.on('safe-zone-deleted', ({ id }: { id: string }) => {
      setSafeZones(prev => prev.filter(zone => zone._id !== id));
    });

    socket.on('user-safety-status', (status: UserSafetyStatus) => {
      setUserStatuses(prev => {
        const existing = prev.find(s => s.userId === status.userId);
        if (existing) {
          return prev.map(s => s.userId === status.userId ? status : s);
        }
        return [...prev, status];
      });
    });
  };

  const createSafeZone = async (safeZoneData: Omit<SafeZone, '_id' | 'createdAt' | 'isActive'>) => {
    try {
      const token = localStorage.getItem('dash_token') || localStorage.getItem('authToken');
      const response = await fetch('/api/safe-zones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(safeZoneData)
      });

      if (!response.ok) {
        throw new Error('Failed to create safe zone');
      }

      // Zone will be added via socket event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create safe zone');
    }
  };

  const updateSafeZone = async (id: string, updates: Partial<SafeZone>) => {
    try {
      const token = localStorage.getItem('dash_token') || localStorage.getItem('authToken');
      const response = await fetch(`/api/safe-zones/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update safe zone');
      }

      // Zone will be updated via socket event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update safe zone');
    }
  };

  const deleteSafeZone = async (id: string) => {
    try {
      const token = localStorage.getItem('dash_token') || localStorage.getItem('authToken');
      const response = await fetch(`/api/safe-zones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete safe zone');
      }

      // Zone will be removed via socket event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete safe zone');
    }
  };

  const usersOutsideSafeZones = userStatuses.filter(status => !status.isInSafeZone);
  const usersWithAlerts = userStatuses.filter(status => status.alertSent);

  if (loading) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-400/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-base">Loading safe zones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
          Safe Zone Management
        </h1>
        <p className="text-slate-400 text-sm">
          Create and manage safe zones. Users will receive automatic emergency alerts when they leave safe zones.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-600/30 transition-all hover:border-slate-500/50">
          <h3 className="text-base font-semibold text-slate-300 mb-2">Total Safe Zones</h3>
          <p className="text-3xl font-bold text-blue-500">{safeZones.length}</p>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-600/30 transition-all hover:border-slate-500/50">
          <h3 className="text-base font-semibold text-slate-300 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-green-500">{userStatuses.length}</p>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-600/30 transition-all hover:border-slate-500/50">
          <h3 className="text-base font-semibold text-slate-300 mb-2">Users Outside Safe Zones</h3>
          <p className="text-3xl font-bold text-yellow-500">{usersOutsideSafeZones.length}</p>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-600/30 transition-all hover:border-slate-500/50">
          <h3 className="text-base font-semibold text-slate-300 mb-2">Emergency Alerts Sent</h3>
          <p className="text-3xl font-bold text-red-500">{usersWithAlerts.length}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-600/30 p-6 mb-6">
        <SafeZoneMap
          safeZones={safeZones}
          onCreateSafeZone={createSafeZone}
          onUpdateSafeZone={updateSafeZone}
          onDeleteSafeZone={deleteSafeZone}
        />
      </div>

      {/* User Safety Status */}
      {userStatuses.length > 0 && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-600/30 p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            User Safety Status
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-600/30">
                  <th className="p-3 text-left text-sm font-medium text-slate-400 border-b border-slate-600/30">
                    User ID
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-400 border-b border-slate-600/30">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-400 border-b border-slate-600/30">
                    Safe Zones
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-400 border-b border-slate-600/30">
                    Last Update
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-400 border-b border-slate-600/30">
                    Alert Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {userStatuses.map((status) => (
                  <tr key={status.userId} className={`${status.alertSent ? 'bg-red-500/10' : ''} border-b border-slate-600/20`}>
                    <td className="p-3 text-sm text-slate-200 font-mono">
                      {status.userId.slice(-8)}...
                    </td>
                    <td className="p-3 text-sm">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        status.isInSafeZone 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {status.isInSafeZone ? 'Safe' : 'Outside Safe Zone'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-200">
                      {status.currentSafeZones.length > 0 
                        ? `${status.currentSafeZones.length} zone(s)`
                        : 'None'
                      }
                    </td>
                    <td className="p-3 text-sm text-slate-400">
                      {new Date(status.lastUpdate).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">
                      {status.alertSent && (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300">
                          Alert Sent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}