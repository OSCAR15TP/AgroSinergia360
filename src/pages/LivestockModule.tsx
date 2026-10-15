import { useState } from 'react';
import type { AppData, Cattle, HealthStatus, ReproductiveStatus, Paddock, VaccinationEvent } from '@/types';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { Badge, EmptyState, ProgressBar } from '@/components/UI';
import { StatCard } from '@/components/StatCard';
import {
  Beef, Plus, Trash2, Check, Syringe, Scale, Heart, Baby, Camera,
  Map, AlertTriangle, Info, Leaf, X, ChevronRight, Calendar,
  TrendingUp, CircleDot, Recycle,
} from 'lucide-react';
import { uid, formatDate, todayISO, daysUntil } from '@/hooks/useAppData';
import { ImageDiagnosisModal } from '@/components/ImageDiagnosisModal';
import { analyzeLivestockPhoto } from '@/lib/visualDiagnosis';

interface LivestockModuleProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

type Tab = 'herd' | 'paddocks' | 'compost';

const HEALTH_INFO: Record<HealthStatus, { label: string; color: 'grove' | 'harvest' | 'clay' | 'sky' }> = {
  sano: { label: 'Sano', color: 'grove' },
  en_tratamiento: { label: 'En Tratamiento', color: 'clay' },
  en_cuarentena: { label: 'En Cuarentena', color: 'clay' },
  en_observacion: { label: 'En Observación', color: 'harvest' },
};

const REPRO_INFO: Record<ReproductiveStatus, { label: string; color: 'grove' | 'harvest' | 'clay' | 'sky' }> = {
  vacia: { label: 'Vacía', color: 'harvest' },
  prenada: { label: 'Preñada', color: 'grove' },
  lactancia: { label: 'Lactancia', color: 'sky' },
  servida: { label: 'Servida', color: 'sky' },
  seca: { label: 'Seca', color: 'earth' as 'grove' },
};

