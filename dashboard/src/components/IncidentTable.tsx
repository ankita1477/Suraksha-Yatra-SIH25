import React from 'react';

export interface Incident {
  _id: string;
  type: string;
  severity: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface Props { incidents: Incident[]; onAck: (id: string) => void; }

export const IncidentTable: React.FC<Props> = ({ incidents, onAck }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      display: 'inline-block'
    };

    switch (status) {
      case 'open':
        return <span style={{ ...baseStyle, background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Open</span>;
      case 'acknowledged':
        return <span style={{ ...baseStyle, background: 'rgba(251, 191, 36, 0.2)', color: '#fcd34d', border: '1px solid rgba(251, 191, 36, 0.3)' }}>Acknowledged</span>;
      case 'resolved':
        return <span style={{ ...baseStyle, background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Resolved</span>;
      default:
        return <span style={{ ...baseStyle, background: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}>{status}</span>;
    }
  };

  return (
    <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)' }}>
          <tr>
            <th style={{ ...headerStyle, textAlign: 'left' }}>Type</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Severity</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Status</th>
            <th style={{ ...headerStyle, textAlign: 'left' }}>Description</th>
            <th style={{ ...headerStyle, textAlign: 'left' }}>Time</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((i, index) => (
            <tr 
              key={i._id} 
              style={{ 
                borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                background: index % 2 === 0 ? 'rgba(15, 23, 42, 0.2)' : 'transparent',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(15, 23, 42, 0.2)' : 'transparent'}
            >
              <td style={{ ...cellStyle }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontSize: 16,
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    {i.type === 'panic' ? '🚨' : i.type === 'anomaly' ? '⚠️' : '📍'}
                  </span>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{i.type}</span>
                </div>
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{getSeverityIcon(i.severity)}</span>
                  <span style={{ color: severityColor(i.severity), fontWeight: 600, textTransform: 'capitalize' }}>
                    {i.severity}
                  </span>
                </div>
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                {getStatusBadge(i.status)}
              </td>
              <td style={{ ...cellStyle, maxWidth: 200 }}>
                <div style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  color: '#d1d5db'
                }}>
                  {i.description || 'No description'}
                </div>
              </td>
              <td style={{ ...cellStyle, color: '#9ca3af', fontSize: 12 }}>
                <div>{new Date(i.createdAt).toLocaleDateString()}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {new Date(i.createdAt).toLocaleTimeString()}
                </div>
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                {i.status === 'open' && (
                  <button 
                    onClick={() => onAck(i._id)}
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
              </td>
            </tr>
          ))}
          {!incidents.length && (
            <tr>
              <td colSpan={6} style={{ 
                padding: 32, 
                textAlign: 'center', 
                color: '#64748b',
                fontSize: 14
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24, opacity: 0.5 }}>📊</span>
                  <div>No incidents found</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Incidents will appear here when reported
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = {
  padding: '12px 16px',
  color: '#f1f5f9',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderBottom: '2px solid rgba(59, 130, 246, 0.3)'
};

const cellStyle = {
  padding: '12px 16px',
  verticalAlign: 'top' as const
};

function severityColor(s: string) {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#10b981';
  }
}
