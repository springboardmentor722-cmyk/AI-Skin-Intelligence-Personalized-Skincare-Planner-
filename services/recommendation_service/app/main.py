from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.recommendation_service.app.db.init_db import init_db
from services.recommendation_service.app.api.recommendation import router as recommendation_router

app = FastAPI(title="Recommendation Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendation_router)


@app.on_event("startup")
def startup():
    init_db()
    print("Recommendation Service: Postgres tables ready")


@app.get("/health")
def health():
    return {"status": "Recommendation Service Running"}
