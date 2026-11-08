import { useWeather } from '@/hooks/useWeather';
import { formatForecastWeekday, getWeatherLabel, type ForecastDay, type WeatherData } from '@/lib/weatherService';
import { AlertTriangle, CloudRain, Droplets, Sun, Thermometer, Wind, MapPin, Loader2, CloudSun } from 'lucide-react';
import { Alert } from '@/components/Alert';
import { Badge } from '@/components/UI';

export type CropType = 'cafe' | 'arroz' | 'cacao';

export interface CropAlert {
  level: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  icon: typeof AlertTriangle;
}

function sumRainNextDays(days: ForecastDay[], count: number): number {
  return days.slice(0, count).reduce((sum, d) => sum + d.precipitation, 0);
}
function avgHumidityNextDays(days: ForecastDay[], count: number): number {
  const slice = days.slice(0, count);
  if (slice.length === 0) return 0;
  return Math.round(slice.reduce((sum, d) => sum + d.humidity, 0) / slice.length);
}
function maxTempNextDays(days: ForecastDay[], count: number): number {
  return Math.max(...days.slice(0, count).map((d) => d.tempMax), 0);
}

export function buildCropAlerts(crop: CropType, weather: WeatherData, forecast: ForecastDay[]): CropAlert[] {
  const alerts: CropAlert[] = [];
  const rain3d = sumRainNextDays(forecast, 3);
  const humidity3d = avgHumidityNextDays(forecast, 3);
  const tempMax3d = maxTempNextDays(forecast, 3);

  if (crop === 'cafe') {
    if (humidity3d > 80 && tempMax3d >= 20 && tempMax3d <= 28) {
      alerts.push({
        level: humidity3d > 90 ? 'danger' : 'warning',
        title: 'Riesgo alto de roya del cafeto',
        message: `Humedad promedio ${humidity3d}% y temperaturas de ${tempMax3d}°C favorecen la roya. Revisa las hojas del tercio inferior y mejora la aireación del cafetal con poda y deshierbe.`,
        icon: AlertTriangle,
      });
    }
    if (rain3d > 30) {
      alerts.push({
        level: 'warning',
        title: 'Lluvia abundante en los próximos días',
        message: `Se esperan unos ${rain3d.toFixed(0)} mm en 3 días. Revisa el drenaje del cafetal para evitar encharcamiento y pudrición de raíces.`,
        icon: CloudRain,
      });
    }
    if (weather.evapotranspiration > 5 && rain3d < 5) {
      alerts.push({
        level: 'info',
        title: 'Clima seco, vigila la sombra',
        message: `La evapotranspiración es alta (${weather.evapotranspiration.toFixed(1)} mm/día) y la lluvia prevista es baja. Asegura buena sombra para las plántulas y riega si es época seca.`,
        icon: Sun,
      });
    }
  }

  if (crop === 'arroz') {
    if (weather.evapotranspiration > 4.5 && rain3d < 10) {
      alerts.push({
        level: 'warning',
        title: 'Necesidad de riego',
        message: `Evapotranspiración alta (${weather.evapotranspiration.toFixed(1)} mm/día) y poca lluvia prevista (${rain3d.toFixed(0)} mm en 3 días). Revisa la lámina de agua de los lotes en producción.`,
        icon: Droplets,
      });
    }
    if (rain3d > 50) {
      alerts.push({
        level: 'danger',
        title: 'Riesgo de encharcamiento',
        message: `Se esperan unos ${rain3d.toFixed(0)} mm en 3 días. Prepara el drenaje de los lotes para evitar el ahogamiento del arroz, sobre todo en macollamiento.`,
        icon: CloudRain,
      });
    }
    if (humidity3d > 85 && tempMax3d >= 25 && tempMax3d <= 32) {
      alerts.push({
        level: 'warning',
        title: 'Condiciones para enfermedades foliares',
        message: `Humedad ${humidity3d}% y temperatura de ${tempMax3d}°C favorecen manchas foliares como pyricularia. Vigila las hojas y conserva la humedad del lote controlada.`,
        icon: AlertTriangle,
      });
    }
  }

  if (crop === 'cacao') {
    if (rain3d > 25) {
      alerts.push({
        level: rain3d > 50 ? 'danger' : 'warning',
        title: 'Riesgo de monilia y pudrición',
        message: `Se esperan unos ${rain3d.toFixed(0)} mm en 3 días. La lluvia prolongada favorece la monilia y la pudrición de mazorcas. Revisa mazorcas con manchas o deformaciones y retira las enfermas.`,
        icon: CloudRain,
      });
    }
    if (humidity3d > 85) {
      alerts.push({
        level: 'warning',
        title: 'Vigila la escoba de bruja',
        message: `Humedad promedio ${humidity3d}% propaga la escoba de bruja. Poda las ramas con brotes deformes y mejora la ventilación del cacaotal regulando la sombra.`,
        icon: AlertTriangle,
      });
    }
    if (tempMax3d > 34) {
      alerts.push({
        level: 'info',
        title: 'Calor intenso, ajusta la sombra',
        message: `Temperaturas máximas de ${tempMax3d}°C estresan el cacao. Mantén buena sombra con árboles companeros y riega las plántulas jóvenes.`,
        icon: Sun,
      });
    }
  }

  return alerts;
}