export function LivestockModule({ data, update }: LivestockModuleProps) {
  const [tab, setTab] = useState<Tab>('herd');
  const [showAddCattle, setShowAddCattle] = useState(false);
  const [showAddPaddock, setShowAddPaddock] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState<string | null>(null);
  const [showImageDiagnosis, setShowImageDiagnosis] = useState(false);

  const healthy = data.cattle.filter(c => c.healthStatus === 'sano').length;
  const avgWeight = data.cattle.length > 0
    ? Math.round(data.cattle.reduce((s, c) => s + c.weight, 0) / data.cattle.length)
    : 0;
  const inProduction = data.paddocks.filter(p => p.status === 'en_uso').length;
  const lowGrass = data.paddocks.filter(p => p.grassHeight < 20 && p.status === 'en_uso').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-500 text-white shadow-md">
          <Beef className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Módulo Ganadería</h1>
          <p className="text-sm text-earth-500">Trazabilidad, pastoreo rotacional y compostaje</p>
          <button onClick={() => setShowImageDiagnosis(true)} className="btn-secondary mt-2 text-xs py-1.5">
            <Camera className="h-3.5 w-3.5" /> Diagnóstico por imagen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Beef className="h-5 w-5" />} label="Animales" value={data.cattle.length} color="clay" />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Sanos" value={healthy} color="grove" />
        <StatCard icon={<Scale className="h-5 w-5" />} label="Peso Prom." value={`${avgWeight}kg`} color="harvest" />
        <StatCard icon={<Map className="h-5 w-5" />} label="Potreros" value={data.paddocks.length} color="sky" />
      </div>

      {lowGrass > 0 && (
        <Alert type="warning" title="Pastoreo en riesgo">
          {lowGrass} potrero(s) en uso tienen pasto por debajo del remanente de seguridad (15-20 cm). Retira los animales para evitar sobrepastoreo y compactación del suelo.
        </Alert>
      )}

      <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
        <TabButton active={tab === 'herd'} onClick={() => setTab('herd')} icon={<Beef className="h-4 w-4" />}>Hato</TabButton>
        <TabButton active={tab === 'paddocks'} onClick={() => setTab('paddocks')} icon={<Map className="h-4 w-4" />}>Potreros</TabButton>
        <TabButton active={tab === 'compost'} onClick={() => setTab('compost')} icon={<Recycle className="h-4 w-4" />}>Compost</TabButton>
      </div>

      {tab === 'herd' && (
        <HerdTab
          data={data}
          update={update}
          showAddCattle={showAddCattle}
          setShowAddCattle={setShowAddCattle}
          selectedCattle={selectedCattle}
          setSelectedCattle={setSelectedCattle}
        />
      )}
      {tab === 'paddocks' && (
        <PaddocksTab data={data} update={update} showAddPaddock={showAddPaddock} setShowAddPaddock={setShowAddPaddock} />
      )}
      {tab === 'compost' && <CompostTab data={data} />}

      <ImageDiagnosisModal
        open={showImageDiagnosis}
        onClose={() => setShowImageDiagnosis(false)}
        title="Diagnóstico visual del ganado"
        description="Sube una imagen del animal para obtener una orientación inicial sobre condición corporal y posibles signos de salud."
        accent="clay"
        analyze={analyzeLivestockPhoto}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
        active ? 'bg-white text-clay-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function HerdTab({ data, update, showAddCattle, setShowAddCattle, selectedCattle, setSelectedCattle }: {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  showAddCattle: boolean;
  setShowAddCattle: (v: boolean) => void;
  selectedCattle: string | null;
  setSelectedCattle: (v: string | null) => void;
}) {
  const selected = data.cattle.find(c => c.id === selectedCattle);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Bitácora del Hato</h3>
        <button onClick={() => setShowAddCattle(true)} className="btn-clay text-sm py-2">
          <Plus className="h-4 w-4" /> Agregar Animal
        </button>
      </div>

      {data.cattle.length === 0 ? (
        <EmptyState
          icon={<Beef className="h-8 w-8" />}
          title="Sin animales registrados"
          description="Registra cada animal con su identificación, raza, peso y estado de salud para llevar la bitácora completa del hato."
          action={<button onClick={() => setShowAddCattle(true)} className="btn-clay"><Plus className="h-4 w-4" /> Agregar Animal</button>}
        />
      ) : (
        <div className="space-y-2">
          {data.cattle.map((c) => (
            <CattleCard key={c.id} cattle={c} onClick={() => setSelectedCattle(c.id)} onDelete={() => update(prev => ({ ...prev, cattle: prev.cattle.filter(x => x.id !== c.id) }))} />
          ))}
        </div>
      )}

      <AddCattleModal
        open={showAddCattle}
        onClose={() => setShowAddCattle(false)}
        onAdd={(cattle) => update(prev => ({ ...prev, cattle: [...prev.cattle, cattle] }))}
      />

      {selected && (
        <CattleDetailModal
          cattle={selected}
          onClose={() => setSelectedCattle(null)}
          onUpdate={(updated) => update(prev => ({
            ...prev,
            cattle: prev.cattle.map(c => c.id === selected.id ? updated : c),
          }))}
        />
      )}
    </div>
  );
}

