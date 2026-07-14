from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.core.security import require_user
from app.services.weather import service
from app.services.weather.schemas import WeatherUVRead

router = APIRouter()


@router.get("/weather-uv")
async def get_my_weather_uv(
    lat: float,
    lon: float,
    user: Annotated[dict[str, Any], Depends(require_user)],
) -> WeatherUVRead:
    # Any authenticated role, not just "user" — the topbar's UV chip renders in
    # every role's AppShell (components/app-shell/glass-topbar.tsx).
    return await service.get_weather_uv(user["id"], lat, lon)
