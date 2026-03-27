"""
Gemini RAG Chatbot for Suraksha Yatra
Uses Google Gemini with Retrieval-Augmented Generation:
  - Static knowledge base: safety tips, emergency procedures, app guide
  - Live context: recent incidents, panic alerts, safe zones from MongoDB
"""
import logging
from datetime import datetime, timedelta
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# ── Static safety knowledge base ───────────────────────────────────────────────
SAFETY_KNOWLEDGE = """
# Suraksha Yatra – Safety Knowledge Base

## About the App
Suraksha Yatra is a personal safety application designed especially for women.
It provides real-time location sharing, panic alerts, safe zone monitoring,
incident reporting, and AI-powered risk assessment.

## Emergency Features
- **Panic Button**: Press the red panic button on the home screen to immediately
  alert your emergency contacts with your GPS location.
- **Emergency Contacts**: Add trusted people (family/friends) who get notified
  during emergencies. You can add up to 5 contacts.
- **Safe Zones**: Define home, workplace, or trusted areas. The app alerts you
  when you leave a safe zone unexpectedly.
- **Location Sharing**: Share your real-time location with emergency contacts.

## Safety Tips – Personal Safety
1. Always inform someone about your travel plans and expected arrival time.
2. Stay on well-lit, populated routes, especially at night.
3. Trust your instincts – if something feels wrong, leave the situation.
4. Keep your phone charged and carry a portable charger.
5. Share your live location with a trusted contact when traveling alone.
6. Avoid displaying expensive jewelry or gadgets in public.
7. Walk confidently and stay aware of your surroundings.
8. Avoid isolated areas, especially after dark.
9. Keep emergency numbers saved and easily accessible.
10. Use the app's panic button in any situation where you feel unsafe.

## Safety Tips – Travel
1. Research your destination before traveling.
2. Use verified, reputable transportation services.
3. Sit near the driver or in well-occupied areas on public transport.
4. Don't accept rides from strangers.
5. Keep your emergency contacts updated about your travel itinerary.
6. Use the route risk assessment feature before committing to a route.

## Safety Tips – Digital Safety
1. Enable location permissions for Suraksha Yatra to work fully.
2. Keep the app updated to the latest version.
3. Enable background location for continuous safe zone monitoring.
4. Set up push notifications to receive real-time alerts.

## Emergency Numbers (India)
- Police: 100
- Women Helpline: 1091
- National Emergency: 112
- Ambulance: 108
- Fire: 101
- Cyber Crime: 1930
- Child Helpline: 1098

## What to Do in an Emergency
1. Stay calm and move to a safe, populated area.
2. Press the panic button in the app to alert your emergency contacts.
3. Call 112 (National Emergency) or 100 (Police).
4. Shout for help if people are nearby.
5. If being followed, enter a shop, restaurant, or any public place.
6. Do not confront an attacker – your safety is the priority.
7. Try to remember details (clothing, vehicle, direction of movement) for reporting.

## Incident Reporting
You can report incidents through the app to help the community:
- Specify the type (accident, crime, harassment, medical emergency)
- Add the location and description
- Your report helps improve safety maps for others

## Safe Zone Tips
- Add your home and workplace as primary safe zones
- Add frequently visited locations (college, gym, friend's house)
- The app will alert you and your emergency contacts if you leave unexpectedly
- You can adjust the radius of each safe zone

## Risk Assessment
The AI risk predictor analyses historical incident data to give routes a safety
score from 0 (very safe) to 100 (high-risk). Prefer routes with scores below 30.
"""

