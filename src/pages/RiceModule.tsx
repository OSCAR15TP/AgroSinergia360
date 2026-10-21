import { useState } from 'react';
import type { AppData, RicePlot, PlotStatus } from '@/types';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { Badge, EmptyState, ProgressBar } from '@/components/UI';
import { StatCard } from '@/components/StatCard';
import {
  Wheat, Plus, Trash2, Check, Droplets, CloudSun, Map, RefreshCw, Camera,
  Thermometer, Sprout, AlertTriangle, Info, Eye, Calculator, X, ArrowRight,
} from 'lucide-react';
import { uid, formatDate, todayISO } from '@/hooks/useAppData';
import { ImageDiagnosisModal } from '@/components/ImageDiagnosisModal';
import { analyzeRicePhoto } from '@/lib/visualDiagnosis';
import { resolveDocPath } from '@/lib/localGuides';

interface RiceModuleProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

type Tab = 'plots' | 'climate' | 'irrigation';

const STATUS_INFO: Record<PlotStatus, { label: string; color: 'grove' | 'sky' | 'harvest' | 'earth'; desc: string }> = {
  produccion: { label: 'En Producción', color: 'grove', desc: 'Cultivo de arroz en fase activa' },
  rotacion: { label: 'En Rotación', color: 'harvest', desc: 'Transición entre ciclos' },
  pastura: { label: 'En Pastura', color: 'sky', desc: 'Fase de pastura SIPAS' },
  preparacion: { label: 'En Preparación', color: 'earth', desc: 'Preparando suelo para próximo ciclo' },
};

export function RiceModule({ data, update }: RiceModuleProps) {
  const [tab, setTab] = useState<Tab>('plots');
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [showImageDiagnosis, setShowImageDiagnosis] = useState(false);

  const totalArea = data.ricePlots.reduce((s, p) => s + p.area, 0);
  const inProduction = data.ricePlots.filter(p => p.status === 'produccion').length;
  const lowMoisture = data.ricePlots.filter(p => p.soilMoisture < 30).length;
  const avgMoisture = data.ricePlots.length > 0
    ? Math.round(data.ricePlots.reduce((s, p) => s + p.soilMoisture, 0) / data.ricePlots.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md">
          <Wheat className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Módulo Arroz</h1>
          <p className="text-sm text-earth-500">SIPAS, riego inteligente y monitoreo agroclimático</p>
          <button onClick={() => setShowImageDiagnosis(true)} className="btn-secondary mt-2 text-xs py-1.5">
            <Camera className="h-3.5 w-3.5" /> Diagnóstico por imagen
          </button>
        </div>
      </div>

      <div className="relative h-40 overflow-hidden rounded-3xl shadow-sm sm:h-48">
        <img src={resolveDocPath('/docs/es/arroz/image.png')} alt="Cultivo de arroz" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
        <p className="absolute bottom-4 left-4 text-lg font-bold text-white drop-shadow-sm">Manejo inteligente del cultivo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Map className="h-5 w-5" />} label="Lotes Totales" value={data.ricePlots.length} color="sky" />
        <StatCard icon={<Sprout className="h-5 w-5" />} label="En Producción" value={inProduction} color="grove" />
        <StatCard icon={<Droplets className="h-5 w-5" />} label="Humedad Prom." value={`${avgMoisture}%`} color="sky" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Riego Requerido" value={lowMoisture} color="clay" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
        <TabButton active={tab === 'plots'} onClick={() => setTab('plots')} icon={<Map className="h-4 w-4" />}>Lotes SIPAS</TabButton>
        <TabButton active={tab === 'climate'} onClick={() => setTab('climate')} icon={<CloudSun className="h-4 w-4" />}>Agroclima</TabButton>
        <TabButton active={tab === 'irrigation'} onClick={() => setTab('irrigation')} icon={<Droplets className="h-4 w-4" />}>Riego</TabButton>
      </div>

      {tab === 'plots' && (
        <PlotsTab data={data} update={update} showAddPlot={showAddPlot} setShowAddPlot={setShowAddPlot} />
      )}
      {tab === 'climate' && <ClimateTab plots={data.ricePlots} />}
      {tab === 'irrigation' && <IrrigationTab plots={data.ricePlots} />}

      <ImageDiagnosisModal
        open={showImageDiagnosis}
        onClose={() => setShowImageDiagnosis(false)}
        title="Diagnóstico visual del arroz"
        description="Sube una imagen de las hojas o del cultivo para obtener una orientación inicial sobre estrés, plagas o enfermedades."
        accent="sky"
        analyze={analyzeRicePhoto}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
        active ? 'bg-white text-sky-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function PlotsTab({ data, update, showAddPlot, setShowAddPlot }: {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  showAddPlot: boolean;
  setShowAddPlot: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Alert type="info" title="Sistema SIPAS">
        El Sistema Integrado de Arroz y Pasturas rota lotes entre arroz y pastura para combatir biológicamente el arroz rojo y malezas, reduciendo hasta 70% el uso de herbicidas.
      </Alert>

      <div className="flex items-center justify-between">
        <h3 className="section-title">Mis Lotes</h3>
        <button onClick={() => setShowAddPlot(true)} className="btn-primary text-sm py-2">
          <Plus className="h-4 w-4" /> Agregar Lote
        </button>
      </div>

      {data.ricePlots.length === 0 ? (
        <EmptyState
          icon={<Map className="h-8 w-8" />}
          title="Sin lotes registrados"
          description="Registra tus lotes de arroz para planificar rotaciones SIPAS y monitorear el riego."
          action={<button onClick={() => setShowAddPlot(true)} className="btn-primary"><Plus className="h-4 w-4" /> Agregar Lote</button>}
        />
      ) : (
        <div className="space-y-3">
          {data.ricePlots.map((plot) => (
            <PlotCard
              key={plot.id}
              plot={plot}
              onDelete={() => update(prev => ({ ...prev, ricePlots: prev.ricePlots.filter(p => p.id !== plot.id) }))}
              onRotate={() => rotatePlot(plot, update)}
              onUpdate={(updated) => update(prev => ({ ...prev, ricePlots: prev.ricePlots.map(p => p.id === updated.id ? updated : p) }))}
            />
          ))}
        </div>
      )}

      <AddPlotModal
        open={showAddPlot}
        onClose={() => setShowAddPlot(false)}
        onAdd={(plot) => update(prev => ({ ...prev, ricePlots: [...prev.ricePlots, plot] }))}
      />
    </div>
  );
}

