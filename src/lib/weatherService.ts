export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  soilMoisture: number;
  evapotranspiration: number;
  feelsLike: number;
  uvIndex: number;
  locationName: string;
}

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProb: number;
  weatherCode: number;
  humidity: number;
  windSpeedMax: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitationProb: number;
  humidity: number;
  weatherCode: number;
}

export interface FungalRisk {
  level: 'bajo' | 'moderado' | 'alto' | 'critico';
  score: number;
  reason: string;
}

const WEATHER_CODE_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: 'Despejado', icon: 'sun' },
  1: { label: 'Mayormente despejado', icon: 'sun' },
  2: { label: 'Parcialmente nublado', icon: 'cloud-sun' },
  3: { label: 'Nublado', icon: 'cloud' },
  45: { label: 'Niebla', icon: 'fog' },
  48: { label: 'Niebla con escarcha', icon: 'fog' },
  51: { label: 'Llovizna ligera', icon: 'drizzle' },
  53: { label: 'Llovizna', icon: 'drizzle' },
  55: { label: 'Llovizna densa', icon: 'drizzle' },
  61: { label: 'Lluvia ligera', icon: 'rain' },
  63: { label: 'Lluvia', icon: 'rain' },
  65: { label: 'Lluvia fuerte', icon: 'rain' },
  66: { label: 'Lluvia helada', icon: 'rain' },
  67: { label: 'Lluvia helada fuerte', icon: 'rain' },
  71: { label: 'Nieve ligera', icon: 'snow' },
  73: { label: 'Nieve', icon: 'snow' },
  75: { label: 'Nieve fuerte', icon: 'snow' },
  80: { label: 'Chubascos ligeros', icon: 'rain' },
  81: { label: 'Chubascos', icon: 'rain' },
  82: { label: 'Chubascos violentos', icon: 'rain' },
  95: { label: 'Tormenta', icon: 'thunderstorm' },
  96: { label: 'Tormenta con granizo', icon: 'thunderstorm' },
  99: { label: 'Tormenta severa', icon: 'thunderstorm' },
};

export function getWeatherLabel(code: number): string {
  return WEATHER_CODE_MAP[code]?.label ?? 'Desconocido';
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number; name: string; country?: string }[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((r: any) => ({
    lat: r.latitude,
    lon: r.longitude,
    name: r.name,
    country: r.country,
  }));
}

export async function fetchWeather(lat: number, lon: number, locationName?: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    'current': [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'apparent_temperature',
      'uv_index',
    ].join(','),
    'daily': [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'weather_code',
      'relative_humidity_2m_max',
      'wind_speed_10m_max',
      'et0_fao_evapotranspiration',
    ].join(','),
    'timezone': 'auto',
    'forecast_days': '5',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();

  const current = data.current;
  const daily = data.daily;

  return {
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    precipitation: Math.round(current.precipitation * 10) / 10,
    windSpeed: Math.round(current.wind_speed_10m),
    weatherCode: current.weather_code,
    soilMoisture: 0,
    evapotranspiration: daily.et0_fao_evapotranspiration?.[0] ?? 0,
    feelsLike: Math.round(current.apparent_temperature),
    uvIndex: Math.round(current.uv_index ?? 0),
    locationName: locationName ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
  };
}

export async function fetchForecast(lat: number, lon: number): Promise<{ daily: ForecastDay[]; fungalRisk: FungalRisk }> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    'daily': [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'weather_code',
      'relative_humidity_2m_max',
      'wind_speed_10m_max',
      'et0_fao_evapotranspiration',
    ].join(','),
    'timezone': 'auto',
    'forecast_days': '5',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast fetch failed');
  const data = await res.json();

  const d = data.daily;
  const daily: ForecastDay[] = [];
  for (let i = 0; i < d.time.length; i++) {
    daily.push({
      date: d.time[i],
      tempMax: Math.round(d.temperature_2m_max[i]),
      tempMin: Math.round(d.temperature_2m_min[i]),
      precipitation: Math.round(d.precipitation_sum[i] * 10) / 10,
      precipitationProb: d.precipitation_probability_max[i] ?? 0,
      weatherCode: d.weather_code[i],
      humidity: Math.round(d.relative_humidity_2m_max[i] ?? 0),
      windSpeedMax: Math.round(d.wind_speed_10m_max[i] ?? 0),
    });
  }

  const fungalRisk = calcFungalRisk(daily);
  return { daily, fungalRisk };
}

function calcFungalRisk(days: ForecastDay[]): FungalRisk {
  let score = 0;
  const reasons: string[] = [];

  for (const d of days.slice(0, 3)) {
    if (d.precipitation > 10) { score += 25; }
    else if (d.precipitation > 5) { score += 15; }
    else if (d.precipitation > 1) { score += 8; }

    if (d.humidity > 85) { score += 20; reasons.push('Humedad > 85%'); }
    else if (d.humidity > 75) { score += 10; }

    if (d.tempMax > 20 && d.tempMax < 30 && d.humidity > 70) {
      score += 10;
      if (!reasons.includes('Condiciones ideales para hongos'))
        reasons.push('Temperatura 20-30C + alta humedad');
    }
  }

  score = Math.min(100, score);

  let level: FungalRisk['level'] = 'bajo';
  if (score >= 70) level = 'critico';
  else if (score >= 45) level = 'alto';
  else if (score >= 20) level = 'moderado';

  const reason = reasons.length > 0 ? reasons.join(', ') : 'Condiciones secas, bajo riesgo de hongos';
  return { level, score, reason };
}