# ── GeminiRAG class ─────────────────────────────────────────────────────────────
class GeminiRAG:
    def __init__(self, api_key: str, db_client=None):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash"
        self.system_instruction = (
            "You are Suraksha AI, a friendly and knowledgeable safety assistant "
            "for the Suraksha Yatra personal safety app. "
            "Your role is to help users with safety advice, emergency guidance, "
            "app features, and real-time safety information. "
            "Always be empathetic, concise, and focused on user safety. "
            "If someone is in immediate danger, always tell them to press the panic button "
            "and call 112 first before anything else. "
            "Respond in the same language the user writes in (Hindi or English)."
        )
        self.db_client = db_client
        # Per-session chat history stored in memory (session_id → list of Content objects)
        self._sessions: dict = {}

    # ── Live context from MongoDB ───────────────────────────────────────────────
    def _get_live_context(self) -> str:
        """Fetch recent incidents/alerts from MongoDB to enrich RAG context."""
        if not self.db_client:
            return ""
        try:
            ctx_parts = []
            cutoff = datetime.utcnow() - timedelta(hours=24)

            # Recent incidents
            try:
                incidents = list(
                    self.db_client.db["incidents"]
                    .find(
                        {"createdAt": {"$gte": cutoff}},
                        {"type": 1, "severity": 1, "description": 1, "createdAt": 1, "_id": 0}
                    )
                    .sort("createdAt", -1)
                    .limit(10)
                )
                if incidents:
                    ctx_parts.append("## Recent Incidents (last 24 h)")
                    for inc in incidents:
                        ctx_parts.append(
                            f"- [{inc.get('severity','?').upper()}] {inc.get('type','?')}: "
                            f"{inc.get('description','')[:120]} "
                            f"({inc.get('createdAt','')[:10]})"
                        )
            except Exception:
                pass

            # Recent panic alerts
            try:
                alerts = list(
                    self.db_client.db["panicalerts"]
                    .find(
                        {"timestamp": {"$gte": cutoff.isoformat()}},
                        {"lat": 1, "lng": 1, "timestamp": 1, "acknowledged": 1, "_id": 0}
                    )
                    .sort("timestamp", -1)
                    .limit(5)
                )
                if alerts:
                    ctx_parts.append(f"\n## Recent Panic Alerts (last 24 h): {len(alerts)} alert(s)")
            except Exception:
                pass

            return "\n".join(ctx_parts)
        except Exception as e:
            logger.warning(f"Could not fetch live context: {e}")
            return ""

    # ── Build prompt with RAG context ──────────────────────────────────────────
    def _build_context_prompt(self, user_message: str) -> str:
        live_ctx = self._get_live_context()
        parts = [SAFETY_KNOWLEDGE]
        if live_ctx:
            parts.append("\n# Live System Context\n" + live_ctx)
        parts.append(
            "\nUsing only the knowledge above (and your general safety knowledge), "
            "answer the following user question concisely and helpfully."
        )
        return "\n".join(parts)

    # ── Chat (with per-session history) ────────────────────────────────────────
    def chat(self, message: str, session_id: str = "default") -> dict:
        """
        Send a message and get a response. Maintains conversation history per session.
        Returns: { "response": str, "session_id": str }
        """
        try:
            if session_id not in self._sessions:
                # Initialize session history with RAG context as first exchange
                context_prompt = self._build_context_prompt(message)
                self._sessions[session_id] = [
                    types.Content(
                        role="user",
                        parts=[types.Part(text=context_prompt)]
                    ),
                    types.Content(
                        role="model",
                        parts=[types.Part(text=(
                            "Understood. I'm Suraksha AI, your personal safety assistant. "
                            "I have the app's knowledge base and current safety data loaded. "
                            "How can I help you stay safe today?"
                        ))]
                    ),
                ]

            history = self._sessions[session_id]
            # Append the new user message
            history.append(types.Content(role="user", parts=[types.Part(text=message)]))

            response = self.client.models.generate_content(
                model=self.model,
                contents=history,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    temperature=0.7,
                    max_output_tokens=1024,
                )
            )
            reply = response.text
            # Append model response to history
            history.append(types.Content(role="model", parts=[types.Part(text=reply)]))
            # Keep history bounded to last 20 turns (40 entries)
            if len(history) > 42:
                self._sessions[session_id] = history[:2] + history[-40:]

            return {"response": reply, "session_id": session_id}
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            raise

    # ── One-shot (no history) ──────────────────────────────────────────────────
    def ask(self, question: str) -> str:
        """Single-turn question answering with full RAG context."""
        try:
            context = self._build_context_prompt(question)
            prompt = f"{context}\n\nUser question: {question}"
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    temperature=0.7,
                    max_output_tokens=1024,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini ask error: {e}")
            raise

    # ── Clear a session ────────────────────────────────────────────────────────
    def clear_session(self, session_id: str):
        self._sessions.pop(session_id, None)
