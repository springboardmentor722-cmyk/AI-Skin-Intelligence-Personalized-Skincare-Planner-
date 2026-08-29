from pymongo import MongoClient
from services.assessment_service.app.core.config import mongo_settings

_client = MongoClient(mongo_settings.MONGO_URI)
mongo_db = _client[mongo_settings.MONGO_DB_NAME]


def get_mongo_db():
    return mongo_db