function rotatePlot(plot: RicePlot, update: (updater: (prev: AppData) => AppData) => void) {
  const phases: PlotStatus[] = ['produccion', 'rotacion', 'pastura', 'preparacion'];
  const currentIdx = phases.indexOf(plot.status);
  const nextStatus = phases[(currentIdx + 1) % phases.length];
  update(prev => ({
    ...prev,
    ricePlots: prev.ricePlots.map(p => p.id === plot.id ? {
      ...p,
      status: nextStatus,
      rotationPhase: p.rotationPhase + 1,
      lastRotationDate: todayISO(),
    } : p),
    events: [{
      id: uid(),
      date: todayISO(),
      type: 'rotacion' as const,
      title: `Rotación SIPAS: ${plot.name}`,
      description: `Lote pasado a ${STATUS_INFO[nextStatus].label}`,
      module: 'rice' as const,
      done: true,
    }, ...prev.events],
  }));
}

function getMoistureZones(plot: RicePlot): { name: string; value: number }[] {
  return plot.moistureZones ?? [
    { name: 'Entrada', value: Math.max(0, Math.min(100, plot.soilMoisture + 5)) },
    { name: 'Centro', value: plot.soilMoisture },
    { name: 'Fondo', value: Math.max(0, Math.min(100, plot.soilMoisture - 5)) },
  ];
}

