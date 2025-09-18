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
  responses?: Array<{
    _id: string;
    responderId: string;
    responder: {
      email: string;
      name?: string;
    };
    action: string;
    timestamp: string;
    notes?: string;
  }>;
  timeline?: Array<{
    timestamp: string;
    action: string;
    user: string;
    details?: string;
  }>;
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
    }
  }, [incident, isOpen]);

  const fetchIncidentTimeline = async () => {
    if (!incident || !token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/incidents/${incident._id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeline(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!incident || !token || !notes.trim()) return;
    
    setAddingNote(true);
    try {
      await axios.post(`${API_BASE}/incidents/${incident._id}/notes`, 
        { note: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes('');
      fetchIncidentTimeline(); // Refresh timeline
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'acknowledged': return '#eab308';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !incident) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(51, 65, 85, 0.3)',
      borderRight: 'none',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
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
          color: '#f8fafc',
          fontSize: '18px',
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
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px'
      }}>
        {/* Basic Info */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            alignItems: 'center'
          }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              backgroundColor: getSeverityColor(incident.severity) + '20',
              color: getSeverityColor(incident.severity),
              border: `1px solid ${getSeverityColor(incident.severity)}40`
            }}>
              {incident.severity}
            </span>
            <span style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              backgroundColor: getStatusColor(incident.status) + '20',
              color: getStatusColor(incident.status),
              border: `1px solid ${getStatusColor(incident.status)}40`
            }}>
              {incident.status}
            </span>
          </div>

          <h3 style={{
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            {incident.type.toUpperCase()} Alert
          </h3>

          <p style={{
            color: '#cbd5e1',
            fontSize: '14px',
            margin: '0 0 16px 0',
            lineHeight: '1.5'
          }}>
            {incident.description || 'No description provided'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '13px'
          }}>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Created</span>
              <span style={{ color: '#e2e8f0' }}>{formatDate(incident.createdAt)}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>ID</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
                {incident._id.slice(-8)}
              </span>
            </div>
          </div>

          {incident.location && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '13px' }}>Location</span>
              <span style={{ color: '#e2e8f0', fontSize: '13px' }}>
                {incident.location.coordinates[1].toFixed(6)}, {incident.location.coordinates[0].toFixed(6)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {incident.status === 'open' && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(incident._id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#eab308',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Acknowledge
              </button>
            )}
            {onResolve && (
              <button
                onClick={() => onResolve(incident._id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Resolve
              </button>
            )}
          </div>
        )}

        {incident.status === 'acknowledged' && onResolve && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => onResolve(incident._id)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Mark as Resolved
            </button>
          </div>
        )}

        {/* Add Note */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Add Note
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add investigation notes, updates, or comments..."
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              backgroundColor: 'rgba(51, 65, 85, 0.5)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '8px'
            }}
          />
          <button
            onClick={addNote}
            disabled={!notes.trim() || addingNote}
            style={{
              padding: '6px 12px',
              backgroundColor: notes.trim() ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: notes.trim() ? 'pointer' : 'not-allowed',
              opacity: addingNote ? 0.7 : 1
            }}
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </button>
        </div>

        {/* Timeline */}
        <div>
          <h4 style={{
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 16px 0'
          }}>
            Timeline
          </h4>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{
                color: '#94a3b8',
                fontSize: '14px'
              }}>
                Loading timeline...
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{
                position: 'absolute',
                left: '8px',
                top: '8px',
                bottom: '8px',
                width: '2px',
                backgroundColor: 'rgba(71, 85, 105, 0.5)'
              }} />

              {timeline.length === 0 ? (
                <div style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontStyle: 'italic'
                }}>
                  No timeline events yet
                </div>
              ) : (
                timeline.map((event, index) => (
                  <div key={event._id} style={{
                    position: 'relative',
                    paddingLeft: '28px',
                    paddingBottom: index < timeline.length - 1 ? '16px' : '0'
                  }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute',
                      left: '3px',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      border: '2px solid rgba(15, 23, 42, 1)'
                    }} />

                    <div style={{
                      backgroundColor: 'rgba(51, 65, 85, 0.3)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}>
                      <div style={{
                        color: '#e2e8f0',
                        fontWeight: '500',
                        marginBottom: '2px'
                      }}>
                        {event.action}
                      </div>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '12px'
                      }}>
                        {formatDate(event.timestamp)} • {event.performedBy}
                      </div>
                      {event.details && (
                        <div style={{
                          color: '#cbd5e1',
                          fontSize: '12px',
                          marginTop: '4px'
                        }}>
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};