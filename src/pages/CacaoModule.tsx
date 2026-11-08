import { useState } from 'react';
import type { AppData, CacaoHarvest, CacaoLot } from '@/types';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { EmptyState } from '@/components/UI';
import { TabButton } from '@/components/TabButton';
import { StatCard } from '@/components/StatCard';
import { Sprout, Plus, Trash2, Check, Map, Wheat, Package, Scale, CloudSun } from 'lucide-react';
import { uid, formatDate, todayISO } from '@/hooks/useAppData';
import { CropWeatherPanel } from '@/components/CropWeatherPanel';

interface CacaoModuleProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

type Tab = 'lots' | 'harvests' | 'climate';

export function CacaoModule({ data, update }: CacaoModuleProps) {
  const [tab, setTab] = useState<Tab>('lots');
  const [showAddLot, setShowAddLot] = useState(false);
  const [showAddHarvest, setShowAddHarvest] = useState(false);

  const totalArea = data.cacaoLots.reduce((sum, lot) => sum + lot.area, 0);
  const totalTrees = data.cacaoLots.reduce((sum, lot) => sum + lot.trees, 0);
  const totalDryKg = data.cacaoHarvests.reduce((sum, harvest) => sum + harvest.dryKg, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-earth-700 text-white shadow-md">
          <Sprout className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Módulo Cacao</h1>
          <p className="text-sm text-earth-500">Lotes, árboles y registro de cosechas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Map className="h-5 w-5" />} label="Lotes" value={data.cacaoLots.length} color="grove" />
        <StatCard icon={<Sprout className="h-5 w-5" />} label="Árboles" value={totalTrees} color="grove" />
        <StatCard icon={<Package className="h-5 w-5" />} label="Cosechas" value={data.cacaoHarvests.length} color="harvest" />
        <StatCard icon={<Scale className="h-5 w-5" />} label="Cacao seco (kg)" value={totalDryKg} color="clay" />
      </div>

      <div className="flex min-w-0 gap-1 overflow-hidden rounded-xl bg-earth-100 p-1">
        <TabButton active={tab === 'lots'} onClick={() => setTab('lots')} icon={<Map className="h-4 w-4" />}>Lotes</TabButton>
        <TabButton active={tab === 'harvests'} onClick={() => setTab('harvests')} icon={<Wheat className="h-4 w-4" />}>Cosechas</TabButton>
        <TabButton active={tab === 'climate'} onClick={() => setTab('climate')} icon={<CloudSun className="h-4 w-4" />}>Clima</TabButton>
      </div>

      {tab === 'lots' && (
        <LotsTab data={data} update={update} totalArea={totalArea} onAdd={() => setShowAddLot(true)} />
      )}
      {tab === 'harvests' && (
        <HarvestsTab data={data} update={update} onAdd={() => setShowAddHarvest(true)} />
      )}

      {tab === 'climate' && (
        <div className="animate-fade-in">
          <CropWeatherPanel crop="cacao" location={data.farmConfig.location || undefined} />
        </div>
      )}

      <AddLotModal
        open={showAddLot}
        onClose={() => setShowAddLot(false)}
        onAdd={(lot) => update(prev => ({ ...prev, cacaoLots: [...prev.cacaoLots, lot] }))}
      />
      <AddHarvestModal
        open={showAddHarvest}
        onClose={() => setShowAddHarvest(false)}
        lots={data.cacaoLots}
        onAdd={(harvest) => update(prev => ({ ...prev, cacaoHarvests: [harvest, ...prev.cacaoHarvests] }))}
      />
    </div>
  );
}

