import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface IncidentDetails {
  _id: string;
  type: string;
  severity: string;
  status: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  user?: {
    email: string;
    name?: string;
    phone?: string;
  };
}

interface Props {
  incidentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onUpdate?: (incident: IncidentDetails) => void;
}

export const IncidentDetailsDrawer: React.FC<Props> = ({
  incidentId,
  isOpen,
  onClose,
  token,
  onUpdate
}) => {
  const [incident, setIncident] = useState<IncidentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchIncidentDetails();
    }
  }, [isOpen, incidentId]);

  const fetchIncidentDetails = async () => {
    if (!incidentId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncident(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'acknowledge' | 'resolve' | 'escalate') => {
    if (!incident || !token) return;

    setSubmittingAction(true);
    try {
      const endpoint = action === 'escalate' 
        ? `${API_BASE}/incidents/${incident._id}/escalate`
        : `${API_BASE}/incidents/${incident._id}/${action === 'acknowledge' ? 'ack' : 'resolve'}`;
      
      const payload = actionNotes ? { notes: actionNotes } : {};
      
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedIncident = response.data;
      setIncident(updatedIncident);
      onUpdate?.(updatedIncident);
      setActionNotes('');
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} incident`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'acknowledged': return '#eab308';
      case 'resolved': return '#10b981';
      case 'escalated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '500px',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(51, 65, 85, 0.3)',
      borderRight: 'none',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          margin: 0,
          color: '#f1f5f9',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Incident Details
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px'
      }}>
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#94a3b8'
          }}>
            Loading incident details...
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#fca5a5',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {incident && (
          <div style={{ color: '#e2e8f0' }}>
            {/* Basic Info */}
            <section style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                color: '#f1f5f9',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Basic Information
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8' }}>Type:</span>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {incident.type}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8' }}>Severity:</span>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: `${getSeverityColor(incident.severity)}20`,
                    color: getSeverityColor(incident.severity),
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {incident.severity}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8' }}>Status:</span>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: `${getStatusColor(incident.status)}20`,
                    color: getStatusColor(incident.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {incident.status}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8' }}>Created:</span>
                  <span style={{ fontSize: '14px' }}>
                    {formatDateTime(incident.createdAt)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8' }}>Time Ago:</span>
                  <span style={{ fontSize: '14px', color: '#f59e0b' }}>
                    {getTimeSince(incident.createdAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* Location */}
            {incident.location && (
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Location
                </h3>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(51, 65, 85, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <div>Latitude: {incident.location.coordinates[1].toFixed(6)}</div>
                  <div>Longitude: {incident.location.coordinates[0].toFixed(6)}</div>
                  <a
                    href={`https://maps.google.com/?q=${incident.location.coordinates[1]},${incident.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#60a5fa',
                      textDecoration: 'none',
                      marginTop: '8px',
                      display: 'inline-block'
                    }}
                  >
                    📍 View on Maps
                  </a>
                </div>
              </section>
            )}

            {/* Description */}
            {incident.description && (
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Description
                </h3>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(51, 65, 85, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {incident.description}
                </div>
              </section>
            )}

            {/* User Info */}
            {incident.user && (
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Reporter
                </h3>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(51, 65, 85, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <div>📧 {incident.user.email}</div>
                  {incident.user.name && <div>👤 {incident.user.name}</div>}
                  {incident.user.phone && <div>📞 {incident.user.phone}</div>}
                </div>
              </section>
            )}

            {/* Actions */}
            {incident.status === 'open' && (
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Actions
                </h3>
                
                <textarea
                  placeholder="Add notes (optional)..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    backgroundColor: 'rgba(51, 65, 85, 0.3)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    resize: 'vertical',
                    marginBottom: '12px'
                  }}
                />

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleAction('acknowledge')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#eab308',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      opacity: submittingAction ? 0.6 : 1
                    }}
                  >
                    Acknowledge
                  </button>
                  
                  <button
                    onClick={() => handleAction('resolve')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      opacity: submittingAction ? 0.6 : 1
                    }}
                  >
                    Resolve
                  </button>
                  
                  <button
                    onClick={() => handleAction('escalate')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      opacity: submittingAction ? 0.6 : 1
                    }}
                  >
                    Escalate
                  </button>
                </div>
              </section>
            )}

            {/* Timeline */}
            <section>
              <h3 style={{
                margin: '0 0 16px 0',
                color: '#f1f5f9',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Timeline
              </h3>
              
              <div style={{
                borderLeft: '2px solid rgba(51, 65, 85, 0.3)',
                paddingLeft: '16px'
              }}>
                <div style={{
                  position: 'relative',
                  paddingBottom: '16px'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '-21px',
                    top: '2px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    border: '2px solid rgba(15, 23, 42, 1)'
                  }} />
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontWeight: '500', color: '#f1f5f9' }}>
                      Incident Created
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {formatDateTime(incident.createdAt)}
                    </div>
                  </div>
                </div>

                {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
                  <div style={{
                    position: 'relative',
                    paddingBottom: '16px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '-21px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      backgroundColor: getStatusColor(incident.status),
                      borderRadius: '50%',
                      border: '2px solid rgba(15, 23, 42, 1)'
                    }} />
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ fontWeight: '500', color: '#f1f5f9' }}>
                        Status Updated to {incident.status}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {formatDateTime(incident.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};