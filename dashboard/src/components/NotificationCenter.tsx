import React, { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';

interface NotificationToken {
  _id: string;
  userId: string;
  token: string;
  platform: string;
  deviceInfo?: {
    model: string;
    osVersion: string;
  };
  createdAt: string;
  lastUsed?: string;
}

interface Props {
  token: string;
}

export const NotificationCenter: React.FC<Props> = ({ token }) => {
  const [notificationTokens, setNotificationTokens] = useState<NotificationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingToken, setTestingToken] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('Test notification from Suraksha Dashboard');

  const fetchNotificationTokens = async () => {
    try {
      setLoading(true);
      // Note: We would need to create an endpoint to list all notification tokens
      // For now, we'll simulate the response
      setNotificationTokens([]);
    } catch (err) {
      setError('Failed to fetch notification tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotificationTokens();
    }
  }, [token]);

  const sendTestNotification = async (notificationToken: string) => {
    try {
      setTestingToken(notificationToken);
      
      // This would send a test push notification
      // We would need to create an endpoint for this
      const response = await fetch(`${API_BASE}/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          token: notificationToken,
          message: testMessage,
          title: 'Test Notification'
        })
      });

      if (response.ok) {
        alert('Test notification sent successfully!');
      } else {
        setError('Failed to send test notification');
      }
    } catch (err) {
      setError('Network error while sending test notification');
    } finally {
      setTestingToken(null);
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this notification token?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/push-token/${tokenId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchNotificationTokens();
      } else {
        setError('Failed to revoke token');
      }
    } catch (err) {
      setError('Network error while revoking token');
    }
  };

  const sendBroadcastNotification = async () => {
    if (!confirm('Send notification to all registered devices?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: testMessage,
          title: 'Broadcast from Suraksha'
        })
      });

      if (response.ok) {
        alert('Broadcast notification sent successfully!');
      } else {
        setError('Failed to send broadcast notification');
      }
    } catch (err) {
      setError('Network error while sending broadcast');
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: 24
    }}>
      {/* Notification Tokens List */}
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
              🔔 Notification Tokens
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
              {notificationTokens.length} registered devices
            </p>
          </div>
          <button
            onClick={fetchNotificationTokens}
            style={{
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 8,
              color: '#93c5fd',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
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
            <span style={{ color: '#94a3b8' }}>Loading tokens...</span>
          </div>
        ) : notificationTokens.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#64748b'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>🔔</div>
            <div>No notification tokens found</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Tokens will appear here when users register for notifications
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {notificationTokens.map((notificationToken) => (
              <div
                key={notificationToken._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(51, 65, 85, 0.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>
                        {notificationToken.platform === 'ios' ? '📱' : 
                         notificationToken.platform === 'android' ? '🤖' : '💻'}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
                        {notificationToken.platform} Device
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 8 }}>
                      User: {notificationToken.userId}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      Token: {notificationToken.token.substring(0, 40)}...
                    </div>
                    {notificationToken.deviceInfo && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        {notificationToken.deviceInfo.model} • OS {notificationToken.deviceInfo.osVersion}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Registered: {new Date(notificationToken.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => sendTestNotification(notificationToken.token)}
                      disabled={testingToken === notificationToken.token}
                      style={{
                        padding: '6px 12px',
                        background: testingToken === notificationToken.token ? 'rgba(148, 163, 184, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${testingToken === notificationToken.token ? 'rgba(148, 163, 184, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        borderRadius: 6,
                        color: testingToken === notificationToken.token ? '#94a3b8' : '#86efac',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: testingToken === notificationToken.token ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      {testingToken === notificationToken.token ? 'Sending...' : 'Test'}
                    </button>
                    <button
                      onClick={() => revokeToken(notificationToken._id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 6,
                        color: '#fca5a5',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Test Message */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(51, 65, 85, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#f1f5f9' }}>
            📝 Test Message
          </h3>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test notification message..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 13,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Broadcast Controls */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(51, 65, 85, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#f1f5f9' }}>
            📢 Broadcast Controls
          </h3>
          <div style={{ marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
            Send notifications to all registered devices
          </div>
          <button
            onClick={sendBroadcastNotification}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Send Broadcast
          </button>
        </div>

        {/* Stats */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(51, 65, 85, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#f1f5f9' }}>
            📊 Statistics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Total Devices:</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{notificationTokens.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>iOS Devices:</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                {notificationTokens.filter(t => t.platform === 'ios').length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Android Devices:</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                {notificationTokens.filter(t => t.platform === 'android').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};