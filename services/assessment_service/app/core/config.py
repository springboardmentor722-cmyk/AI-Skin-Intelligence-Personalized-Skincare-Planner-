from pydantic_settings import BaseSettings


class MongoSettings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "ai_skin_intelligence_mongo"

    class Config:
        env_file = ".env"
        extra = "ignore"


mongo_settings = MongoSettings()
