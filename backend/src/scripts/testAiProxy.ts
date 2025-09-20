import axios from 'axios';

const BACKEND_BASE = process.env.BACKEND_BASE || 'http://localhost:4000';

// Create a test JWT token for local testing
// This is a minimal token - in real scenario, get it from login endpoint
const createTestToken = () => {
  // For local testing, you'd either:
  // 1. Use a real user token from login
  // 2. Create a test user and login
  // For now, we'll test without auth first to see connectivity
  return null;
};

async function testBackendAIProxy() {
  console.log('--- Testing Backend AI Proxy Locally ---');
  console.log('Backend base:', BACKEND_BASE);
  
  const headers: any = {};
  const token = createTestToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 1. Test health endpoint (no auth required)
  try {
    const r = await axios.get(`${BACKEND_BASE}/api/ai/health`, { timeout: 10000 });
    console.log('[✓] /api/ai/health OK:', r.data);
  } catch (e: any) {
    console.log('[✗] /api/ai/health FAILED:', e.code, e.message, e.response?.data);
  }

  // 2. Test status endpoint (no auth required)
  try {
    const r = await axios.get(`${BACKEND_BASE}/api/ai/status`, { timeout: 5000 });
    console.log('[✓] /api/ai/status OK:', r.data);
  } catch (e: any) {
    console.log('[✗] /api/ai/status FAILED:', e.code, e.message, e.response?.data);
  }

  // 3. Test unauthenticated test endpoint
  try {
    const r = await axios.post(`${BACKEND_BASE}/api/ai/test/risk/predict`, {}, { timeout: 15000 });
    console.log('[✓] /api/ai/test/risk/predict OK:', r.data);
  } catch (e: any) {
    console.log('[✗] /api/ai/test/risk/predict FAILED:', e.code, e.message, e.response?.data);
  }

  // 4. Test authenticated risk prediction (will fail without token)
  const sampleRoute = {
    route: {
      start: { lat: 28.6139, lng: 77.2090 },
      end: { lat: 28.5355, lng: 77.3910 }
    },
    time_of_day: 'evening'
  };

  try {
    const r = await axios.post(`${BACKEND_BASE}/api/ai/risk/predict`, sampleRoute, {
      headers,
      timeout: 15000
    });
    console.log('[✓] /api/ai/risk/predict OK:', r.data);
  } catch (e: any) {
    console.log('[✗] /api/ai/risk/predict FAILED:', e.response?.status, e.message, e.response?.data?.error);
    if (e.response?.status === 401) {
      console.log('     ^ Expected 401 - this endpoint requires authentication');
    }
  }

  console.log('--- Test Complete ---');
  console.log('\nTo run with authentication:');
  console.log('1. Start backend: npm run dev');
  console.log('2. Register/login to get a token');
  console.log('3. Set TOKEN env var: TOKEN=your_jwt_token npm run test:ai');
}

testBackendAIProxy().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});