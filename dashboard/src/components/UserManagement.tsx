import React, { useState, useEffect } from 'react';

interface User {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
  lastActive?: string;
}

interface UserLocation {
  _id: string;
  userId: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  timestamp: string;
  accuracy?: number;
}

interface NotificationToken {
  _id: string;
  userId: string;
  token: string;
  platform: string;
  createdAt: string;
}

interface Props {
  token: string;
}

export const UserManagement: React.FC<Props> = ({ token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [notificationTokens, setNotificationTokens] = useState<NotificationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'users' | 'locations' | 'tokens'>('users');

  const fetchUserLocations = async () => {
    try {
      // Fetch from location endpoint if available
      setUserLocations([]);
    } catch (err) {
      console.error('Error fetching user locations:', err);
    }
  };

  const fetchNotificationTokens = async () => {
    try {
      // This would fetch from a notification tokens endpoint
      setNotificationTokens([]);
    } catch (err) {
      console.error('Error fetching notification tokens:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const profile = await response.json();
        // For now, just show current user's profile
        setUsers([profile.user]);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (err) {
      setError('Network error while fetching user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUserLocations();
      fetchNotificationTokens();
    }
  }, [token]);

  const getUserLocationCount = (userId: string) => {
    return userLocations.filter(loc => loc.userId === userId).length;
  };

  const getUserTokenCount = (userId: string) => {
    return notificationTokens.filter(token => token.userId === userId).length;
  };

  const getLastLocation = (userId: string) => {
    const locations = userLocations
      .filter(loc => loc.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return locations[0];
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">
            User Management
          </h2>
          <p className="mt-1 mb-0 text-sm text-slate-400">
            Monitor active users and their status
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 mb-5 bg-slate-900/60 rounded-lg p-1">
        {[
          { id: 'users' as const, label: '👥 Users', count: users.length },
          { id: 'locations' as const, label: '📍 Locations', count: userLocations.length },
          { id: 'tokens' as const, label: '🔔 Tokens', count: notificationTokens.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
              activeView === tab.id 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
            <span className="px-1.5 py-0.5 bg-slate-400/20 rounded text-xs font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 mb-4 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right bg-none border-none text-red-300 cursor-pointer text-base"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-3">
          <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
          <span className="text-slate-400">Loading user data...</span>
        </div>
      ) : (
        <>
          {/* Users View */}
          {activeView === 'users' && (
            <div>
              {users.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <div className="text-2xl mb-2 opacity-50">👥</div>
                  <div>No users found</div>
                  <div className="text-xs opacity-70 mt-1">
                    User data will appear here when available
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-blue-500/30">
                        <th className="px-4 py-3 text-left text-slate-100 font-semibold text-xs uppercase">User</th>
                        <th className="px-4 py-3 text-left text-slate-100 font-semibold text-xs uppercase">Role</th>
                        <th className="px-4 py-3 text-center text-slate-100 font-semibold text-xs uppercase">Locations</th>
                        <th className="px-4 py-3 text-center text-slate-100 font-semibold text-xs uppercase">Tokens</th>
                        <th className="px-4 py-3 text-left text-slate-100 font-semibold text-xs uppercase">Last Active</th>
                        <th className="px-4 py-3 text-left text-slate-100 font-semibold text-xs uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => {
                        const lastLocation = getLastLocation(user._id);
                        return (
                          <tr
                            key={user._id}
                            className={`border-b border-slate-600/30 ${
                              index % 2 === 0 ? 'bg-slate-900/20' : 'bg-transparent'
                            } hover:bg-slate-700/30 transition-colors`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                  {user.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-slate-200 font-medium">{user.email}</div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    ID: {user._id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 
                                           user.role === 'officer' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: user.role === 'admin' ? '#c4b5fd' : 
                                       user.role === 'officer' ? '#86efac' : '#93c5fd',
                                border: user.role === 'admin' ? '1px solid rgba(139, 92, 246, 0.3)' : 
                                        user.role === 'officer' ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                              }}>
                                {user.role}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>
                              {getUserLocationCount(user._id)}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>
                              {getUserTokenCount(user._id)}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
                              {lastLocation ? (
                                <div>
                                  <div>{new Date(lastLocation.timestamp).toLocaleDateString()}</div>
                                  <div style={{ fontSize: 11, opacity: 0.8 }}>
                                    {new Date(lastLocation.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                'No location data'
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
                              <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                              <div style={{ fontSize: 11, opacity: 0.8 }}>
                                {new Date(user.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Locations View */}
          {activeView === 'locations' && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#64748b'
            }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>📍</div>
              <div>Location tracking data</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Real-time user locations will be displayed here
              </div>
            </div>
          )}

          {/* Tokens View */}
          {activeView === 'tokens' && (
            <div className="text-center py-10 text-slate-500">
              <div className="text-2xl mb-2 opacity-50">🔔</div>
              <div>Push notification tokens</div>
              <div className="text-xs opacity-70 mt-1">
                Device notification tokens will be managed here
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};