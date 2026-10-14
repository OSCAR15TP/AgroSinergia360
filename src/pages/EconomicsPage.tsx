import { useState } from 'react';
import type { AppData, EconomicRecord } from '@/types';
import { uid, formatDate, todayISO } from '@/hooks/useAppData';
import { Badge, EmptyState } from '@/components/UI';
import { Modal } from '@/components/Modal';
import {
  TrendingUp, Plus, Trash2, DollarSign, Calculator,
  Coffee, Wheat, Beef, ArrowUpRight, ArrowDownRight, Scale, Target,
} from 'lucide-react';

interface EconomicsPageProps {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

const MODULE_META = {
  coffee: { label: 'Café', icon: Coffee, color: 'harvest' as const, bg: 'bg-harvest-50', text: 'text-harvest-700' },
  rice: { label: 'Arroz', icon: Wheat, color: 'sky' as const, bg: 'bg-sky-50', text: 'text-sky-700' },
  livestock: { label: 'Ganadería', icon: Beef, color: 'clay' as const, bg: 'bg-clay-50', text: 'text-clay-700' },
};

function calcEconomics(r: EconomicRecord) {
  const totalCosts = r.costs.seeds + r.costs.fertilizer + r.costs.labor + r.costs.transport + r.costs.other;
  const usableKg = r.productionKg * (1 - r.mermaPct / 100);
  const grossIncome = usableKg * r.pricePerKg;
  const netIncome = grossIncome - totalCosts;
  const breakEvenKg = totalCosts / (r.pricePerKg > 0 ? r.pricePerKg : 1);
  const marginPct = grossIncome > 0 ? (netIncome / grossIncome) * 100 : 0;
  const costPerKg = usableKg > 0 ? totalCosts / usableKg : 0;
  const profitPerHa = r.area > 0 ? netIncome / r.area : 0;
  return { totalCosts, usableKg, grossIncome, netIncome, breakEvenKg, marginPct, costPerKg, profitPerHa };
}

function money(n: number): string {
  return n.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function EconomicsPage({ data, update }: EconomicsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterModule, setFilterModule] = useState<'all' | 'coffee' | 'rice' | 'livestock'>('all');

  const records = data.economicRecords
    .filter(r => filterModule === 'all' || r.module === filterModule)
    .sort((a, b) => b.date.localeCompare(a.date));

  const addRecord = (r: EconomicRecord) => {
    update(prev => ({ ...prev, economicRecords: [...prev.economicRecords, r] }));
    setShowForm(false);
  };

  const deleteRecord = (id: string) => {
    update(prev => ({ ...prev, economicRecords: prev.economicRecords.filter(r => r.id !== id) }));
  };

  const totals = records.reduce((acc, r) => {
    const c = calcEconomics(r);
    acc.grossIncome += c.grossIncome;
    acc.netIncome += c.netIncome;
    acc.totalCosts += c.totalCosts;
    return acc;
  }, { grossIncome: 0, netIncome: 0, totalCosts: 0 });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Análisis Económico</h1>
          <p className="text-sm text-earth-500">Rentabilidad, punto de equilibrio y márgenes por cosecha</p>
        </div>
      </div>

      {/* Summary cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Ingresos Brutos" value={`$${money(totals.grossIncome)}`} icon={<DollarSign className="h-4 w-4" />} color="grove" />
          <SummaryCard label="Costos Totales" value={`$${money(totals.totalCosts)}`} icon={<ArrowDownRight className="h-4 w-4" />} color="clay" />
          <SummaryCard label="Ganancia Neta" value={`$${money(totals.netIncome)}`} icon={totals.netIncome >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />} color={totals.netIncome >= 0 ? 'grove' : 'clay'} />
        </div>
      )}

      {/* Filter + Add */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
          {(['all', 'coffee', 'rice', 'livestock'] as const).map(m => (
            <button
              key={m}
              onClick={() => setFilterModule(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterModule === m ? 'bg-white text-earth-900 shadow-sm' : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              {m === 'all' ? 'Todos' : MODULE_META[m].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary ml-auto text-sm py-2 px-3">
          <Plus className="h-4 w-4" /> Nuevo Análisis
        </button>
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <EmptyState
          icon={<Calculator className="h-8 w-8" />}
          title="Sin análisis económicos"
          description="Registra tus cosechas para calcular rentabilidad, punto de equilibrio y márgenes automáticamente."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Crear primer análisis
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const c = calcEconomics(r);
            const meta = MODULE_META[r.module];
            const Icon = meta.icon;
            const profitable = c.netIncome >= 0;
            return (
              <div key={r.id} className="card p-4 animate-slide-up">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg} ${meta.text}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-earth-900">{meta.label}</p>
                      <p className="text-xs text-earth-500">{formatDate(r.date)} · {r.area} ha</p>
                    </div>
                  </div>
                  <button onClick={() => deleteRecord(r.id)} className="text-earth-300 hover:text-clay-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Metric label="Producción" value={`${money(r.productionKg)} kg`} />
                  <Metric label="Utilizable" value={`${money(c.usableKg)} kg`} sub={`-${r.mermaPct}% merma`} />
                  <Metric label="Ingreso Bruto" value={`$${money(c.grossIncome)}`} />
                  <Metric label="Costos Totales" value={`$${money(c.totalCosts)}`} />
                  <Metric label="Ganancia Neta" value={`$${money(c.netIncome)}`} highlight={profitable ? 'positive' : 'negative'} />
                  <Metric label="Margen" value={`${c.marginPct.toFixed(1)}%`} highlight={profitable ? 'positive' : 'negative'} />
                  <Metric label="Punto Equilibrio" value={`${money(c.breakEvenKg)} kg`} sub="para cubrir costos" />
                  <Metric label="Costo/kg" value={`$${money(c.costPerKg)}`} />
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge color={profitable ? 'grove' : 'clay'} dot>
                    {profitable ? 'Rentable' : 'Pérdida'}
                  </Badge>
                  {c.profitPerHa > 0 && (
                    <Badge color="sky">
                      <Target className="h-3 w-3" /> ${money(c.profitPerHa)}/ha
                    </Badge>
                  )}
                  {r.notes && <span className="text-xs text-earth-400 truncate">· {r.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <EconomicForm onAdd={addRecord} onCancel={() => setShowForm(false)} />}
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'grove' | 'clay' }) {
  const colors = {
    grove: 'bg-grove-50 border-grove-200 text-grove-700',
    clay: 'bg-clay-50 border-clay-200 text-clay-700',
  };
  return (
    <div className={`rounded-2xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function Metric({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'positive' | 'negative' }) {
  const hl = highlight === 'positive' ? 'text-grove-700' : highlight === 'negative' ? 'text-clay-600' : 'text-earth-900';
  return (
    <div className="rounded-xl bg-earth-50 px-3 py-2">
      <p className="text-xs text-earth-500 font-medium">{label}</p>
      <p className={`text-sm font-bold ${hl}`}>{value}</p>
      {sub && <p className="text-[10px] text-earth-400">{sub}</p>}
    </div>
  );
}

function EconomicForm({ onAdd, onCancel }: { onAdd: (r: EconomicRecord) => void; onCancel: () => void }) {
  const [module, setModule] = useState<'coffee' | 'rice' | 'livestock'>('coffee');
  const [area, setArea] = useState('');
  const [productionKg, setProductionKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [mermaPct, setMermaPct] = useState('40');
  const [costSeeds, setCostSeeds] = useState('');
  const [costFertilizer, setCostFertilizer] = useState('');
  const [costLabor, setCostLabor] = useState('');
  const [costTransport, setCostTransport] = useState('');
  const [costOther, setCostOther] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onAdd({
      id: uid(),
      module,
      date: todayISO(),
      area: Number(area) || 0,
      productionKg: Number(productionKg) || 0,
      pricePerKg: Number(pricePerKg) || 0,
      mermaPct: Number(mermaPct) || 0,
      costs: {
        seeds: Number(costSeeds) || 0,
        fertilizer: Number(costFertilizer) || 0,
        labor: Number(costLabor) || 0,
        transport: Number(costTransport) || 0,
        other: Number(costOther) || 0,
      },
      notes,
    });
  };

  return (
    <Modal open={true} title="Nuevo Análisis Económico" onClose={onCancel} size="md">
      <div className="space-y-4">
        {/* Module selector */}
        <div>
          <label className="label">Módulo</label>
          <div className="flex gap-2">
            {(['coffee', 'rice', 'livestock'] as const).map(m => {
              const meta = MODULE_META[m];
              const Icon = meta.icon;
              return (
                <button
                  key={m}
                  onClick={() => setModule(m)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                    module === m ? `${meta.bg} ${meta.text} border-current` : 'border-earth-200 text-earth-500 hover:bg-earth-50'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área (ha)</label>
            <input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Producción (kg)</label>
            <input type="number" value={productionKg} onChange={e => setProductionKg(e.target.value)} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Precio/kg ($)</label>
            <input type="number" step="0.01" value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} placeholder="0.00" className="input" />
          </div>
          <div>
            <label className="label">Merma (%)</label>
            <input type="number" value={mermaPct} onChange={e => setMermaPct(e.target.value)} placeholder="40" className="input" />
          </div>
        </div>

        <div className="border-t border-earth-100 pt-3">
          <p className="text-sm font-semibold text-earth-700 mb-2 flex items-center gap-1.5">
            <Scale className="h-4 w-4" /> Costos ($)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Semillas/Plantas</label>
              <input type="number" value={costSeeds} onChange={e => setCostSeeds(e.target.value)} placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Fertilizantes</label>
              <input type="number" value={costFertilizer} onChange={e => setCostFertilizer(e.target.value)} placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Mano de obra</label>
              <input type="number" value={costLabor} onChange={e => setCostLabor(e.target.value)} placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Transporte</label>
              <input type="number" value={costTransport} onChange={e => setCostTransport(e.target.value)} placeholder="0" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Otros costos</label>
              <input type="number" value={costOther} onChange={e => setCostOther(e.target.value)} placeholder="0" className="input" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." className="input" />
        </div>

        {/* Live preview */}
        {(() => {
          const c = calcEconomics({
            id: '', module, date: todayISO(), area: Number(area) || 0,
            productionKg: Number(productionKg) || 0, pricePerKg: Number(pricePerKg) || 0,
            mermaPct: Number(mermaPct) || 0,
            costs: { seeds: Number(costSeeds) || 0, fertilizer: Number(costFertilizer) || 0, labor: Number(costLabor) || 0, transport: Number(costTransport) || 0, other: Number(costOther) || 0 },
            notes: '',
          });
          if (c.grossIncome === 0 && c.totalCosts === 0) return null;
          return (
            <div className="rounded-xl bg-grove-50 border border-grove-200 p-3">
              <p className="text-xs font-semibold text-grove-700 mb-1.5">Vista previa</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-earth-500 text-xs">Bruto:</span> <span className="font-bold text-earth-900">${money(c.grossIncome)}</span></div>
                <div><span className="text-earth-500 text-xs">Neto:</span> <span className={`font-bold ${c.netIncome >= 0 ? 'text-grove-700' : 'text-clay-600'}`}>${money(c.netIncome)}</span></div>
                <div><span className="text-earth-500 text-xs">Margen:</span> <span className={`font-bold ${c.netIncome >= 0 ? 'text-grove-700' : 'text-clay-600'}`}>{c.marginPct.toFixed(1)}%</span></div>
              </div>
            </div>
          );
        })()}

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary flex-1">
            <Plus className="h-4 w-4" /> Guardar Análisis
          </button>
        </div>
      </div>
    </Modal>
  );
}