function CattleCard({ cattle, onClick, onDelete }: { cattle: Cattle; onClick: () => void; onDelete: () => void }) {
  const health = HEALTH_INFO[cattle.healthStatus];
  const repro = REPRO_INFO[cattle.reproductiveStatus];
  return (
    <div className="card card-hover p-3 flex items-center gap-3">
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-clay-100 text-clay-600">
          <Beef className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-earth-900">#{cattle.tagNumber}</span>
            <Badge color={health.color} dot>{health.label}</Badge>
          </div>
          <p className="text-xs text-earth-500">{cattle.breed} — {cattle.weight} kg</p>
          <div className="mt-1 flex gap-1.5">
            <Badge color={repro.color}>{repro.label}</Badge>
            {cattle.vaccinations.length > 0 && (
              <Badge color="sky"><Syringe className="h-3 w-3" /> {cattle.vaccinations.length}</Badge>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-earth-300 flex-shrink-0" />
      </button>
      <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 transition-colors flex-shrink-0">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddCattleModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (cattle: Cattle) => void;
}) {
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('sano');
  const [reproductiveStatus, setReproductiveStatus] = useState<ReproductiveStatus>('vacia');

  const handleAdd = () => {
    if (!tagNumber.trim()) return;
    onAdd({
      id: uid(),
      tagNumber: tagNumber.trim(),
      breed: breed.trim() || 'No especificada',
      birthDate: birthDate || todayISO(),
      weight: parseFloat(weight) || 0,
      healthStatus,
      reproductiveStatus,
      vaccinations: [],
      weightHistory: [{ date: todayISO(), weight: parseFloat(weight) || 0 }],
      notes: '',
    });
    setTagNumber(''); setBreed(''); setBirthDate(''); setWeight('');
    setHealthStatus('sano'); setReproductiveStatus('vacia');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar Animal">
      <div className="space-y-4">
        <div>
          <label className="label">Número de identificación (arete)</label>
          <input value={tagNumber} onChange={(e) => setTagNumber(e.target.value)} placeholder="Ej: 001-A" className="input" />
        </div>
        <div>
          <label className="label">Raza</label>
          <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Ej: Brahman, Nelore, Cebú" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Estado de salud</label>
            <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value as HealthStatus)} className="input">
              <option value="sano">Sano</option>
              <option value="en_tratamiento">En Tratamiento</option>
              <option value="en_cuarentena">En Cuarentena</option>
              <option value="en_observacion">En Observación</option>
            </select>
          </div>
          <div>
            <label className="label">Estado reproductivo</label>
            <select value={reproductiveStatus} onChange={(e) => setReproductiveStatus(e.target.value as ReproductiveStatus)} className="input">
              <option value="vacia">Vacía</option>
              <option value="servida">Servida</option>
              <option value="prenada">Preñada</option>
              <option value="lactancia">Lactancia</option>
              <option value="seca">Seca</option>
            </select>
          </div>
        </div>
        <button onClick={handleAdd} className="btn-clay w-full">
          <Check className="h-4 w-4" /> Agregar Animal
        </button>
      </div>
    </Modal>
  );
}

