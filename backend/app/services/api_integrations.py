# app/services/api_integrations.py

"""
API Integrations Configuration.
Single source of truth for platform integrations (DBs, AI, Third-party APIs).
"""

def get_api_integrations():
    return [
        {
            "id": "int_openweather",
            "name": "OpenWeather API",
            "description": "Weather Information",
            "type": "Weather API",
            "status": "Connected",
            "endpoint": "https://api.openwea...",
            "response_time": "210 ms",
            "last_sync": "5 mins ago",
            "ping": 210
        },
        {
            "id": "int_groq",
            "name": "Groq AI",
            "description": "LLM Service",
            "type": "AI / LLM",
            "status": "Connected",
            "endpoint": "https://api.groq.com",
            "response_time": "185 ms",
            "last_sync": "Now",
            "ping": 185
        },
        {
            "id": "int_mongo",
            "name": "MongoDB",
            "description": "Database",
            "type": "Database",
            "status": "Connected",
            "endpoint": "mongodb://cluster0...",
            "response_time": "150 ms",
            "last_sync": "1 min ago",
            "ping": 150
        },
        {
            "id": "int_postgres",
            "name": "PostgreSQL",
            "description": "Primary Database",
            "type": "Database",
            "status": "Connected",
            "endpoint": "postgresql://skinai-...",
            "response_time": "120 ms",
            "last_sync": "2 mins ago",
            "ping": 120
        },
        {
            "id": "int_s3",
            "name": "AWS S3",
            "description": "Storage Service",
            "type": "Storage",
            "status": "Connected",
            "endpoint": "https://s3.amazonaws...",
            "response_time": "230 ms",
            "last_sync": "3 mins ago",
            "ping": 230
        },
        {
            "id": "int_firebase",
            "name": "Firebase Auth",
            "description": "Authentication",
            "type": "Authentication",
            "status": "Connected",
            "endpoint": "https://identitytoolki...",
            "response_time": "160 ms",
            "last_sync": "1 min ago",
            "ping": 160
        },
        {
            "id": "int_smtp",
            "name": "Email Service (SMTP)",
            "description": "SMTP Server",
            "type": "Email",
            "status": "Disconnected",
            "endpoint": "smtp://mail.skinai.co...",
            "response_time": "--",
            "last_sync": "4 mins ago",
            "ping": None
        },
        {
            "id": "int_stripe",
            "name": "Stripe",
            "description": "Payment Gateway",
            "type": "Payments",
            "status": "Slow",
            "endpoint": "https://api.stripe.com",
            "response_time": "560 ms",
            "last_sync": "1 hour ago",
            "ping": 560
        },
        {
            "id": "int_openai",
            "name": "OpenAI",
            "description": "AI Service",
            "type": "AI / LLM",
            "status": "Connected",
            "endpoint": "https://api.openai.com",
            "response_time": "250 ms",
            "last_sync": "2 mins ago",
            "ping": 250
        },
        {
            "id": "int_twilio",
            "name": "Twilio",
            "description": "SMS Service",
            "type": "Communication",
            "status": "Connected",
            "endpoint": "https://api.twilio.com",
            "response_time": "180 ms",
            "last_sync": "3 mins ago",
            "ping": 180
        }
    ]
