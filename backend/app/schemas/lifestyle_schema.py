from pydantic import BaseModel

class LifestyleCreate(BaseModel):
    sleep_duration: float
    water_intake: float
    exercise: str
    stress_level: str
    environmental_exposure: str