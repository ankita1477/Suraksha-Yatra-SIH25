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
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
      <thead>
        <tr style={{ background:'#0f172a', color:'#fff' }}>
          <th align="left">Type</th>
          <th>Severity</th>
            <th>Status</th>
          <th>Description</th>
          <th>Time</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {incidents.map(i => (
          <tr key={i._id} style={{ borderBottom:'1px solid #1e293b' }}>
            <td>{i.type}</td>
            <td style={{ color: severityColor(i.severity) }}>{i.severity}</td>
            <td>{i.status}</td>
            <td style={{ maxWidth:250 }}>{i.description}</td>
            <td>{new Date(i.createdAt).toLocaleTimeString()}</td>
            <td>
              {i.status === 'open' && <button onClick={() => onAck(i._id)}>Ack</button>}
            </td>
          </tr>
        ))}
        {!incidents.length && <tr><td colSpan={6} style={{ padding:16, textAlign:'center', color:'#64748b' }}>No incidents yet</td></tr>}
      </tbody>
    </table>
  );
};

function severityColor(s: string) {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#10b981';
  }
}
