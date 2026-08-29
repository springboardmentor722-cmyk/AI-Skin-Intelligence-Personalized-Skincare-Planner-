from fastapi import FastAPI
from services.auth_service.app.db.database import engine
from sqlalchemy import text
from services.auth_service.app.db.init_db import init_db
from services.auth_service.app.api.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Authentication Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.on_event("startup")
def startup():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print("Database Connected Successfully!")

    init_db()
    print("Database Initialized!")


@app.get("/")
def root():
    return {
        "message": "Authentication Service"
    }


@app.get("/health")
def health():
    return {
        "status": "Auth Service Running"
    }
