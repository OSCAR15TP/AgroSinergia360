import type { Page, AppData } from '@/types';
import { StatCard } from '@/components/StatCard';
import { Alert } from '@/components/Alert';
import { Badge } from '@/components/UI';
import {
  Coffee, Wheat, Beef, CloudSun, Calendar, TrendingUp,
  Sprout, Droplets, Syringe, Bell, ArrowRight, Wifi, WifiOff,
  Leaf, Thermometer, Droplet, Wind, Search, MapPin,
  Sun, Cloud, CloudRain, AlertTriangle, Eye, Loader2,
} from 'lucide-react';
import { formatDate, daysUntil } from '@/hooks/useAppData';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherLabel } from '@/lib/weatherService';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface DashboardProps {
  data: AppData;
  onNavigate: (page: Page) => void;
  isOnline: boolean;
  cloudSynced?: boolean;
  cloudLoading?: boolean;
}

export function Dashboard({ data, onNavigate, isOnline, cloudSynced }: DashboardProps) {
  const { t, lang } = useI18n();
  const locationQuery = data.farmConfig.location || undefined;
  const { weather, forecast, fungalRisk, loading, locationName, searchLocation } = useWeather(locationQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const activeModules = Object.entries(data.farmConfig.modules)
    .filter(([, v]) => v).length;

  const upcomingEvents = data.events
    .filter(e => !e.done && daysUntil(e.date) <= 7 && daysUntil(e.date) >= -1)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const pendingAlerts = data.paddocks.filter(p => p.grassHeight < 20 && p.status === 'en_uso').length
    + data.ricePlots.filter(p => p.soilMoisture < 30).length
    + data.cattle.filter(c => c.healthStatus === 'en_tratamiento' || c.healthStatus === 'en_cuarentena').length;

  const moduleCards = [
    {
      page: 'coffee' as Page,
      icon: Coffee,
      title: 'Café',
      desc: lang === 'en' ? 'AI diagnosis, soil analysis, and agronomic recommendations.' : lang === 'pt' ? 'Diagnóstico por IA, análise do solo e recomendações agronômicas.' : 'Diagnóstico por IA, análisis de suelo y recomendaciones agronómicas.',
      color: 'bg-harvest-500',
      bg: 'bg-harvest-50',
      text: 'text-harvest-700',
      count: data.coffeeDiagnoses.length,
      countLabel: lang === 'en' ? 'diagnoses' : lang === 'pt' ? 'diagnósticos' : 'diagnósticos',
      enabled: data.farmConfig.modules.coffee,
      img: 'https://images.pexels.com/photos/31374541/pexels-photo-31374541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      page: 'rice' as Page,
      icon: Wheat,
      title: 'Arroz',
      desc: lang === 'en' ? 'SIPAS planner, smart irrigation, and agroclimatic monitoring.' : lang === 'pt' ? 'Planejador SIPAS, irrigação inteligente e monitoramento agroclimático.' : 'Planificador SIPAS, riego inteligente y monitoreo agroclimático.',
      color: 'bg-sky-500',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      count: data.ricePlots.length,
      countLabel: lang === 'en' ? 'plots' : lang === 'pt' ? 'lotes' : 'lotes',
      enabled: data.farmConfig.modules.rice,
      img: 'https://images.pexels.com/photos/2131921/pexels-photo-2131921.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      page: 'livestock' as Page,
      icon: Beef,
      title: 'Ganadería',
      desc: lang === 'en' ? 'Herd log, rotational grazing, and organic composting.' : lang === 'pt' ? 'Registro do rebanho, pastejo rotacionado e compostagem orgânica.' : 'Bitácora del hato, pastoreo rotacional y compostaje orgánico.',
      color: 'bg-clay-500',
      bg: 'bg-clay-50',
      text: 'text-clay-700',
      count: data.cattle.length,
      countLabel: lang === 'en' ? 'animals' : lang === 'pt' ? 'animais' : 'animales',
      enabled: data.farmConfig.modules.livestock,
      img: 'https://images.pexels.com/photos/7164014/pexels-photo-7164014.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-grove-800 text-white animate-slide-up">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.pexels.com/photos/34732063/pexels-photo-34732063.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Farmland"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative px-6 py-7 sm:px-8 sm:py-9">
          <div className="flex items-center gap-2 mb-2">
            <Badge color="grove" dot>{t('dash.operational')}</Badge>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOnline ? 'text-grove-200' : 'text-harvest-200'}`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? t('dash.synced') : t('dash.offline_mode')}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-balance">
            {t('dash.welcome')} {data.farmConfig.farmName}
          </h1>
          <p className="mt-1.5 text-sm text-grove-100 max-w-lg">
            {t('dash.tagline')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {moduleCards.filter(m => m.enabled).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.page}
                  onClick={() => onNavigate(m.page)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 transition-all active:scale-95"
                >
                  <Icon className="h-4 w-4" />
                  {m.title}
                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weather strip — Real data from Open-Meteo */}
      <div className="card p-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <CloudSun className="h-5 w-5 text-sky-500" />
          <h2 className="text-sm font-bold text-earth-800 dark:text-earth-100">{t('dash.weather')}</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-earth-400">
              <MapPin className="h-3 w-3" />
              {locationName}
            </span>
            <button
              onClick={() => setSearchOpen(s => !s)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-earth-400 hover:bg-earth-100 hover:text-earth-600 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="mb-3 flex gap-2 animate-slide-down">
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchValue.trim()) { searchLocation(searchValue); setSearchOpen(false); setSearchValue(''); } }}
              placeholder={lang === 'en' ? 'Search city or district...' : lang === 'pt' ? 'Buscar cidade ou distrito...' : 'Buscar ciudad o distrito...'}
              className="input py-2 text-sm"
              autoFocus
            />
            <button
              onClick={() => { if (searchValue.trim()) { searchLocation(searchValue); setSearchOpen(false); setSearchValue(''); } }}
              className="btn-primary py-2 px-3 text-sm"
            >
              Buscar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-earth-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">{t('dash.weather_loading')}</span>
          </div>
        ) : weather ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <WeatherChip icon={Thermometer} label={t('dash.temp')} value={`${weather.temperature}°C`} sub={`Sensación ${weather.feelsLike}°C`} color="text-clay-600" />
              <WeatherChip icon={Droplet} label={t('dash.humidity')} value={`${weather.humidity}%`} sub={weather.uvIndex > 6 ? `UV ${weather.uvIndex} alto` : `UV ${weather.uvIndex}`} color="text-sky-600" />
              <WeatherChip icon={Droplets} label={t('dash.rain')} value={`${weather.precipitation}mm`} color="text-sky-600" />
              <WeatherChip icon={Wind} label={t('dash.wind')} value={`${weather.windSpeed} km/h`} color="text-earth-500" />
            </div>

            {/* Weather condition + Evapotranspiration */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <Badge color="sky" dot>
                {getWeatherLabel(weather.weatherCode)}
              </Badge>
              {weather.evapotranspiration > 0 && (
                <Badge color="harvest">
                  <Sun className="h-3 w-3" /> ET₀ {weather.evapotranspiration.toFixed(1)} mm/día
                </Badge>
              )}
            </div>

            {/* 5-day forecast */}
            {forecast.length > 0 && (
              <div className="border-t border-earth-100 pt-3">
                <p className="text-xs font-semibold text-earth-500 mb-2">{t('dash.forecast')}</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {forecast.map((d, i) => (
                    <div key={d.date} className="flex-shrink-0 rounded-xl bg-earth-50 px-3 py-2 text-center min-w-[68px]">
                      <p className="text-[10px] font-medium text-earth-500">
                        {i === 0 ? t('dash.today') : new Date(d.date).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang, { weekday: 'short' })}
                      </p>
                      <div className="my-1 flex justify-center">
                        <ForecastIcon code={d.weatherCode} />
                      </div>
                      <p className="text-xs font-bold text-earth-900">{d.tempMax}°</p>
                      <p className="text-[10px] text-earth-400">{d.tempMin}°</p>
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        <Droplets className="h-2.5 w-2.5 text-sky-400" />
                        <span className="text-[10px] font-medium text-sky-600">{d.precipitationProb}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fungal risk alert */}
            {fungalRisk && fungalRisk.level !== 'bajo' && (
              <div className={`mt-3 rounded-xl border p-3 flex items-start gap-2.5 animate-slide-down ${
                fungalRisk.level === 'critico' ? 'bg-clay-50 border-clay-200' :
                fungalRisk.level === 'alto' ? 'bg-harvest-50 border-harvest-200' :
                'bg-sky-50 border-sky-200'
              }`}>
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                  fungalRisk.level === 'critico' ? 'text-clay-600' :
                  fungalRisk.level === 'alto' ? 'text-harvest-600' :
                  'text-sky-600'
                }`} />
                <div>
                  <p className={`text-xs font-bold ${
                    fungalRisk.level === 'critico' ? 'text-clay-700' :
                    fungalRisk.level === 'alto' ? 'text-harvest-700' :
                    'text-sky-700'
                  }`}>
                    {t('dash.fungal_risk')}: {fungalRisk.level.toUpperCase()} ({fungalRisk.score}/100)
                  </p>
                  <p className="text-[11px] text-earth-600 mt-0.5">{fungalRisk.reason}</p>
                  <p className="text-[10px] text-earth-400 mt-1">
                    {t('dash.fungal_tip')}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-sm text-earth-400">
            {t('dash.weather_error')}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Leaf className="h-5 w-5" />} label={t('dash.modules_active')} value={activeModules} color="grove" />
        <StatCard icon={<Coffee className="h-5 w-5" />} label={t('dash.coffee_diag')} value={data.coffeeDiagnoses.length} color="harvest" />
        <StatCard icon={<Wheat className="h-5 w-5" />} label={t('dash.rice_plots')} value={data.ricePlots.length} color="sky" />
        <StatCard icon={<Beef className="h-5 w-5" />} label={t('dash.animals')} value={data.cattle.length} color="clay" />
      </div>

      {/* Alerts */}
      {pendingAlerts > 0 && (
        <Alert type="warning" title={t('dash.attention')}>
          Tienes {pendingAlerts} alerta(s) activa(s) en tus módulos. Revisa los detalles en cada sección.
        </Alert>
      )}

      {/* Module cards */}
      <div>
        <h2 className="section-title mb-3">{t('dash.modules')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((m, i) => {
            if (!m.enabled) {
              return (
                <div key={m.page} className="card p-5 opacity-50">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${m.bg} ${m.text}`}>
                    <m.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-earth-800">{m.title}</h3>
                  <p className="mt-1 text-sm text-earth-500">{t('dash.module_disabled')}</p>
                  <button onClick={() => onNavigate('myfarm')} className="mt-3 text-sm font-semibold text-grove-600 hover:underline">
                    {t('dash.activate')} →
                  </button>
                </div>
              );
            }
            const Icon = m.icon;
            return (
              <button
                key={m.page}
                onClick={() => onNavigate(m.page)}
                className="card card-hover overflow-hidden text-left animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative h-32 overflow-hidden">
                  <img src={m.img} alt={m.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-earth-900/70 to-transparent" />
                  <div className={`absolute top-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${m.color} text-white shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <Badge color="gray">{m.count} {m.countLabel}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-earth-900">{m.title}</h3>
                  <p className="mt-1 text-sm text-earth-500 leading-relaxed">{m.desc}</p>
                  <span className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${m.text}`}>
                    {t('dash.open_module')} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming events */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-grove-600" />
          <h2 className="section-title">{t('dash.upcoming')}</h2>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="card p-6 text-center text-sm text-earth-500">
            {t('dash.no_events')}
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((e) => {
              const days = daysUntil(e.date);
              const urgency = days < 0 ? 'danger' : days <= 2 ? 'warning' : 'info';
              const urgencyColor = urgency === 'danger' ? 'clay' : urgency === 'warning' ? 'harvest' : 'sky';
              return (
                <div key={e.id} className="card p-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-${urgencyColor}-100 text-${urgencyColor}-600`}>
                    <EventIcon type={e.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-earth-800 truncate">{e.title}</p>
                    <p className="text-xs text-earth-500 truncate">{e.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-earth-700">{formatDate(e.date)}</p>
                    <p className={`text-xs font-medium text-${urgencyColor}-600`}>
                      {days < 0 ? t('dash.overdue') : days === 0 ? t('dash.today') : `${t('dash.in_days')} ${days}d`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick tips */}
      <div className="card p-5 bg-grove-50 border-grove-200">
        <div className="flex items-start gap-3">
          <Sprout className="h-5 w-5 text-grove-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-grove-900">{t('dash.tip_title')}</h3>
            <p className="mt-1 text-sm text-grove-800">
              {t('dash.tip_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherChip({ icon: Icon, label, value, sub, color }: { icon: typeof Thermometer; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-earth-50 px-3 py-2.5">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-xs text-earth-500 font-medium">{label}</p>
        <p className="text-sm font-bold text-earth-800">{value}</p>
        {sub && <p className="text-[10px] text-earth-400">{sub}</p>}
      </div>
    </div>
  );
}

function ForecastIcon({ code }: { code: number }) {
  if (code <= 1) return <Sun className="h-5 w-5 text-harvest-500" />;
  if (code <= 3) return <Cloud className="h-5 w-5 text-earth-400" />;
  if (code <= 48) return <Eye className="h-5 w-5 text-earth-400" />;
  if (code <= 67) return <CloudRain className="h-5 w-5 text-sky-500" />;
  if (code <= 75) return <CloudRain className="h-5 w-5 text-sky-300" />;
  if (code <= 82) return <CloudRain className="h-5 w-5 text-sky-500" />;
  if (code >= 95) return <CloudRain className="h-5 w-5 text-clay-500" />;
  return <Cloud className="h-5 w-5 text-earth-400" />;
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'vacunacion': return <Syringe className="h-5 w-5" />;
    case 'pesaje': return <TrendingUp className="h-5 w-5" />;
    case 'rotacion': return <Sprout className="h-5 w-5" />;
    case 'riego': return <Droplets className="h-5 w-5" />;
    case 'diagnostico': return <Coffee className="h-5 w-5" />;
    default: return <Bell className="h-5 w-5" />;
  }
}
