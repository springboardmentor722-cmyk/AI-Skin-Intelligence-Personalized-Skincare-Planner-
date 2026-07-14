import datetime
import json

from app.db.mongo import get_mongo_db
from app.db.redis import get_redis
from app.integrations import openuv, openweather
from app.integrations.base import AdapterError
from app.services.weather.schemas import WeatherUVRead

# source: docs/DATASETS_AND_APIS.md → "5. Weather & UV"
_CACHE_TTL_SECONDS = 30 * 60  # "Redis cache (30 min)"
_MONGO_COLLECTION = "weather_uv_logs"  # database_schemas/skinlytics_mongodb_schema_v3.txt #5


def _cache_key(lat: float, lon: float) -> str:
    # "round coords to ~city precision — better cache hits, less location granularity
    # stored" (docs/DATASETS_AND_APIS.md) — one decimal place is roughly city-block
    # precision, not exact-address.
    return f"weather:cache:{round(lat, 1)}:{round(lon, 1)}"


async def get_weather_uv(user_id: str, lat: float, lon: float) -> WeatherUVRead:
    """Real OpenWeather (temp/humidity/condition) + OpenUV (uv_index) — each degrades
    to None independently (unconfigured key, or its own resilience policy
    exhausted/AdapterError) rather than failing the whole request; `available=False`
    only when both are unavailable. Never fabricates a value for a source that
    genuinely isn't configured."""
    redis = get_redis()
    key = _cache_key(lat, lon)
    cached = await redis.get(key)
    if cached:
        return WeatherUVRead(**json.loads(cached), cached=True)

    weather = None
    try:
        weather = await openweather.fetch_current_weather(lat, lon)
    except AdapterError:
        pass  # configured but unreachable right now — degrade, don't 500

    uv = None
    try:
        uv = await openuv.fetch_uv_index(lat, lon)
    except AdapterError:
        pass

    result = WeatherUVRead(
        available=weather is not None or uv is not None,
        temperature=round(weather.temp_celsius) if weather else None,
        humidity=weather.humidity_percent if weather else None,
        uv_index=uv.uv if uv else None,
        weather_condition=weather.condition if weather else None,
        cached=False,
    )

    if result.available:
        payload = result.model_dump(exclude={"cached"})
        await redis.set(key, json.dumps(payload), ex=_CACHE_TTL_SECONDS)
        # database_schemas/skinlytics_mongodb_schema_v3.txt #5's exact documented
        # shape — `location` stored as "lat,lon" (no reverse-geocoding adapter exists
        # to turn it into a place name), `pollution_index` left unset (no Air
        # Pollution API call is wired — not fabricated).
        await get_mongo_db()[_MONGO_COLLECTION].insert_one(
            {
                "user_id": user_id,
                "location": f"{lat},{lon}",
                "temperature": result.temperature,
                "humidity": result.humidity,
                "uv_index": result.uv_index,
                "pollution_index": None,
                "weather_condition": result.weather_condition,
                "captured_at": datetime.datetime.now(datetime.UTC),
            }
        )

    return result
