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

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      submit();
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: 400, 
        width: '100%',
        background: 'rgba(30, 41, 59, 0.8)', 
        backdropFilter: 'blur(12px)',
        padding: 32, 
        borderRadius: 20,
        border: '1px solid rgba(51, 65, 85, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
            borderRadius: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            margin: '0 auto 16px auto'
          }}>S</div>
          <h2 style={{ 
            marginTop: 0,
            marginBottom: 8,
            fontSize: 24,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
          }}>
            Suraksha Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
            Emergency Response System Login
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 13, 
              fontWeight: 500, 
              color: '#e2e8f0' 
            }}>
              Email Address
            </label>
            <input 
              type="email"
              placeholder="admin@suraksha.local" 
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              style={inputStyle}
              autoFocus
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 13, 
              fontWeight: 500, 
              color: '#e2e8f0' 
            }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={password} 
              onChange={e=>setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ 
              padding: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button 
            disabled={loading || !email || !password} 
            onClick={submit} 
            style={{
              ...buttonStyle,
              opacity: (loading || !email || !password) ? 0.6 : 1,
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ 
                  width: 16, 
                  height: 16, 
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        {/* Demo credentials */}
        <div style={{ 
          marginTop: 24,
          padding: 16,
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: 8,
          fontSize: 12,
          color: '#94a3b8'
        }}>
          <div style={{ fontWeight: 500, marginBottom: 8, color: '#cbd5e1' }}>Demo Credentials:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
            Email: admin@suraksha.local<br/>
            Password: ChangeMe!123
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '12px 16px', 
  borderRadius: 8, 
  border: '1px solid rgba(51, 65, 85, 0.5)', 
  background: 'rgba(15, 23, 42, 0.8)', 
  color: '#e2e8f0',
  fontSize: 14,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
  outline: 'none'
};

const buttonStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '12px 16px', 
  borderRadius: 8, 
  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
  color: 'white', 
  fontWeight: 600, 
  border: 'none', 
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
  transition: 'all 0.2s'
};
