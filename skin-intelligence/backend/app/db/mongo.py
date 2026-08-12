from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
mongo_db = mongo_client[settings.MONGO_DB_NAME]

# Collections
scan_results_collection = mongo_db["scan_results"]        # raw ML output per face scan
ingredient_db_collection = mongo_db["ingredients"]          # INCI ingredient intelligence
product_catalog_collection = mongo_db["products"]           # product recommendations
routine_logs_collection = mongo_db["routine_logs"]           # daily checklist logs
