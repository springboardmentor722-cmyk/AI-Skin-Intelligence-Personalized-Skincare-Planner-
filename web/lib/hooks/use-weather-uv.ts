import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

interface Coords {
  lat: number;
  lon: number;
}

// Real browser geolocation, not the assessment wizard's free-text "location" string
// (no geocoding adapter exists to turn "London, United Kingdom" into lat/lon without
// yet another external API key) — degrades to `null` (no permission, no support, no
// secure context) exactly like an unconfigured backend key does: an honest "not
// available", never a guessed/default location.
function useBrowserCoords(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCoords({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => setCoords(null),
      { timeout: 5_000, maximumAge: 10 * 60_000 }
    );
  }, []);

  return coords;
}

// docs/DATASETS_AND_APIS.md's real OpenWeather/OpenUV adapters behind
// GET /api/v1/weather-uv — replaces the topbar's honest "UV —" placeholder with real
// data when a) the browser grants location and b) the backend has real API keys
// configured. Either being unavailable still renders the same honest placeholder,
// never a fabricated number.
export function useWeatherUV() {
  const coords = useBrowserCoords();

  return useQuery({
    queryKey: ["weather-uv", coords?.lat, coords?.lon],
    queryFn: async () => {
      if (!coords) return null;
      const { data } = await api.GET("/api/v1/weather-uv", {
        params: { query: { lat: coords.lat, lon: coords.lon } },
      });
      return data ?? null;
    },
    enabled: coords !== null,
    staleTime: 25 * 60_000, // matches the backend's own 30-min cache window
  });
}
