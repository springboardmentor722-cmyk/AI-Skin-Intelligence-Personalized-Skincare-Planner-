from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

try:
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
    mongodb = client.ai_skin_db
except Exception as e:
    print(f"[MongoDB] Connection warning: {e}")
    mongodb = None
