import { useState } from 'react';
import type { AppData, CarbonRecord } from '@/types';
import { uid, formatDate, todayISO } from '@/hooks/useAppData';
import { ProgressBar, EmptyState, Badge } from '@/components/UI';
import { Modal } from '@/components/Modal';
import {
  Leaf, Plus, Trash2, Footprints, TreePine, Fuel, Zap,
  Recycle, TrendingDown, AlertCircle,
} from 'lucide-react';

interface CarbonPageProps {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

const FUEL_FACTORS: Record<string, number> = {
  diesel: 2.63,
  gasolina: 2.27,
  electrico: 0.0,
};

const FERTILIZER_FACTOR = 3.0;
const ELECTRICITY_FACTOR = 0.4;
const SHADE_TREE_SEQUESTRATION_KG_PER_YEAR = 22;

function calcCarbon(r: CarbonRecord) {
  const fertilizerEmissions = r.fertilizerKg * FERTILIZER_FACTOR;
  const fuelEmissions = r.fuelLiters * (FUEL_FACTORS[r.fuelType] ?? 2.63);
  const electricityEmissions = r.electricityKwh * ELECTRICITY_FACTOR;
  const totalEmissions = fertilizerEmissions + fuelEmissions + electricityEmissions;
  const sequestration = r.shadeTrees * SHADE_TREE_SEQUESTRATION_KG_PER_YEAR;
  const netEmissions = totalEmissions - sequestration;
  const perHa = r.area > 0 ? netEmissions / r.area : 0;
  const isCarbonNegative = netEmissions < 0;
  return { fertilizerEmissions, fuelEmissions, electricityEmissions, totalEmissions, sequestration, netEmissions, perHa, isCarbonNegative };
}

const WORLD_AVG_CACAO_PER_HA = 2500;

export function CarbonPage({ data, update }: CarbonPageProps) {
  const [showForm, setShowForm] = useState(false);

  const records = [...data.carbonRecords].sort((a, b) => b.date.localeCompare(a.date));

  const addRecord = (r: CarbonRecord) => {
    update(prev => ({ ...prev, carbonRecords: [...prev.carbonRecords, r] }));
    setShowForm(false);
  };

  const deleteRecord = (id: string) => {
    update(prev => ({ ...prev, carbonRecords: prev.carbonRecords.filter(r => r.id !== id) }));
  };

  const totals = records.reduce((acc, r) => {
    const c = calcCarbon(r);
    acc.totalEmissions += c.totalEmissions;
    acc.sequestration += c.sequestration;
    acc.netEmissions += c.netEmissions;
    acc.area += r.area;
    return acc;
  }, { totalEmissions: 0, sequestration: 0, netEmissions: 0, area: 0 });

  const avgPerHa = totals.area > 0 ? totals.netEmissions / totals.area : 0;
  const comparisonPct = WORLD_AVG_CACAO_PER_HA > 0 ? (avgPerHa / WORLD_AVG_CACAO_PER_HA) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md">
          <Footprints className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-earth-900">Huella de Carbono</h1>
          <p className="text-sm text-earth-500">Emisiones de tu finca y compensación por árboles de sombra</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2 px-3">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {/* Overall summary */}
      {records.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Recycle className="h-5 w-5 text-grove-600" />
            <h2 className="text-sm font-bold text-earth-800">Resumen de tu finca</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <SummaryCard label="Emisiones totales" value={`${totals.totalEmissions.toFixed(0)} kg`} sub="CO₂e" icon={<TrendingDown className="h-4 w-4" />} color="clay" />
            <SummaryCard label="Captura de carbono" value={`${totals.sequestration.toFixed(0)} kg`} sub="CO₂e/año" icon={<TreePine className="h-4 w-4" />} color="grove" />
            <SummaryCard label="Neto" value={`${totals.netEmissions.toFixed(0)} kg`} sub="CO₂e" icon={<Leaf className="h-4 w-4" />} color={totals.netEmissions < 0 ? 'grove' : 'clay'} />
            <SummaryCard label="Por hectárea" value={`${avgPerHa.toFixed(0)} kg`} sub="CO₂e/ha" icon={<Zap className="h-4 w-4" />} color={avgPerHa < 0 ? 'grove' : 'clay'} />
          </div>

          {/* Comparison bar */}
          <div className="rounded-xl bg-earth-50 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-earth-600">Tu huella vs. promedio mundial</span>
              <span className="text-xs font-bold text-earth-800">
                {comparisonPct < 0 ? 'Carbono-negativa' : `${comparisonPct.toFixed(0)}% del promedio`}
              </span>
            </div>
            <ProgressBar
              value={Math.min(Math.abs(avgPerHa), WORLD_AVG_CACAO_PER_HA)}
              max={WORLD_AVG_CACAO_PER_HA}
              color={avgPerHa < 0 ? 'grove' : avgPerHa < WORLD_AVG_CACAO_PER_HA * 0.5 ? 'grove' : 'clay'}
              unit=" kg"
            />
            <p className="mt-1.5 text-[10px] text-earth-400">
              Promedio de referencia: ~{WORLD_AVG_CACAO_PER_HA} kg CO₂e/ha/año (cultivos tropicales)
            </p>
          </div>

          {totals.netEmissions < 0 && (
            <div className="mt-3 rounded-xl bg-grove-50 border border-grove-200 p-3 flex items-start gap-2 animate-slide-down">
              <Leaf className="h-4 w-4 text-grove-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-grove-800">
                <strong>¡Tu finca es carbono-negativa!</strong> Tus árboles de sombra capturan más CO₂ del que emites. Estás ayudando a revertir el cambio climático.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <EmptyState
          icon={<Footprints className="h-8 w-8" />}
          title="Sin registros de huella de carbono"
          description="Registra tus emisiones de fertilizantes, combustible y electricidad para calcular tu impacto ambiental."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Crear primer registro
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const c = calcCarbon(r);
            return (
              <div key={r.id} className="card p-4 animate-slide-up">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-earth-900">{formatDate(r.date)}</p>
                    <p className="text-xs text-earth-500">{r.area} ha · {r.shadeTrees} árboles de sombra</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={c.isCarbonNegative ? 'grove' : 'clay'} dot>
                      {c.isCarbonNegative ? 'Carbono-negativa' : 'Emite CO₂'}
                    </Badge>
                    <button onClick={() => deleteRecord(r.id)} className="text-earth-300 hover:text-clay-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                  <CarbonMetric icon={<Zap className="h-3.5 w-3.5" />} label="Fertilizante" value={`${c.fertilizerEmissions.toFixed(1)} kg`} sub={`${r.fertilizerKg} kg N`} />
                  <CarbonMetric icon={<Fuel className="h-3.5 w-3.5" />} label="Combustible" value={`${c.fuelEmissions.toFixed(1)} kg`} sub={`${r.fuelLiters} L ${r.fuelType}`} />
                  <CarbonMetric icon={<AlertCircle className="h-3.5 w-3.5" />} label="Electricidad" value={`${c.electricityEmissions.toFixed(1)} kg`} sub={`${r.electricityKwh} kWh`} />
                  <CarbonMetric icon={<TreePine className="h-3.5 w-3.5" />} label="Captura" value={`${c.sequestration.toFixed(1)} kg`} sub={`${r.shadeTrees} árboles`} color="grove" />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-earth-50 px-3 py-2">
                  <span className="text-sm font-semibold text-earth-700">Neto</span>
                  <span className={`text-lg font-bold ${c.isCarbonNegative ? 'text-grove-700' : 'text-clay-600'}`}>
                    {c.netEmissions > 0 ? '+' : ''}{c.netEmissions.toFixed(1)} kg CO₂e
                  </span>
                </div>

                {r.notes && <p className="mt-2 text-xs text-earth-400">{r.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <div className="card p-4 bg-grove-50 border-grove-200">
        <div className="flex items-start gap-2.5">
          <Leaf className="h-5 w-5 text-grove-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-grove-900">¿Cómo se calcula?</h3>
            <p className="mt-1 text-xs text-grove-800 leading-relaxed">
              Los factores de emisión siguen lineamientos del IPCC: ~3 kg CO₂e por kg de nitrógeno sintético aplicado,
              ~2.63 kg CO₂e por litro de diésel (2.27 gasolina), y ~0.4 kg CO₂e por kWh de la red eléctrica.
              Cada árbol de sombra captura aproximadamente 22 kg CO₂/año.
            </p>
          </div>
        </div>
      </div>

      {showForm && <CarbonForm onAdd={addRecord} onCancel={() => setShowForm(false)} />}
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: 'grove' | 'clay' }) {
  const colors = {
    grove: 'bg-grove-50 border-grove-200 text-grove-700',
    clay: 'bg-clay-50 border-clay-200 text-clay-700',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-70">{sub}</p>
    </div>
  );
}

function CarbonMetric({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color?: 'grove' }) {
  const bg = color === 'grove' ? 'bg-grove-50' : 'bg-earth-50';
  return (
    <div className={`rounded-xl ${bg} px-3 py-2`}>
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-xs text-earth-500 font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-earth-900">{value}</p>
      <p className="text-[10px] text-earth-400">{sub}</p>
    </div>
  );
}

function CarbonForm({ onAdd, onCancel }: { onAdd: (r: CarbonRecord) => void; onCancel: () => void }) {
  const [area, setArea] = useState('');
  const [fertilizerKg, setFertilizerKg] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelType, setFuelType] = useState<'diesel' | 'gasolina' | 'electrico'>('diesel');
  const [electricityKwh, setElectricityKwh] = useState('');
  const [shadeTrees, setShadeTrees] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onAdd({
      id: uid(),
      date: todayISO(),
      area: Number(area) || 0,
      fertilizerKg: Number(fertilizerKg) || 0,
      fuelLiters: Number(fuelLiters) || 0,
      fuelType,
      electricityKwh: Number(electricityKwh) || 0,
      shadeTrees: Number(shadeTrees) || 0,
      notes,
    });
  };

  return (
    <Modal open={true} title="Nuevo Registro de Huella de Carbono" onClose={onCancel} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área (ha)</label>
            <input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Árboles de sombra</label>
            <input type="number" value={shadeTrees} onChange={e => setShadeTrees(e.target.value)} placeholder="0" className="input" />
          </div>
        </div>

        <div className="border-t border-earth-100 pt-3">
          <p className="text-sm font-semibold text-earth-700 mb-2 flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4" /> Fuentes de emisión
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">Fertilizante sintético (kg de N)</label>
              <input type="number" value={fertilizerKg} onChange={e => setFertilizerKg(e.target.value)} placeholder="0" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Combustible (litros)</label>
                <input type="number" value={fuelLiters} onChange={e => setFuelLiters(e.target.value)} placeholder="0" className="input" />
              </div>
              <div>
                <label className="label">Tipo de combustible</label>
                <select value={fuelType} onChange={e => setFuelType(e.target.value as 'diesel' | 'gasolina' | 'electrico')} className="input">
                  <option value="diesel">Diésel</option>
                  <option value="gasolina">Gasolina</option>
                  <option value="electrico">Eléctrico</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Electricidad (kWh)</label>
              <input type="number" value={electricityKwh} onChange={e => setElectricityKwh(e.target.value)} placeholder="0" className="input" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." className="input" />
        </div>

        {/* Live preview */}
        {(() => {
          const c = calcCarbon({
            id: '', date: todayISO(), area: Number(area) || 0,
            fertilizerKg: Number(fertilizerKg) || 0, fuelLiters: Number(fuelLiters) || 0, fuelType,
            electricityKwh: Number(electricityKwh) || 0, shadeTrees: Number(shadeTrees) || 0, notes: '',
          });
          if (c.totalEmissions === 0 && c.sequestration === 0) return null;
          return (
            <div className={`rounded-xl border p-3 ${c.isCarbonNegative ? 'bg-grove-50 border-grove-200' : 'bg-clay-50 border-clay-200'}`}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: c.isCarbonNegative ? '#244d2c' : '#a73b32' }}>Vista previa</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-earth-500 text-xs">Emisiones:</span> <span className="font-bold text-earth-900">{c.totalEmissions.toFixed(1)} kg</span></div>
                <div><span className="text-earth-500 text-xs">Captura:</span> <span className="font-bold text-grove-700">{c.sequestration.toFixed(1)} kg</span></div>
                <div><span className="text-earth-500 text-xs">Neto:</span> <span className={`font-bold ${c.isCarbonNegative ? 'text-grove-700' : 'text-clay-600'}`}>{c.netEmissions > 0 ? '+' : ''}{c.netEmissions.toFixed(1)} kg</span></div>
              </div>
            </div>
          );
        })()}

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary flex-1">
            <Plus className="h-4 w-4" /> Guardar Registro
          </button>
        </div>
      </div>
    </Modal>
  );
}
