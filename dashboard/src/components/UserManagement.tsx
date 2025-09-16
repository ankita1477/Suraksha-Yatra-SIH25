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
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid rgba(51, 65, 85, 0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f1f5f9' }}>
            User Management
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
            Monitor active users and their status
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 20,
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        padding: 4
      }}>
        {[
          { id: 'users' as const, label: '👥 Users', count: users.length },
          { id: 'locations' as const, label: '📍 Locations', count: userLocations.length },
          { id: 'tokens' as const, label: '🔔 Tokens', count: notificationTokens.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeView === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeView === tab.id ? '#93c5fd' : '#94a3b8',
              border: activeView === tab.id ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {tab.label}
            <span style={{
              padding: '2px 6px',
              background: 'rgba(156, 163, 175, 0.2)',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 700
            }}>
              {tab.count}
            </span>
          </button>
        ))}
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
          padding: 40,
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
          <span style={{ color: '#94a3b8' }}>Loading user data...</span>
        </div>
      ) : (
        <>
          {/* Users View */}
          {activeView === 'users' && (
            <div>
              {users.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 40,
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>👥</div>
                  <div>No users found</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    User data will appear here when available
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>User</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Role</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Locations</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Tokens</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Last Active</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => {
                        const lastLocation = getLastLocation(user._id);
                        return (
                          <tr
                            key={user._id}
                            style={{
                              borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                              background: index % 2 === 0 ? 'rgba(15, 23, 42, 0.2)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                                  <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{user.email}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
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
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#64748b'
            }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>🔔</div>
              <div>Push notification tokens</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Device notification tokens will be managed here
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};