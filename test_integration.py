"""
Test AI Service Integration with Backend
This script tests the complete AI integration through backend endpoints
"""

import requests
import json
import time

# Backend and AI service URLs
BACKEND_URL = "http://localhost:4000"
AI_SERVICE_URL = "http://localhost:5000"

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def test_ai_service_health():
    """Test AI service health endpoint"""
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ AI service health check passed")
            return True
        else:
            print(f"❌ AI service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI service health check error: {e}")
        return False

def test_ai_endpoints():
    """Test AI endpoints through backend (these require authentication)"""
    
    # Sample test data
    test_data = {
        "risk_prediction": {
            "route": {
                "start": {"lat": 28.6139, "lng": 77.2090},
                "end": {"lat": 28.7041, "lng": 77.1025}
            },
            "user_id": "test_user_123",
            "time_of_travel": "2024-09-19T20:00:00Z"
        },
        "anomaly_detection": {
            "user_id": "test_user_123",
            "location": {"lat": 28.6139, "lng": 77.2090},
            "timestamp": "2024-09-19T20:00:00Z"
        },
        "pattern_analysis": {
            "user_id": "test_user_123",
            "time_range": {
                "start": "2024-09-01T00:00:00Z",
                "end": "2024-09-19T23:59:59Z"
            }
        },
        "threat_assessment": {
            "location": {"lat": 28.6139, "lng": 77.2090},
            "radius": 1000,
            "time_window": 24
        }
    }
    
    print("\n🧪 Testing AI endpoints (Note: These may require authentication)")
    
    # Test each endpoint
    endpoints = [
        ("risk/predict", test_data["risk_prediction"]),
        ("anomaly/detect", test_data["anomaly_detection"]),
        ("patterns/analyze", test_data["pattern_analysis"]),
        ("threat/assess", test_data["threat_assessment"])
    ]
    
    for endpoint, data in endpoints:
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/ai/{endpoint}",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {endpoint}: {result.get('message', 'Success')}")
            elif response.status_code == 401:
                print(f"🔒 {endpoint}: Authentication required (expected)")
            else:
                print(f"❓ {endpoint}: Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def main():
    """Main test function"""
    print("🚀 Testing Suraksha Yatra AI Integration")
    print("=" * 50)
    
    # Test basic connectivity
    backend_ok = test_backend_health()
    ai_ok = test_ai_service_health()
    
    if not backend_ok or not ai_ok:
        print("\n❌ Basic connectivity failed. Please check if services are running:")
        print("1. AI Service: python app.py (in ai-service directory)")
        print("2. Backend: npm run dev (in backend directory)")
        return False
    
    # Test AI endpoints
    test_ai_endpoints()
    
    print(f"\n🎉 Integration test completed!")
    print(f"📊 Services Status:")
    print(f"   - Backend API: {'✅' if backend_ok else '❌'} http://localhost:4000")
    print(f"   - AI Service: {'✅' if ai_ok else '❌'} http://localhost:5000")
    print(f"\n🔗 AI endpoints available at:")
    print(f"   - Risk Prediction: POST {BACKEND_URL}/api/ai/risk/predict")
    print(f"   - Anomaly Detection: POST {BACKEND_URL}/api/ai/anomaly/detect")
    print(f"   - Pattern Analysis: POST {BACKEND_URL}/api/ai/patterns/analyze")
    print(f"   - Threat Assessment: POST {BACKEND_URL}/api/ai/threat/assess")
    
    return True

if __name__ == "__main__":
    main()