interface CropWeatherPanelProps {
  crop: CropType;
  location?: string;
}

export function CropWeatherPanel({ crop, location }: CropWeatherPanelProps) {
  const { weather, forecast, loading, error, locationName } = useWeather(location);

  if (loading) {
    return <div className="card flex items-center gap-2 p-4 text-sm text-earth-400"><Loader2 className="h-4 w-4 animate-spin" />Cargando clima…</div>;
  }
  if (error || !weather) {
    return <Alert type="info">No se pudo cargar el clima. Las alertas estarán disponibles al volver la conexión.</Alert>;
  }

  const alerts = buildCropAlerts(crop, weather, forecast);
  const cropLabel = crop === 'cafe' ? 'cafetal' : crop === 'arroz' ? 'arrozal' : 'cacaotal';

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">Clima para tu {cropLabel}</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-earth-400"><MapPin className="h-3 w-3" />{locationName}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <WeatherChip icon={Thermometer} label="Temperatura" value={`${weather.temperature}°C`} color="text-clay-600" />
          <WeatherChip icon={Droplets} label="Humedad" value={`${weather.humidity}%`} color="text-sky-600" />
          <WeatherChip icon={CloudRain} label="Lluvia hoy" value={`${weather.precipitation} mm`} color="text-sky-600" />
          <WeatherChip icon={Wind} label="Viento" value={`${weather.windSpeed} km/h`} color="text-earth-500" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge color="sky" dot>{getWeatherLabel(weather.weatherCode)}</Badge>
          {weather.evapotranspiration > 0 && <Badge color="harvest">ET₀ {weather.evapotranspiration.toFixed(1)} mm/día</Badge>}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            if (alert.level === 'info') {
              return <Alert key={index} type="info" title={alert.title}>{alert.message}</Alert>;
            }
            return (
              <div key={index} className={`rounded-2xl border p-3 flex items-start gap-2.5 ${
                alert.level === 'danger' ? 'bg-clay-50 border-clay-200 dark:bg-clay-950/30 dark:border-clay-800' : 'bg-harvest-50 border-harvest-200 dark:bg-harvest-950/30 dark:border-harvest-800'
              }`}>
                <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${alert.level === 'danger' ? 'text-clay-600' : 'text-harvest-600'}`} />
                <div>
                  <p className={`text-xs font-bold ${alert.level === 'danger' ? 'text-clay-700 dark:text-clay-300' : 'text-harvest-700 dark:text-harvest-300'}`}>{alert.title}</p>
                  <p className="text-[11px] leading-relaxed text-earth-600 dark:text-earth-300 mt-0.5">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {forecast.length > 0 && (
        <div className="card p-4">
          <p className="mb-2 text-xs font-semibold text-earth-500 dark:text-earth-400">Pronóstico 5 días</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {forecast.map((d, i) => (
              <div key={d.date} className="flex-shrink-0 rounded-xl bg-earth-50 dark:bg-earth-800/60 px-3 py-2 text-center min-w-[68px]">
                <p className="text-[10px] font-medium text-earth-500 dark:text-earth-400">{i === 0 ? 'Hoy' : formatForecastWeekday(d.date)}</p>
                <p className="text-xs font-bold text-earth-900 dark:text-earth-100">{d.tempMax}°</p>
                <p className="text-[10px] text-earth-400">{d.tempMin}°</p>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  <CloudRain className="h-2.5 w-2.5 text-sky-400" />
                  <span className="text-[10px] font-medium text-sky-600">{d.precipitationProb}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherChip({ icon: Icon, label, value, color }: { icon: typeof Thermometer; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-earth-50 dark:bg-earth-800/60 p-2.5">
      <Icon className={`h-4 w-4 ${color} mb-1`} />
      <p className="text-[10px] font-medium text-earth-500 dark:text-earth-400">{label}</p>
      <p className="text-sm font-bold text-earth-800 dark:text-earth-100">{value}</p>
    </div>
  );
}