function CattleDetailModal({ cattle, onClose, onUpdate }: {
  cattle: Cattle;
  onClose: () => void;
  onUpdate: (c: Cattle) => void;
}) {
  const [newWeight, setNewWeight] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDate, setVaccineDate] = useState(todayISO());
  const [nextDate, setNextDate] = useState('');

  const handleAddWeight = () => {
    const w = parseFloat(newWeight);
    if (!w) return;
    onUpdate({
      ...cattle,
      weight: w,
      weightHistory: [...cattle.weightHistory, { date: todayISO(), weight: w }],
    });
    setNewWeight('');
  };

  const handleAddVaccine = () => {
    if (!vaccineName.trim()) return;
    const vac: VaccinationEvent = {
      id: uid(),
      date: vaccineDate,
      vaccine: vaccineName.trim(),
      nextDate: nextDate || vaccineDate,
    };
    const updated = { ...cattle, vaccinations: [...cattle.vaccinations, vac] };
    onUpdate(updated);
    setVaccineName(''); setNextDate('');
    setVaccineDate(todayISO());
  };

  const handleDeleteVaccine = (id: string) => {
    onUpdate({ ...cattle, vaccinations: cattle.vaccinations.filter(v => v.id !== id) });
  };

  const ageYears = Math.floor((Date.now() - new Date(cattle.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <Modal open={true} onClose={onClose} title={`Animal #${cattle.tagNumber}`} size="lg">
      <div className="space-y-5">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-3">
          <DetailChip icon={<Scale className="h-4 w-4" />} label="Peso" value={`${cattle.weight} kg`} />
          <DetailChip icon={<Calendar className="h-4 w-4" />} label="Edad" value={`${ageYears} años`} />
          <DetailChip icon={<CircleDot className="h-4 w-4" />} label="Raza" value={cattle.breed} />
        </div>

        {/* Status */}
        <div className="flex gap-2">
          <Badge color={HEALTH_INFO[cattle.healthStatus].color} dot>Salud: {HEALTH_INFO[cattle.healthStatus].label}</Badge>
          <Badge color={REPRO_INFO[cattle.reproductiveStatus].color}>Repro: {REPRO_INFO[cattle.reproductiveStatus].label}</Badge>
        </div>

        {/* Weight tracking */}
        <div className="card p-4 bg-earth-50 border-earth-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-earth-600" />
            <h4 className="text-sm font-bold text-earth-800">Registrar Peso</h4>
          </div>
          <div className="flex gap-2">
            <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="Nuevo peso (kg)" className="input flex-1" />
            <button onClick={handleAddWeight} className="btn-secondary">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
          {cattle.weightHistory.length > 0 && (
            <div className="mt-3 space-y-1">
              {cattle.weightHistory.slice(-5).reverse().map((wh, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-earth-600">
                  <span>{formatDate(wh.date)}</span>
                  <span className="font-semibold">{wh.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vaccinations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Syringe className="h-4 w-4 text-sky-600" />
            <h4 className="text-sm font-bold text-earth-800">Vacunaciones</h4>
          </div>
          <div className="space-y-2">
            {cattle.vaccinations.length === 0 ? (
              <p className="text-sm text-earth-500 italic">Sin vacunaciones registradas.</p>
            ) : (
              cattle.vaccinations.map((v) => {
                const days = daysUntil(v.nextDate);
                return (
                  <div key={v.id} className="card p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-earth-800">{v.vaccine}</p>
                      <p className="text-xs text-earth-500">Aplicada: {formatDate(v.date)}</p>
                      <p className={`text-xs font-medium ${days < 0 ? 'text-clay-600' : days <= 30 ? 'text-harvest-600' : 'text-grove-600'}`}>
                        Próxima: {formatDate(v.nextDate)} {days < 0 ? '(vencida)' : days <= 30 ? `(${days}d)` : ''}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteVaccine(v.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-3 card p-3 bg-sky-50 border-sky-100 space-y-2">
            <input value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="Nombre vacuna (Ej: Aftosa)" className="input" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={vaccineDate} onChange={(e) => setVaccineDate(e.target.value)} className="input" />
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="input" placeholder="Próxima fecha" />
            </div>
            <button onClick={handleAddVaccine} className="btn-secondary w-full text-sm py-2">
              <Plus className="h-4 w-4" /> Registrar Vacunación
            </button>
          </div>
        </div>

        {/* Status updater */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Estado de salud</label>
            <select value={cattle.healthStatus} onChange={(e) => onUpdate({ ...cattle, healthStatus: e.target.value as HealthStatus })} className="input">
              <option value="sano">Sano</option>
              <option value="en_tratamiento">En Tratamiento</option>
              <option value="en_cuarentena">En Cuarentena</option>
              <option value="en_observacion">En Observación</option>
            </select>
          </div>
          <div>
            <label className="label">Estado reproductivo</label>
            <select value={cattle.reproductiveStatus} onChange={(e) => onUpdate({ ...cattle, reproductiveStatus: e.target.value as ReproductiveStatus })} className="input">
              <option value="vacia">Vacía</option>
              <option value="servida">Servida</option>
              <option value="prenada">Preñada</option>
              <option value="lactancia">Lactancia</option>
              <option value="seca">Seca</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DetailChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-earth-50 p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-earth-600">{icon}</div>
      <p className="text-xs text-earth-500">{label}</p>
      <p className="text-sm font-bold text-earth-800 truncate">{value}</p>
    </div>
  );
}

function PaddocksTab({ data, update, showAddPaddock, setShowAddPaddock }: {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  showAddPaddock: boolean;
  setShowAddPaddock: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Alert type="info" title="Pastoreo Rotacional de Precisión">
        Mantén un remanente foliar de 15-20 cm para evitar la compactación del suelo. La rotación permite recuperar pastos y aprovechar el estiércol para compostaje orgánico.
      </Alert>

      <div className="flex items-center justify-between">
        <h3 className="section-title">Potreros</h3>
        <button onClick={() => setShowAddPaddock(true)} className="btn-clay text-sm py-2">
          <Plus className="h-4 w-4" /> Agregar Potrero
        </button>
      </div>

      {data.paddocks.length === 0 ? (
        <EmptyState
          icon={<Map className="h-8 w-8" />}
          title="Sin potreros registrados"
          description="Registra tus potreros para gestionar el pastoreo rotacional y monitorear la altura del pasto."
          action={<button onClick={() => setShowAddPaddock(true)} className="btn-clay"><Plus className="h-4 w-4" /> Agregar Potrero</button>}
        />
      ) : (
        <div className="space-y-3">
          {data.paddocks.map((p) => (
            <PaddockCard
              key={p.id}
              paddock={p}
              onDelete={() => update(prev => ({ ...prev, paddocks: prev.paddocks.filter(x => x.id !== p.id) }))}
              onUpdate={(updated) => update(prev => ({ ...prev, paddocks: prev.paddocks.map(x => x.id === p.id ? updated : x) }))}
            />
          ))}
        </div>
      )}

      <AddPaddockModal
        open={showAddPaddock}
        onClose={() => setShowAddPaddock(false)}
        onAdd={(paddock) => update(prev => ({ ...prev, paddocks: [...prev.paddocks, paddock] }))}
      />
    </div>
  );
}

function PaddockCard({ paddock, onDelete, onUpdate }: {
  paddock: Paddock;
  onDelete: () => void;
  onUpdate: (p: Paddock) => void;
}) {
  const statusInfo = paddock.status === 'en_uso'
    ? { label: 'En Uso', color: 'clay' as const }
    : paddock.status === 'en_descanso'
    ? { label: 'En Descanso', color: 'harvest' as const }
    : { label: 'Listo', color: 'grove' as const };

  const grassColor = paddock.grassHeight < 15 ? 'clay' : paddock.grassHeight < 20 ? 'harvest' : 'grove';
  const isLow = paddock.grassHeight < 20 && paddock.status === 'en_uso';

  const cycle = () => {
    const next = paddock.status === 'en_uso' ? 'en_descanso' : paddock.status === 'en_descanso' ? 'listo' : 'en_uso';
    onUpdate({
      ...paddock,
      status: next,
      restDays: next === 'en_descanso' ? 0 : paddock.restDays,
    });
  };

  return (
    <div className={`card p-4 ${isLow ? 'border-clay-300' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-earth-900">{paddock.name}</h4>
            <Badge color={statusInfo.color} dot>{statusInfo.label}</Badge>
          </div>
          <p className="text-xs text-earth-500 mt-0.5">{paddock.area} ha — {paddock.cattleCount} animales</p>
        </div>
        <div className="flex gap-1">
          <button onClick={cycle} className="btn-secondary text-xs py-1.5 px-3">
            <Recycle className="h-3.5 w-3.5" /> Rotar
          </button>
          <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          value={paddock.grassHeight}
          max={40}
          label="Altura del pasto"
          unit=" cm"
          color={grassColor as 'grove' | 'harvest' | 'clay'}
        />
      </div>

      {isLow && (
        <Alert type="warning">
          <span className="text-xs">Altura por debajo del remanente de seguridad. Retira los animales para permitir la recuperación del pasto.</span>
        </Alert>
      )}

      {paddock.status === 'en_descanso' && (
        <p className="mt-2 text-xs text-harvest-600 font-medium">En descanso — el pasto se está recuperando</p>
      )}
    </div>
  );
}

function AddPaddockModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Paddock) => void;
}) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [grassHeight, setGrassHeight] = useState('25');
  const [cattleCount, setCattleCount] = useState('0');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: uid(),
      name: name.trim(),
      area: parseFloat(area) || 0,
      grassHeight: parseFloat(grassHeight) || 0,
      cattleCount: parseInt(cattleCount) || 0,
      restDays: 0,
      status: 'en_uso',
    });
    setName(''); setArea(''); setGrassHeight('25'); setCattleCount('0');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar Potrero">
      <div className="space-y-4">
        <div>
          <label className="label">Nombre del potrero</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Potrero A" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área (ha)</label>
            <input type="number" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">N° animales</label>
            <input type="number" value={cattleCount} onChange={(e) => setCattleCount(e.target.value)} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Altura del pasto (cm)</label>
          <input type="number" step="0.5" value={grassHeight} onChange={(e) => setGrassHeight(e.target.value)} className="input" />
          <p className="mt-1 text-xs text-earth-400">Remanente de seguridad: 15-20 cm</p>
        </div>
        <button onClick={handleAdd} className="btn-clay w-full">
          <Check className="h-4 w-4" /> Agregar Potrero
        </button>
      </div>
    </Modal>
  );
}

function CompostTab({ data }: { data: AppData }) {
  const cattleCount = data.cattle.length;
  // Approx: a cow produces ~25kg manure/day
  const dailyManure = cattleCount * 25;
  const monthlyCompost = Math.round(dailyManure * 30 * 0.5); // 50% composting efficiency
  const nitrogen = Math.round(monthlyCompost * 0.006 * 10) / 10;
  const phosphorus = Math.round(monthlyCompost * 0.002 * 10) / 10;
  const potassium = Math.round(monthlyCompost * 0.003 * 10) / 10;

  return (
    <div className="space-y-4 animate-fade-in">
      <Alert type="info" title="Economía Circular">
        El estiércol del hato se convierte en compost orgánico para fertilizar lotes de arroz y café, reduciendo la dependencia de agroquímicos sintéticos.
      </Alert>

      {cattleCount === 0 ? (
        <EmptyState
          icon={<Recycle className="h-8 w-8" />}
          title="Sin datos de compostaje"
          description="Registra animales en el hato para calcular la producción de estiércol y compost orgánico disponible."
        />
      ) : (
        <>
          <div className="card p-5 bg-gradient-to-br from-grove-50 to-white border-grove-200">
            <div className="flex items-center gap-2 mb-3">
              <Recycle className="h-5 w-5 text-grove-600" />
              <h3 className="text-sm font-bold text-earth-800">Producción de Compost</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 border border-earth-100">
                <p className="text-xs text-earth-500 font-medium">Estiércol diario</p>
                <p className="text-2xl font-bold text-earth-800">{dailyManure}<span className="text-sm font-normal text-earth-500 ml-1">kg/d</span></p>
              </div>
              <div className="rounded-xl bg-white p-4 border border-grove-200">
                <p className="text-xs text-grove-600 font-medium">Compost mensual</p>
                <p className="text-2xl font-bold text-grove-700">{monthlyCompost}<span className="text-sm font-normal text-grove-500 ml-1">kg/mes</span></p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="section-title mb-2">Aporte Nutricional del Compost</h3>
            <div className="grid grid-cols-3 gap-3">
              <NutrientCard label="Nitrógeno" value={`${nitrogen} kg`} color="text-grove-700" bg="bg-grove-100" />
              <NutrientCard label="Fósforo" value={`${phosphorus} kg`} color="text-harvest-700" bg="bg-harvest-100" />
              <NutrientCard label="Potasio" value={`${potassium} kg`} color="text-clay-700" bg="bg-clay-100" />
            </div>
          </div>

          <div className="card p-4 bg-grove-50 border-grove-200">
            <div className="flex items-start gap-3">
              <Leaf className="h-5 w-5 text-grove-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-grove-900">Recomendación de Uso</h4>
                <p className="text-sm text-grove-800 mt-1">
                  Aplica aproximadamente 2-3 toneladas de compost por hectárea en lotes de arroz antes de la siembra, y 1-2 toneladas en lotes de café alrededor de la base de las plantas. Esto reduce la necesidad de fertilizantes sintéticos y mejora la materia orgánica del suelo.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NutrientCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl ${bg} p-3 text-center`}>
      <p className="text-xs text-earth-600 font-medium">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-earth-400">por mes</p>
    </div>
  );
}
