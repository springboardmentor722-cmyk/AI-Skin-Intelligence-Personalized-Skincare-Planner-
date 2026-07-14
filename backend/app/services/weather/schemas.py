from pydantic import BaseModel


class WeatherUVRead(BaseModel):
    # `available=False` (both adapters unconfigured or failed) is a real, honest
    # response — the frontend's existing "UV —" stub already renders this state,
    # not an invented empty-data guess.
    available: bool
    temperature: int | None
    humidity: int | None
    uv_index: float | None
    weather_condition: str | None
    cached: bool