function PlotCard({ plot, onDelete, onRotate, onUpdate }: { plot: RicePlot; onDelete: () => void; onRotate: () => void; onUpdate: (plot: RicePlot) => void }) {
  const info = STATUS_INFO[plot.status];
  const moistureColor = plot.soilMoisture < 30 ? 'clay' : plot.soilMoisture < 50 ? 'harvest' : 'grove';
  return (
    <div className="card p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-earth-900">{plot.name}</h4>
            <Badge color={info.color} dot>{info.label}</Badge>
          </div>
          <p className="text-xs text-earth-500 mt-0.5">{plot.area} ha — Fase {plot.rotationPhase}</p>
        </div>
        <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        <ProgressBar value={plot.soilMoisture} max={100} label="Humedad promedio del lote" unit="%" color={moistureColor as 'grove' | 'harvest' | 'clay'} />
      </div>

      <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-sky-800">Humedad por zona</p>
          <span className="text-[10px] text-sky-600">Actualiza cada punto</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {getMoistureZones(plot).map((zone, index) => (
            <label key={zone.name} className="text-[10px] font-medium text-earth-500">
              {zone.name}
              <input
                type="number"
                min="0"
                max="100"
                value={zone.value}
                onChange={(event) => {
                  const value = Math.max(0, Math.min(100, Number(event.target.value) || 0));
                  const zones = getMoistureZones(plot).map((current, currentIndex) => currentIndex === index ? { ...current, value } : current);
                  onUpdate({ ...plot, soilMoisture: Math.round(zones.reduce((sum, current) => sum + current.value, 0) / zones.length), moistureZones: zones });
                }}
                className="input mt-1 px-2 py-1.5 text-xs"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-earth-500">Última rotación: {plot.lastRotationDate ? formatDate(plot.lastRotationDate) : '—'}</span>
        <button onClick={onRotate} className="btn-secondary text-xs py-1.5 px-3">
          <RefreshCw className="h-3.5 w-3.5" /> Rotar
        </button>
      </div>

      {plot.soilMoisture < 30 && (
        <Alert type="warning">
          <span className="text-xs">Humedad baja. Se recomienda riego inmediato.</span>
        </Alert>
      )}
    </div>
  );
}

function AddPlotModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (plot: RicePlot) => void;
}) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<PlotStatus>('preparacion');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: uid(),
      name: name.trim(),
      area: parseFloat(area) || 0,
      status,
      rotationPhase: 0,
      soilMoisture: 50,
      lastRotationDate: todayISO(),
      moistureZones: [
        { name: 'Entrada', value: 50 },
        { name: 'Centro', value: 50 },
        { name: 'Fondo', value: 50 },
      ],
      notes: '',
    });
    setName('');
    setArea('');
    setStatus('preparacion');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar Lote">
      <div className="space-y-4">
        <div>
          <label className="label">Nombre del lote</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Lote 1 Norte" className="input" />
        </div>
        <div>
          <label className="label">Área (hectáreas)</label>
          <input type="number" step="0.1" min="0" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: 2.5" className="input" />
        </div>
        <div>
          <label className="label">Estado inicial</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as PlotStatus)} className="input">
            <option value="preparacion">En Preparación</option>
            <option value="produccion">En Producción</option>
            <option value="rotacion">En Rotación</option>
            <option value="pastura">En Pastura</option>
          </select>
        </div>
        <button onClick={handleAdd} className="btn-primary w-full">
          <Check className="h-4 w-4" /> Agregar Lote
        </button>
      </div>
    </Modal>
  );
}

