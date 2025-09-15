import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import { IncidentTable, Incident } from './components/IncidentTable';
import { IncidentMap } from './components/IncidentMap';
import { LoginPanel } from './auth';
import { useAuthToken } from './hooks/useAuthToken';
import { getSocket } from './lib/socket';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
const SOCKET_BASE = API_BASE.replace(/\/api$/, '');

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ severity?: string }>({});
  const { token, setToken } = useAuthToken();

  const loadInitial = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidents`, { params: { severity: filters.severity }, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      setIncidents(res.data);
    } catch (e) {
      console.error('Failed to fetch incidents', e);
    } finally {
      setLoading(false);
    }
  }, [filters.severity, token]);

  useEffect(() => {
    loadInitial();
    const socket = getSocket(SOCKET_BASE);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('incident', (data: Incident) => {
      // Apply current severity filter client-side if present
      if (!filters.severity || filters.severity === data.severity) {
        setIncidents(prev => [data, ...prev].slice(0, 200));
      }
    });
    const interval = setInterval(loadInitial, 60_000); // fallback refresh
    return () => { socket.close(); clearInterval(interval); };
  }, [loadInitial, filters.severity]);

  async function acknowledge(id: string) {
    try {
      if (!token) return;
      await axios.post(`${API_BASE}/incidents/${id}/ack`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, status: 'acknowledged' } : i));
    } catch (e) {
      console.error('Ack failed', e);
    }
  }

  if (!token) return <LoginPanel onAuth={(t) => setToken(t)} />;

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', padding:'16px 24px', fontFamily:'Inter, system-ui, sans-serif' }}>
      <header style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
        <h1 style={{ fontSize:24, margin:0 }}>Suraksha Dashboard</h1>
        <span style={{ fontSize:12, padding:'4px 8px', borderRadius:16, background: connected ? '#14532d' : '#374151', color: connected ? '#86efac' : '#f3f4f6' }}>
          {connected ? 'Realtime Connected' : 'Offline / Polling'}
        </span>
      </header>
      <section style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
        <div style={{ background:'#1e293b', borderRadius:12, padding:16, overflow:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:12 }}>
            <h2 style={{ margin:0, fontSize:18 }}>Incidents</h2>
            <select value={filters.severity || ''} onChange={e=>setFilters(f=>({...f, severity: e.target.value || undefined}))} style={{ background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:6, padding:'4px 8px', fontSize:12 }}>
              <option value=''>All severities</option>
              <option value='critical'>Critical</option>
              <option value='high'>High</option>
              <option value='medium'>Medium</option>
              <option value='low'>Low</option>
            </select>
            {loading && <span style={{ fontSize:12, color:'#94a3b8' }}>Loading...</span>}
          </div>
          <IncidentTable incidents={incidents} onAck={acknowledge} />
        </div>
        <div style={{ background:'#1e293b', borderRadius:12, padding:16, minHeight:300, display:'flex', flexDirection:'column' }}>
          <h2 style={{ marginTop:0, fontSize:18 }}>Live Map</h2>
          <div style={{ flex:1, minHeight:250 }}>
            <IncidentMap incidents={incidents.slice(0,100)} />
          </div>
        </div>
      </section>
      <footer style={{ marginTop:32, fontSize:11, color:'#475569' }}>MVP build · Auto-refresh every 60s with realtime socket overlay.</footer>
    </div>
  );
}

export default App;
