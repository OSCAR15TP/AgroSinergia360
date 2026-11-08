import { useMemo, useState } from 'react';
import { Bug, Check, ClipboardList, Leaf, Plus, Scale, Sprout, Trash2 } from 'lucide-react';
import type { AppData, CacaoDiagnosis, CacaoManagementRecord, CoffeeHarvest, RiceHarvest } from '@/types';
import { EmptyState } from '@/components/UI';
import { Modal } from '@/components/Modal';
import { uid, todayISO } from '@/hooks/useAppData';

interface CropRecordsPanelProps {
  crop: 'cafe' | 'arroz' | 'cacao';
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

type RecordSection = 'harvest' | 'diagnosis' | 'management';

export function CropRecordsPanel({ crop, data, update }: CropRecordsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [section, setSection] = useState<'harvest' | 'diagnosis' | 'management'>(crop === 'cacao' ? 'diagnosis' : 'harvest');

  const title = crop === 'cafe' ? 'Cosecha y rendimiento del café' : crop === 'arroz' ? 'Cosecha y rendimiento del arroz' : 'Diagnóstico y manejo del cacao';
  const records = crop === 'cafe' ? data.coffeeHarvests : crop === 'arroz' ? data.riceHarvests : data.cacaoDiagnoses;

  const total = useMemo(() => {
    if (crop === 'cafe') return data.coffeeHarvests.reduce((sum, item) => sum + item.totalKg, 0);
    if (crop === 'arroz') return data.riceHarvests.reduce((sum, item) => sum + item.productionKg, 0);
    return data.cacaoManagement.length;
  }, [crop, data]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-grove-600" />
              <h3 className="text-sm font-bold text-earth-900 dark:text-earth-100">{title}</h3>
            </div>
            <p className="mt-1 text-xs text-earth-500">Registra resultados por lote para comparar productividad y tomar mejores decisiones.</p>
          </div>
          <div className="rounded-xl bg-grove-50 px-3 py-2 text-right dark:bg-grove-950/30">
            <p className="text-[10px] uppercase tracking-wide text-grove-600">{crop === 'cacao' ? 'Manejos' : 'Total registrado'}</p>
            <p className="text-lg font-bold text-grove-700">{crop === 'cacao' ? total : `${total.toFixed(1)} kg`}</p>
          </div>
        </div>
      </div>

      {crop === 'cacao' && (
        <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
          <button onClick={() => setSection('diagnosis')} className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${section === 'diagnosis' ? 'bg-white text-earth-800 shadow-sm' : 'text-earth-500'}`}><Bug className="mr-1 inline h-3.5 w-3.5" />Diagnóstico</button>
          <button onClick={() => setSection('management')} className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${section === 'management' ? 'bg-white text-earth-800 shadow-sm' : 'text-earth-500'}`}><Leaf className="mr-1 inline h-3.5 w-3.5" />Sombra y manejo</button>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm"><Plus className="h-4 w-4" />Registrar</button>
      </div>

      {crop === 'cafe' && <CoffeeHarvestList items={data.coffeeHarvests} update={update} />}
      {crop === 'arroz' && <RiceHarvestList items={data.riceHarvests} plots={data.ricePlots} update={update} />}
      {crop === 'cacao' && section === 'diagnosis' && <CacaoDiagnosisList items={data.cacaoDiagnoses} lots={data.cacaoLots} update={update} />}
      {crop === 'cacao' && section === 'management' && <CacaoManagementList items={data.cacaoManagement} lots={data.cacaoLots} update={update} />}

      <RecordFormModal crop={crop} section={section} open={showForm} onClose={() => setShowForm(false)} data={data} update={update} />
    </div>
  );
}

function CoffeeHarvestList({ items, update }: { items: CoffeeHarvest[]; update: CropRecordsPanelProps['update'] }) {
  if (items.length === 0) return <EmptyState icon={<Scale className="h-8 w-8" />} title="Sin cosechas de café" description="Registra cada corte para comparar lotes sanos y lotes con problemas." />;
  return <div className="space-y-2">{items.map((item) => <div className="card flex items-center gap-3 p-3" key={item.id}><Scale className="h-5 w-5 text-harvest-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-earth-800 dark:text-earth-100">{item.lotName} · {item.date}</p><p className="text-xs text-earth-500">{item.totalKg.toFixed(1)} kg totales · {item.ripeKg.toFixed(1)} kg maduros · Calidad {item.quality}</p></div><button onClick={() => update((prev) => ({ ...prev, coffeeHarvests: prev.coffeeHarvests.filter((record) => record.id !== item.id) }))} className="text-earth-400 hover:text-clay-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>;
}

function RiceHarvestList({ items, plots, update }: { items: RiceHarvest[]; plots: AppData['ricePlots']; update: CropRecordsPanelProps['update'] }) {
  if (items.length === 0) return <EmptyState icon={<Sprout className="h-8 w-8" />} title="Sin cosechas de arroz" description="Registra la producción por lote para comparar las rotaciones SIPAS." />;
  return <div className="space-y-2">{items.map((item) => { const plot = plots.find((record) => record.id === item.plotId); return <div className="card flex items-center gap-3 p-3" key={item.id}><Sprout className="h-5 w-5 text-sky-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-earth-800 dark:text-earth-100">{plot?.name ?? 'Lote eliminado'} · {item.date}</p><p className="text-xs text-earth-500">{item.productionKg.toFixed(1)} kg · {item.areaHarvested.toFixed(2)} ha · {item.productionKg / Math.max(item.areaHarvested, 0.01) .toFixed(1)} kg/ha · Humedad {item.grainMoisture}%</p></div><button onClick={() => update((prev) => ({ ...prev, riceHarvests: prev.riceHarvests.filter((record) => record.id !== item.id) }))} className="text-earth-400 hover:text-clay-600"><Trash2 className="h-4 w-4" /></button></div>; })}</div>;
}

function CacaoDiagnosisList({ items, lots, update }: { items: CacaoDiagnosis[]; lots: AppData['cacaoLots']; update: CropRecordsPanelProps['update'] }) {
  if (items.length === 0) return <EmptyState icon={<Bug className="h-8 w-8" />} title="Sin diagnósticos de cacao" description="Registra la presencia de monilia o escoba de bruja por lote." />;
  return <div className="space-y-2">{items.map((item) => <div className="card flex items-center gap-3 p-3" key={item.id}><Bug className={`h-5 w-5 ${item.result === 'sana' ? 'text-grove-600' : 'text-clay-600'}`} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-earth-800 dark:text-earth-100">{lots.find((lot) => lot.id === item.lotId)?.name ?? 'Lote eliminado'} · {item.date}</p><p className="text-xs text-earth-500">{item.result === 'escoba_de_bruja' ? 'Escoba de bruja' : item.result === 'monilia' ? 'Monilia' : 'Sin síntomas'} · {item.affectedPods}% de mazorcas afectadas</p></div><button onClick={() => update((prev) => ({ ...prev, cacaoDiagnoses: prev.cacaoDiagnoses.filter((record) => record.id !== item.id) }))} className="text-earth-400 hover:text-clay-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>;
}

function CacaoManagementList({ items, lots, update }: { items: CacaoManagementRecord[]; lots: AppData['cacaoLots']; update: CropRecordsPanelProps['update'] }) {
  if (items.length === 0) return <EmptyState icon={<Leaf className="h-8 w-8" />} title="Sin manejos registrados" description="Registra el porcentaje de sombra y las acciones fitosanitarias realizadas." />;
  return <div className="space-y-2">{items.map((item) => <div className="card flex items-center gap-3 p-3" key={item.id}><Leaf className="h-5 w-5 text-grove-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-earth-800 dark:text-earth-100">{lots.find((lot) => lot.id === item.lotId)?.name ?? 'Lote eliminado'} · {item.date}</p><p className="text-xs text-earth-500">Sombra {item.shadePercent}% · {item.shadeAction.replaceAll('_', ' ')} · {item.phytosanitaryAction.replaceAll('_', ' ')}</p></div><button onClick={() => update((prev) => ({ ...prev, cacaoManagement: prev.cacaoManagement.filter((record) => record.id !== item.id) }))} className="text-earth-400 hover:text-clay-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>;
}

function RecordFormModal({ crop, section, open, onClose, data, update }: { crop: CropRecordsPanelProps['crop']; section: RecordSection; open: boolean; onClose: () => void; data: AppData; update: CropRecordsPanelProps['update'] }) {
  const [lotName, setLotName] = useState('');
  const [lotId, setLotId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [third, setThird] = useState('');
  const [fourth, setFourth] = useState('');
  const [notes, setNotes] = useState('');

  const close = () => { setLotName(''); setLotId(''); setDate(todayISO()); setFirst(''); setSecond(''); setThird(''); setFourth(''); setNotes(''); onClose(); };
  const save = () => {
    if (crop === 'cafe' && lotName.trim()) {
      const record: CoffeeHarvest = { id: uid(), lotName: lotName.trim(), date, ripeKg: Number(first) || 0, totalKg: Number(second) || 0, quality: (third || 'mixta') as CoffeeHarvest['quality'], notes };
      update((prev) => ({ ...prev, coffeeHarvests: [record, ...prev.coffeeHarvests] }));
    } else if (crop === 'arroz' && lotId) {
      const record: RiceHarvest = { id: uid(), plotId: lotId, date, productionKg: Number(first) || 0, areaHarvested: Number(second) || 0, grainMoisture: Number(third) || 0, rotationPhase: data.ricePlots.find((plot) => plot.id === lotId)?.rotationPhase ?? 0, notes };
      update((prev) => ({ ...prev, riceHarvests: [record, ...prev.riceHarvests] }));
    } else if (crop === 'cacao' && lotId && section === 'diagnosis') {
      const record: CacaoDiagnosis = { id: uid(), lotId, date, result: (first || 'sana') as CacaoDiagnosis['result'], affectedPods: Number(second) || 0, notes };
      update((prev) => ({ ...prev, cacaoDiagnoses: [record, ...prev.cacaoDiagnoses] }));
    } else if (crop === 'cacao' && lotId) {
      const record: CacaoManagementRecord = { id: uid(), lotId, date, shadePercent: Number(first) || 0, shadeAction: (second || 'sin_cambio') as CacaoManagementRecord['shadeAction'], phytosanitaryAction: (third || 'ninguna') as CacaoManagementRecord['phytosanitaryAction'], notes };
      update((prev) => ({ ...prev, cacaoManagement: [record, ...prev.cacaoManagement] }));
    } else return;
    close();
  };

  return <Modal open={open} onClose={close} title={crop === 'cacao' ? section === 'diagnosis' ? 'Diagnóstico de cacao' : 'Registro de sombra y manejo' : 'Registrar cosecha'}><div className="space-y-4">
    {crop === 'cafe' ? <><Field label="Lote o sector" value={lotName} onChange={setLotName} placeholder="Ej: Lote alto" /><div className="grid grid-cols-2 gap-3"><Field label="Kg maduros" value={first} onChange={setFirst} type="number" /><Field label="Kg totales" value={second} onChange={setSecond} type="number" /></div><label className="label">Calidad<select value={third || 'mixta'} onChange={(event) => setThird(event.target.value)} className="input"><option value="selecta">Selecta</option><option value="mixta">Mixta</option><option value="baja">Baja</option></select></label></> : <><label className="label">Lote<select value={lotId} onChange={(event) => setLotId(event.target.value)} className="input"><option value="">Selecciona un lote</option>{(crop === 'arroz' ? data.ricePlots : data.cacaoLots).map((lot) => <option key={lot.id} value={lot.id}>{lot.name}</option>)}</select></label>{crop === 'arroz' ? <div className="grid grid-cols-3 gap-2"><Field label="Producción kg" value={first} onChange={setFirst} type="number" /><Field label="Área ha" value={second} onChange={setSecond} type="number" /><Field label="Humedad %" value={third} onChange={setThird} type="number" /></div> : section === 'diagnosis' ? <><label className="label">Resultado<select value={first || 'sana'} onChange={(event) => setFirst(event.target.value)} className="input"><option value="sana">Sin síntomas</option><option value="monilia">Monilia</option><option value="escoba_de_bruja">Escoba de bruja</option></select></label><Field label="Mazorcas afectadas %" value={second} onChange={setSecond} type="number" /></> : <div className="grid grid-cols-2 gap-3"><Field label="Sombra %" value={first} onChange={setFirst} type="number" /><SelectField label="Acción de sombra" value={second} onChange={setSecond} options={['sin_cambio', 'poda_sombra', 'siembra_sombra']} /><SelectField label="Manejo fitosanitario" value={third} onChange={setThird} options={['ninguna', 'poda_sanitaria', 'retiro_mazorcas', 'fungicida']} /></div>}</>}
    <Field label="Fecha" value={date} onChange={setDate} type="date" /><label className="label">Notas<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="input" rows={2} /></label><button onClick={save} className="btn-primary w-full"><Check className="h-4 w-4" />Guardar registro</button>
  </div></Modal>;
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className="label">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="input" /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="label col-span-2">{label}<select value={value || options[0]} onChange={(event) => onChange(event.target.value)} className="input">{options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>; }