function ClimateTab({ plots }: { plots: RicePlot[] }) {
  // Simulated agroclimate data
  const climate = {
    temp: 26.5,
    humidity: 72,
    soilShallow: 45,
    soilDeep: 58,
    eto: 4.2,
    rainfall: 8.5,
    wind: 12,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Alert type="info" title="Monitoreo Agroclimático">
        Datos de referencia basados en estaciones climáticas abiertas. La estructura está lista para conectar APIs climáticas reales en el futuro.
      </Alert>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CloudSun className="h-5 w-5 text-sky-500" />
          <h3 className="text-sm font-bold text-earth-800">Estación Agroclimática</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ClimateMetric icon={Thermometer} label="Temperatura" value={`${climate.temp}°C`} color="text-clay-600" bg="bg-clay-50" />
          <ClimateMetric icon={Droplets} label="Humedad Rel." value={`${climate.humidity}%`} color="text-sky-600" bg="bg-sky-50" />
          <ClimateMetric icon={Droplets} label="Lluvia (24h)" value={`${climate.rainfall}mm`} color="text-sky-600" bg="bg-sky-50" />
          <ClimateMetric icon={Eye} label="Humedad 0-20cm" value={`${climate.soilShallow}%`} color="text-sky-600" bg="bg-sky-50" />
          <ClimateMetric icon={Eye} label="Humedad 20-40cm" value={`${climate.soilDeep}%`} color="text-sky-600" bg="bg-sky-50" />
          <ClimateMetric icon={CloudSun} label="Evapotransp." value={`${climate.eto}mm/d`} color="text-harvest-600" bg="bg-harvest-50" />
        </div>
      </div>

      <div>
        <h3 className="section-title mb-2">Humedad por Lote</h3>
        {plots.length === 0 ? (
          <p className="card p-4 text-sm text-earth-500 text-center">Registra lotes para monitorear su humedad.</p>
        ) : (
          <div className="space-y-2">
            {plots.map((p) => (
              <div key={p.id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-earth-800">{p.name}</span>
                  <span className="text-xs text-earth-500">{p.soilMoisture}%</span>
                </div>
                <ProgressBar value={p.soilMoisture} max={100} color={p.soilMoisture < 30 ? 'clay' : 'sky'} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4 bg-sky-50 border-sky-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-sky-900">¿Qué es la evapotranspiración?</h4>
            <p className="text-sm text-sky-800 mt-1">
              La evapotranspiración (ET₀) mide la cantidad de agua que el cultivo pierde por evaporación del suelo y transpiración de la planta. Se usa para calcular cuánta agua de riego necesita el arroz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClimateMetric({ icon: Icon, label, value, color, bg }: { icon: typeof Thermometer; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl ${bg} p-3`}>
      <Icon className={`h-5 w-5 ${color} mb-1.5`} />
      <p className="text-xs text-earth-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-earth-800">{value}</p>
    </div>
  );
}

function IrrigationTab({ plots }: { plots: RicePlot[] }) {
  const [selectedPlot, setSelectedPlot] = useState<string>('');
  const [eto, setEto] = useState('4.2');
  const [rainfall, setRainfall] = useState('0');

  const plot = plots.find(p => p.id === selectedPlot);
  const etoVal = parseFloat(eto) || 0;
  const rainVal = parseFloat(rainfall) || 0;
  const cropCoeff = 1.2; // Kc for rice
  const waterNeed = Math.max(0, (etoVal * cropCoeff - rainVal) * 10).toFixed(1);
  const needsIrrigation = plot ? plot.soilMoisture < 50 : false;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-sky-600" />
          <h3 className="text-sm font-bold text-earth-800">Calculadora de Riego</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Seleccionar lote</label>
            <select value={selectedPlot} onChange={(e) => setSelectedPlot(e.target.value)} className="input">
              <option value="">— Selecciona un lote —</option>
              {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.area} ha)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Evapotranspiración (mm/d)</label>
              <input type="number" step="0.1" value={eto} onChange={(e) => setEto(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Lluvia esperada (mm)</label>
              <input type="number" step="0.1" value={rainfall} onChange={(e) => setRainfall(e.target.value)} className="input" />
            </div>
          </div>
        </div>
      </div>

      {plot && (
        <div className="space-y-3 animate-scale-in">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-earth-800">{plot.name}</h4>
              <Badge color={needsIrrigation ? 'clay' : 'grove'} dot>
                {needsIrrigation ? 'Riego recomendado' : 'Humedad adecuada'}
              </Badge>
            </div>
            <ProgressBar value={plot.soilMoisture} max={100} label="Humedad actual" unit="%" color={plot.soilMoisture < 30 ? 'clay' : 'sky'} />
          </div>

          <div className="card p-4 bg-sky-50 border-sky-200">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Necesidad de agua de riego</p>
            <p className="mt-1 text-3xl font-bold text-sky-800">
              {waterNeed}<span className="text-lg font-normal text-sky-600 ml-1">mm/día</span>
            </p>
            <p className="mt-1 text-sm text-sky-700">
              Para {plot.area} ha: <span className="font-bold">{(parseFloat(waterNeed) * plot.area * 10).toFixed(0)} m³/día</span>
            </p>
          </div>

          {needsIrrigation && (
            <Alert type="warning" title="Riego Recomendado">
              La humedad del suelo está por debajo del 50%. Se recomienda aplicar riego para mantener el cultivo en óptimas condiciones.
            </Alert>
          )}
        </div>
      )}

      {!plot && plots.length > 0 && (
        <div className="card p-6 text-center text-sm text-earth-500">
          Selecciona un lote para calcular la necesidad de riego.
        </div>
      )}

      {plots.length === 0 && (
        <EmptyState icon={<Droplets className="h-8 w-8" />} title="Sin lotes para calcular" description="Agrega lotes en la pestaña SIPAS para usar la calculadora de riego." />
      )}
    </div>
  );
}
