# Local AI + Backend Testing Guide

This guide shows how to run both AI service and backend locally to test the integration without relying on external Render deployments.

## Setup Steps

### 1. Terminal 1: Start AI Service Locally

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

The AI service will start on `http://localhost:5000` by default.

### 2. Terminal 2: Configure Backend for Local AI

Set environment variable to point to local AI:

**Windows (PowerShell):**
```powershell
cd backend
$env:AI_SERVICE_URL="http://localhost:5000"
npm run dev
```

**Linux/Mac:**
```bash
cd backend
AI_SERVICE_URL=http://localhost:5000 npm run dev
```

Backend will start on `http://localhost:4000`.

### 3. Terminal 3: Test the Integration

```bash
cd backend
npm run test:ai
```

This will test:
- `/api/ai/health` (backend proxy to AI health)
- `/api/ai/status` (backend internal AI status)
- `/api/ai/test/risk/predict` (unauthenticated test endpoint)
- `/api/ai/risk/predict` (authenticated endpoint - will show 401 without token)

## Expected Output

✅ **Success case:**
```
[✓] /api/ai/health OK: { success: true, ai: { status: 'healthy', ... }, ai_status: { ... } }
[✓] /api/ai/status OK: { ai_service_url: 'http://localhost:5000', ... }
[✓] /api/ai/test/risk/predict OK: { success: true, test_mode: true, ... }
[✗] /api/ai/risk/predict FAILED: 401 Missing token
     ^ Expected 401 - this endpoint requires authentication
```

❌ **Failure cases:**
- ECONNREFUSED → AI service not running or wrong port
- Timeout → AI service taking too long to respond
- 500 errors → Check AI service logs for Python errors

## Troubleshooting

### AI Service Won't Start
```bash
cd ai-service
python -c "import flask, numpy, pymongo; print('Dependencies OK')"
```

### Backend Can't Reach AI
- Check `AI_SERVICE_URL` environment variable
- Verify AI service is on port 5000: `curl http://localhost:5000/health`
- Check Windows firewall/antivirus blocking local connections

### Authentication Testing
To test authenticated endpoints:

1. Start both services
2. Register a user: `POST http://localhost:4000/api/auth/register`
3. Login to get token: `POST http://localhost:4000/api/auth/login`
4. Set token and test:
   ```bash
   TOKEN=your_jwt_token npm run test:ai
   ```

## Alternative: Point to Production AI

If you want to test backend locally but use production AI service:

```bash
cd backend
# Windows
$env:AI_SERVICE_URL="https://suraksha-ai-service.onrender.com"
npm run dev

# Linux/Mac  
AI_SERVICE_URL=https://suraksha-ai-service.onrender.com npm run dev
```

Then run: `npm run test:ai`