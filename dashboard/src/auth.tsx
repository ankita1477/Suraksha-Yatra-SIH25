import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export function LoginPanel({ onAuth }: { onAuth: (t: string, role: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem('dash_token', token);
      onAuth(token, user.role || '');
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth:360, margin:'80px auto', background:'#1e293b', padding:24, borderRadius:12 }}>
      <h2 style={{ marginTop:0 }}>Dashboard Login</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={inp}/>
      {error && <div style={{ color:'#f87171', fontSize:12, marginBottom:8 }}>{error}</div>}
      <button disabled={loading} onClick={submit} style={btn}>{loading? '...' : 'Login'}</button>
      <p style={{ fontSize:11, color:'#64748b', marginTop:12 }}>Use existing officer/admin credentials.</p>
    </div>
  );
}

const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', marginBottom:12, borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' };
const btn: React.CSSProperties = { width:'100%', padding:'12px 12px', borderRadius:8, background:'#2563eb', color:'#fff', fontWeight:600, border:'none', cursor:'pointer' };