function LotsTab({ data, update, totalArea, onAdd }: {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  totalArea: number;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Alert type="info" title="Registro de lotes">
        Registra cada lote de cacao con su área y número de árboles. Luego podrás vincular las cosechas a cada lote.
      </Alert>

      <div className="flex items-center justify-between">
        <h3 className="section-title">Mis Lotes <span className="text-sm font-normal text-earth-500">({totalArea} ha)</span></h3>
        <button onClick={onAdd} className="btn-primary text-sm py-2">
          <Plus className="h-4 w-4" /> Agregar Lote
        </button>
      </div>

      {data.cacaoLots.length === 0 ? (
        <EmptyState
          icon={<Map className="h-8 w-8" />}
          title="Sin lotes registrados"
          description="Registra tus lotes de cacao para llevar el control de sus árboles y cosechas."
          action={<button onClick={onAdd} className="btn-primary"><Plus className="h-4 w-4" /> Agregar Lote</button>}
        />
      ) : (
        <div className="space-y-3">
          {data.cacaoLots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              harvests={data.cacaoHarvests.filter(h => h.lotId === lot.id)}
              onDelete={() => update(prev => ({
                ...prev,
                cacaoLots: prev.cacaoLots.filter(l => l.id !== lot.id),
                cacaoHarvests: prev.cacaoHarvests.filter(h => h.lotId !== lot.id),
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LotCard({ lot, harvests, onDelete }: { lot: CacaoLot; harvests: CacaoHarvest[]; onDelete: () => void }) {
  const dryKg = harvests.reduce((sum, h) => sum + h.dryKg, 0);
  return (
    <div className="card p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-earth-900">{lot.name}</h4>
          <p className="text-xs text-earth-500 mt-0.5">
            {lot.area} ha · {lot.trees} árboles{lot.variety ? ` · ${lot.variety}` : ''}{lot.plantingYear ? ` · Sembrado en ${lot.plantingYear}` : ''}
          </p>
        </div>
        <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 transition-colors" aria-label="Eliminar lote">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-earth-500">
        <span>{harvests.length} cosechas registradas</span>
        <span className="font-semibold text-earth-700">{dryKg} kg secos acumulados</span>
      </div>
      {lot.notes && <p className="mt-2 text-xs text-earth-600">{lot.notes}</p>}
    </div>
  );
}

function AddLotModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (lot: CacaoLot) => void;
}) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [trees, setTrees] = useState('');
  const [variety, setVariety] = useState('');
  const [plantingYear, setPlantingYear] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const year = parseInt(plantingYear, 10);
    onAdd({
      id: uid(),
      name: name.trim(),
      area: parseFloat(area) || 0,
      trees: parseInt(trees, 10) || 0,
      variety: variety.trim(),
      plantingYear: Number.isFinite(year) ? year : null,
      notes: notes.trim(),
    });
    setName('');
    setArea('');
    setTrees('');
    setVariety('');
    setPlantingYear('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar Lote de Cacao">
      <div className="space-y-4">
        <div>
          <label className="label">Nombre del lote</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Lote Río Verde" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área (hectáreas)</label>
            <input type="number" step="0.1" min="0" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: 1.5" className="input" />
          </div>
          <div>
            <label className="label">Número de árboles</label>
            <input type="number" min="0" value={trees} onChange={(e) => setTrees(e.target.value)} placeholder="Ej: 900" className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Variedad</label>
            <input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="Ej: CCN-51" className="input" />
          </div>
          <div>
            <label className="label">Año de siembra</label>
            <input type="number" min="1900" max="2100" value={plantingYear} onChange={(e) => setPlantingYear(e.target.value)} placeholder="Ej: 2019" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
        </div>
        <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary w-full disabled:opacity-50">
          <Check className="h-4 w-4" /> Guardar Lote
        </button>
      </div>
    </Modal>
  );
}

function HarvestsTab({ data, update, onAdd }: {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  onAdd: () => void;
}) {
  const lotName = (lotId: string) => data.cacaoLots.find(l => l.id === lotId)?.name ?? 'Lote eliminado';
  const sorted = [...data.cacaoHarvests].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Registro de Cosechas</h3>
        <button onClick={onAdd} disabled={data.cacaoLots.length === 0} className="btn-primary text-sm py-2 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Registrar Cosecha
        </button>
      </div>

      {data.cacaoLots.length === 0 && (
        <Alert type="info">Primero registra un lote en la pestaña Lotes para poder anotar cosechas.</Alert>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Wheat className="h-8 w-8" />}
          title="Sin cosechas registradas"
          description="Anota la fecha, las mazorcas recolectadas y los kilos de cacao en baba y seco de cada corte."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((harvest) => (
            <div key={harvest.id} className="card p-4 animate-slide-up">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-earth-900">{lotName(harvest.lotId)}</h4>
                  <p className="text-xs text-earth-500 mt-0.5">{formatDate(harvest.date)} · {harvest.pods} mazorcas</p>
                </div>
                <button
                  onClick={() => update(prev => ({ ...prev, cacaoHarvests: prev.cacaoHarvests.filter(h => h.id !== harvest.id) }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 transition-colors"
                  aria-label="Eliminar cosecha"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-earth-50 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-earth-500">Cacao en baba</p>
                  <p className="text-sm font-bold text-earth-800">{harvest.wetKg} kg</p>
                </div>
                <div className="rounded-xl bg-earth-50 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-earth-500">Cacao seco</p>
                  <p className="text-sm font-bold text-earth-800">{harvest.dryKg} kg</p>
                </div>
              </div>
              {harvest.notes && <p className="mt-2 text-xs text-earth-600">{harvest.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddHarvestModal({ open, onClose, lots, onAdd }: {
  open: boolean;
  onClose: () => void;
  lots: CacaoLot[];
  onAdd: (harvest: CacaoHarvest) => void;
}) {
  const [lotId, setLotId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [pods, setPods] = useState('');
  const [wetKg, setWetKg] = useState('');
  const [dryKg, setDryKg] = useState('');
  const [notes, setNotes] = useState('');

  const selectedLotId = lotId || lots[0]?.id || '';
  const canSave = Boolean(selectedLotId) && Boolean(date);

  const handleAdd = () => {
    if (!canSave) return;
    onAdd({
      id: uid(),
      lotId: selectedLotId,
      date,
      pods: parseInt(pods, 10) || 0,
      wetKg: parseFloat(wetKg) || 0,
      dryKg: parseFloat(dryKg) || 0,
      notes: notes.trim(),
    });
    setLotId('');
    setDate(todayISO());
    setPods('');
    setWetKg('');
    setDryKg('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar Cosecha">
      <div className="space-y-4">
        <div>
          <label className="label">Lote</label>
          <select value={selectedLotId} onChange={(e) => setLotId(e.target.value)} className="input">
            {lots.map(lot => <option key={lot.id} value={lot.id}>{lot.name} ({lot.area} ha)</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fecha de cosecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Mazorcas</label>
            <input type="number" min="0" value={pods} onChange={(e) => setPods(e.target.value)} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Baba (kg)</label>
            <input type="number" step="0.1" min="0" value={wetKg} onChange={(e) => setWetKg(e.target.value)} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Seco (kg)</label>
            <input type="number" step="0.1" min="0" value={dryKg} onChange={(e) => setDryKg(e.target.value)} placeholder="0" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
        </div>
        <button onClick={handleAdd} disabled={!canSave} className="btn-primary w-full disabled:opacity-50">
          <Check className="h-4 w-4" /> Guardar Cosecha
        </button>
      </div>
    </Modal>
  );
}
