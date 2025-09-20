import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://suraksha-ai-service.onrender.com';
const BACKEND_BASE = process.env.BACKEND_BASE || 'http://localhost:4000';

async function main() {
  console.log('--- AI Diagnosis Start ---');
  console.log('AI_SERVICE_URL:', AI_SERVICE_URL);
  console.log('Backend base (for proxy):', BACKEND_BASE);

  // 1. Direct AI health
  try {
    const r = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 8000 });
    console.log('[Direct AI] /health OK:', r.data);
  } catch (e: any) {
    console.log('[Direct AI] /health FAILED:', e.code, e.message);
  }

  // 2. Backend proxy health
  try {
    const r = await axios.get(`${BACKEND_BASE}/api/ai/health`, { timeout: 8000 });
    console.log('[Backend Proxy] /api/ai/health OK:', r.data);
  } catch (e: any) {
    console.log('[Backend Proxy] /api/ai/health FAILED:', e.code, e.message, e.response?.data);
  }

  // 3. Backend status
  try {
    const r = await axios.get(`${BACKEND_BASE}/api/ai/status`, { timeout: 8000 });
    console.log('[Backend Proxy] /api/ai/status OK:', r.data);
  } catch (e: any) {
    console.log('[Backend Proxy] /api/ai/status FAILED:', e.code, e.message, e.response?.data);
  }

  // 4. Sample route risk direct (no auth needed at AI layer)
  const sample = { route: { start: { lat: 28.6, lng: 77.2 }, end: { lat: 28.55, lng: 77.3 } }, time_of_day: 'evening' };
  try {
    const r = await axios.post(`${AI_SERVICE_URL}/api/risk/predict`, sample, { timeout: 10000 });
    console.log('[Direct AI] risk/predict OK');
  } catch (e: any) {
    console.log('[Direct AI] risk/predict FAILED:', e.code, e.message, e.response?.data);
  }

  console.log('--- AI Diagnosis End ---');
}

main().catch(e => { console.error('Diagnosis fatal error', e); process.exit(1); });