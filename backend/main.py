from fastapi import FastAPI
from sqlalchemy import inspect, text

from app.database.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
# Import all models
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.lifestyle import Lifestyle
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.progress import Progress
from app.models.consultation import Consultation
from app.models.report import Report
from app.models.skin_assessment import SkinAssessment
from app.models.notification import Notification

# Import routers
from app.routers.user_router import router as user_router
from app.routers.skin_profile_router import router as skin_router
from app.routers.lifestyle_router import router as lifestyle_router
from app.routers.product_router import router as product_router
from app.routers.ingredient_router import router as ingredient_router
from app.routers.progress_router import router as progress_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.consultation_router import router as consultation_router
from app.routers.report_router import router as report_router
from app.routers.ai_router import router as ai_router
from app.routers.skin_assessment_router import router as skin_assessment_router
from app.routers.notification_router import router as notification_router

# Create tables
Base.metadata.create_all(bind=engine)

def ensure_notification_schema():
    """Add deduplication support without recreating the notifications table."""
    inspector = inspect(engine)
    if "notifications" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("notifications")}
    with engine.begin() as connection:
        if "event_key" not in columns:
            connection.execute(text("ALTER TABLE notifications ADD COLUMN event_key VARCHAR(191) NULL"))
        indexes = {index["name"] for index in inspector.get_indexes("notifications")}
        unique_constraints = {constraint["name"] for constraint in inspector.get_unique_constraints("notifications")}
        if "uq_notifications_event_key" not in indexes and "uq_notifications_event_key" not in unique_constraints:
            connection.execute(text("CREATE UNIQUE INDEX uq_notifications_event_key ON notifications (event_key)"))

ensure_notification_schema()

def ensure_catalog_activity_schema():
    """Safely add soft-delete support to existing catalog tables."""
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table in ("products", "ingredients"):
            if table in inspector.get_table_names():
                columns = {column["name"] for column in inspector.get_columns(table)}
                if "is_active" not in columns:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE"))

ensure_catalog_activity_schema()

# Create FastAPI app
app = FastAPI(title="Skin Intelligence")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include routers
app.include_router(user_router)
app.include_router(skin_router)
app.include_router(lifestyle_router)
app.include_router(product_router)
app.include_router(ingredient_router)
app.include_router(progress_router)
app.include_router(dashboard_router)
app.include_router(consultation_router)
app.include_router(report_router)
app.include_router(ai_router)
app.include_router(skin_assessment_router)
app.include_router(notification_router)
# Home API
@app.get("/")
def home():
    return {"message": "Skin Intelligence API is Running"}
