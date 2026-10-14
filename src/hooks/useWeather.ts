import { useState, useEffect, useCallback } from 'react';
import {
  type WeatherData,
  type ForecastDay,
  type FungalRisk,
  fetchWeather,
  fetchForecast,
  geocodeLocation,
} from '@/lib/weatherService';

const DEFAULT_LAT = -6.0;  // Moyobamba, San Martin
const DEFAULT_LON = -76.6;
const DEFAULT_NAME = 'Moyobamba, San Martín';

const CACHE_KEY = 'agro360_weather_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

interface WeatherCache {
  lat: number;
  lon: number;
  name: string;
  weather: WeatherData;
  forecast: ForecastDay[];
  fungalRisk: FungalRisk;
  timestamp: number;
}

function loadCache(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherCache;
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(cache: WeatherCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full
  }
}

export function useWeather(locationQuery?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [fungalRisk, setFungalRisk] = useState<FungalRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>(DEFAULT_NAME);

  const loadWeather = useCallback(async (lat: number, lon: number, name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [w, f] = await Promise.all([
        fetchWeather(lat, lon, name),
        fetchForecast(lat, lon),
      ]);
      setWeather(w);
      setForecast(f.daily);
      setFungalRisk(f.fungalRisk);
      setLocationName(name ?? w.locationName);
      saveCache({
        lat, lon, name: name ?? w.locationName,
        weather: w, forecast: f.daily, fungalRisk: f.fungalRisk,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clima');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setWeather(cached.weather);
      setForecast(cached.forecast);
      setFungalRisk(cached.fungalRisk);
      setLocationName(cached.name);
      setLoading(false);
      return;
    }

    if (locationQuery && locationQuery.trim()) {
      (async () => {
        try {
          const results = await geocodeLocation(locationQuery);
          if (results.length > 0) {
            await loadWeather(results[0].lat, results[0].lon, results[0].name);
          } else {
            await loadWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME);
          }
        } catch {
          await loadWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME);
        }
      })();
    } else {
      loadWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME);
    }
  }, [locationQuery, loadWeather]);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await geocodeLocation(query);
      if (results.length > 0) {
        await loadWeather(results[0].lat, results[0].lon, results[0].name);
      } else {
        setError('No se encontró la ubicación');
        setLoading(false);
      }
    } catch {
      setError('Error al buscar ubicación');
      setLoading(false);
    }
  }, [loadWeather]);

  return { weather, forecast, fungalRisk, loading, error, locationName, searchLocation };
}
