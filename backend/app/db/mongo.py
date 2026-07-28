from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.MONGO_URL)
mongo_db = client[settings.MONGO_DB_NAME]