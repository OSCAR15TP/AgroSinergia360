import { useState, useRef } from 'react';
import type { AppData, CoffeeDiagnosis, DiagnosisResult, SoilParams } from '@/types';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { Badge, EmptyState, ProgressBar } from '@/components/UI';
import { StatCard } from '@/components/StatCard';
import {
  Camera, Coffee, Image as ImageIcon, Plus, Trash2, Check, Scissors,
  Sprout, Bug, Eye, Info, History, FlaskConical, Leaf, ClipboardList, X, Upload,
} from 'lucide-react';
import { DIAGNOSIS_INFO, RECOMMENDATION_INFO, generateRecommendation, analyzePhoto } from '@/lib/coffeeEngine';
import { uid, formatDate, todayISO } from '@/hooks/useAppData';

interface CoffeeModuleProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

type Tab = 'diagnostic' | 'history' | 'guide';

export function CoffeeModule({ data, update }: CoffeeModuleProps) {
  const [tab, setTab] = useState<Tab>('diagnostic');
  const [showNewDiagnosis, setShowNewDiagnosis] = useState(false);
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [soilParams, setSoilParams] = useState<SoilParams>({ ph: 5.5, phosphorus: 15, potassium: 0.4, organicMatter: 3.5 });

  const healthy = data.coffeeDiagnoses.filter(d => d.result === 'sana').length;
  const issues = data.coffeeDiagnoses.length - healthy;
  const lastDiagnosis = data.coffeeDiagnoses[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-harvest-500 text-white shadow-md">
          <Coffee className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Módulo Café</h1>
          <p className="text-sm text-earth-500">Diagnóstico por IA y asistente agronómico</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Diagnósticos" value={data.coffeeDiagnoses.length} color="harvest" />
        <StatCard icon={<Leaf className="h-5 w-5" />} label="Plantas Sanas" value={healthy} color="grove" />
        <StatCard icon={<Bug className="h-5 w-5" />} label="Con Problemas" value={issues} color="clay" />
        <StatCard icon={<FlaskConical className="h-5 w-5" />} label="pH del Suelo" value={soilParams.ph.toFixed(1)} color="sky" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
        <TabButton active={tab === 'diagnostic'} onClick={() => setTab('diagnostic')} icon={<Camera className="h-4 w-4" />}>Diagnosticar</TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="h-4 w-4" />}>Historial</TabButton>
        <TabButton active={tab === 'guide'} onClick={() => setTab('guide')} icon={<Info className="h-4 w-4" />}>Guía</TabButton>
      </div>

      {/* Tab content */}
      {tab === 'diagnostic' && (
        <DiagnosticTab
          showNewDiagnosis={showNewDiagnosis}
          setShowNewDiagnosis={setShowNewDiagnosis}
          showSoilModal={showSoilModal}
          setShowSoilModal={setShowSoilModal}
          soilParams={soilParams}
          setSoilParams={setSoilParams}
          data={data}
          update={update}
          lastDiagnosis={lastDiagnosis}
        />
      )}

      {tab === 'history' && <HistoryTab diagnoses={data.coffeeDiagnoses} onDelete={(id) => update(prev => ({ ...prev, coffeeDiagnoses: prev.coffeeDiagnoses.filter(d => d.id !== id) }))} />}

      {tab === 'guide' && <GuideTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
        active ? 'bg-white text-harvest-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function DiagnosticTab({
  showNewDiagnosis, setShowNewDiagnosis, showSoilModal, setShowSoilModal,
  soilParams, setSoilParams, data, update, lastDiagnosis,
}: {
  showNewDiagnosis: boolean;
  setShowNewDiagnosis: (v: boolean) => void;
  showSoilModal: boolean;
  setShowSoilModal: (v: boolean) => void;
  soilParams: SoilParams;
  setSoilParams: (v: SoilParams) => void;
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  lastDiagnosis?: CoffeeDiagnosis;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Soil params summary */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-sky-600" />
            <h3 className="text-sm font-bold text-earth-800">Parámetros del Suelo</h3>
          </div>
          <button onClick={() => setShowSoilModal(true)} className="btn-secondary text-xs py-1.5 px-3">
            Editar
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SoilIndicator label="pH" value={soilParams.ph} unit="" optimal="5.0–6.5" good={soilParams.ph >= 5.0 && soilParams.ph <= 6.5} />
          <SoilIndicator label="Fósforo (P)" value={soilParams.phosphorus} unit="ppm" optimal=">15 ppm" good={soilParams.phosphorus >= 15} />
          <SoilIndicator label="Potasio (K)" value={soilParams.potassium} unit="cmol" optimal=">0.3 cmol" good={soilParams.potassium >= 0.3} />
          <SoilIndicator label="M. Orgánica" value={soilParams.organicMatter} unit="%" optimal=">3%" good={soilParams.organicMatter >= 3} />
        </div>
      </div>

      {/* CTA */}
      <div className="card p-6 text-center bg-gradient-to-br from-harvest-50 to-white border-harvest-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-harvest-500 text-white shadow-lg">
          <Camera className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-earth-900">Diagnóstico de Hoja de Café</h3>
        <p className="mt-1 text-sm text-earth-500 max-w-md mx-auto">
          Toma o sube una foto de la hoja. El sistema analiza signos visuales de plagas y enfermedades y recomienda acciones.
        </p>
        <button onClick={() => setShowNewDiagnosis(true)} className="btn-harvest mt-4">
          <Plus className="h-4 w-4" /> Nuevo Diagnóstico
        </button>
      </div>

      {/* Last result */}
      {lastDiagnosis && (
        <div>
          <h3 className="section-title mb-2">Último Resultado</h3>
          <DiagnosisCard diagnosis={lastDiagnosis} />
        </div>
      )}

      <NewDiagnosisModal
        open={showNewDiagnosis}
        onClose={() => setShowNewDiagnosis(false)}
        soilParams={soilParams}
        onSave={(diag) => update(prev => ({
          ...prev,
          coffeeDiagnoses: [diag, ...prev.coffeeDiagnoses],
          events: [{
            id: uid(),
            date: diag.date,
            type: 'diagnostico' as const,
            title: `Diagnóstico: ${DIAGNOSIS_INFO[diag.result].label}`,
            description: `Confianza: ${Math.round(diag.confidence * 100)}%`,
            module: 'coffee' as const,
            done: true,
          }, ...prev.events],
        }))}
      />

      <SoilParamsModal
        open={showSoilModal}
        onClose={() => setShowSoilModal(false)}
        params={soilParams}
        onSave={setSoilParams}
      />
    </div>
  );
}

function SoilIndicator({ label, value, unit, optimal, good }: { label: string; value: number; unit: string; optimal: string; good: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${good ? 'bg-grove-50 border-grove-200' : 'bg-clay-50 border-clay-200'}`}>
      <p className="text-xs font-medium text-earth-500">{label}</p>
      <p className={`text-lg font-bold ${good ? 'text-grove-700' : 'text-clay-700'}`}>
        {value}<span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-earth-400">Óptimo: {optimal}</p>
    </div>
  );
}

function DiagnosisCard({ diagnosis }: { diagnosis: CoffeeDiagnosis }) {
  const info = DIAGNOSIS_INFO[diagnosis.result];
  const recInfo = RECOMMENDATION_INFO[diagnosis.recommendationType];
  const sevColor = info.severity === 'success' ? 'grove' : info.severity === 'warning' ? 'harvest' : 'clay';
  return (
    <div className="card overflow-hidden animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 ${info.bgColor} ${info.color} border-b border-current/10`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${info.bgColor} ring-1 ring-current/20`}>
          <Leaf className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold">{info.label}</h4>
            <Badge color={sevColor as 'grove' | 'harvest' | 'clay'} dot>
              {Math.round(diagnosis.confidence * 100)}% confianza
            </Badge>
          </div>
          <p className="text-xs opacity-80">{formatDate(diagnosis.date)}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1">Descripción</p>
          <p className="text-sm text-earth-700">{info.description}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1">Síntomas</p>
          <p className="text-sm text-earth-600 italic">{info.symptoms}</p>
        </div>
        <div className={`rounded-xl p-3 bg-${recInfo.color}-50 border border-${recInfo.color}-200`}>
          <p className={`text-xs font-bold uppercase tracking-wide text-${recInfo.color}-700 mb-1`}>Recomendación: {recInfo.label}</p>
          <p className="text-sm text-earth-700 whitespace-pre-line">{diagnosis.recommendation}</p>
        </div>
        {diagnosis.notes && (
          <div className="text-sm text-earth-500 italic border-l-2 border-earth-200 pl-3">{diagnosis.notes}</div>
        )}
      </div>
    </div>
  );
}

function NewDiagnosisModal({ open, onClose, soilParams, onSave }: {
  open: boolean;
  onClose: () => void;
  soilParams: SoilParams;
  onSave: (diag: CoffeeDiagnosis) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ result: DiagnosisResult; confidence: number } | null>(null);
  const [notes, setNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!photo) return;
    setAnalyzing(true);
    const res = await analyzePhoto(photo);
    setResult(res);
    setAnalyzing(false);
  };

  const handleSave = () => {
    if (!result) return;
    const rec = generateRecommendation(result.result, soilParams);
    const diag: CoffeeDiagnosis = {
      id: uid(),
      date: todayISO(),
      result: result.result,
      confidence: result.confidence,
      photoDataUrl: photo || undefined,
      soilParams,
      recommendation: rec.text,
      recommendationType: rec.type,
      notes,
    };
    onSave(diag);
    handleClose();
  };

  const handleClose = () => {
    setPhoto(null);
    setResult(null);
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo Diagnóstico" size="lg">
      <div className="space-y-4">
        {!photo && (
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-dashed border-harvest-200 bg-harvest-50 p-8 text-center">
              <Camera className="mx-auto h-12 w-12 text-harvest-400 mb-3" />
              <p className="text-sm font-semibold text-earth-700">Toma o sube una foto de la hoja</p>
              <p className="text-xs text-earth-500 mt-1">Para mejor resultado, enfoca una sola hoja bien iluminada</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fileRef.current?.click()} className="btn-harvest">
                <Camera className="h-4 w-4" /> Tomar Foto
              </button>
              <button onClick={() => fileRef.current?.click()} className="btn-secondary">
                <Upload className="h-4 w-4" /> Subir Imagen
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {photo && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-earth-900">
              <img src={photo} alt="Hoja analizada" className="w-full h-64 object-contain" />
              <button
                onClick={() => { setPhoto(null); setResult(null); }}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!result && !analyzing && (
              <button onClick={handleAnalyze} className="btn-harvest w-full">
                <FlaskConical className="h-4 w-4" /> Analizar con IA
              </button>
            )}

            {analyzing && (
              <div className="text-center py-6">
                <div className="inline-block h-10 w-10 rounded-full border-4 border-harvest-200 border-t-harvest-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-earth-700">Analizando imagen...</p>
                <p className="text-xs text-earth-500">Identificando patrones de plagas y enfermedades</p>
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-scale-in">
                <Alert type={result.result === 'sana' ? 'success' : 'warning'} title={DIAGNOSIS_INFO[result.result].label}>
                  <p className="mt-1">{DIAGNOSIS_INFO[result.result].description}</p>
                  <p className="mt-1 text-xs font-semibold">Confianza del análisis: {Math.round(result.confidence * 100)}%</p>
                </Alert>

                <div className="rounded-xl border border-earth-200 p-4 bg-earth-50">
                  <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1">Síntomas típicos</p>
                  <p className="text-sm text-earth-700">{DIAGNOSIS_INFO[result.result].symptoms}</p>
                </div>

                <div>
                  <label className="label">Notas del agricultor (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones del lote, variedad de café, ubicación..."
                    className="input min-h-[80px] resize-y"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setPhoto(null); setResult(null); }} className="btn-secondary flex-1">
                    Descartar
                  </button>
                  <button onClick={handleSave} className="btn-primary flex-1">
                    <Check className="h-4 w-4" /> Guardar Diagnóstico
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function SoilParamsModal({ open, onClose, params, onSave }: {
  open: boolean;
  onClose: () => void;
  params: SoilParams;
  onSave: (params: SoilParams) => void;
}) {
  const [local, setLocal] = useState<SoilParams>(params);
  const handleSave = () => { onSave(local); onClose(); };

  return (
    <Modal open={open} onClose={onClose} title="Parámetros del Suelo">
      <div className="space-y-4">
        <p className="text-sm text-earth-500">Ingrese los resultados del análisis de suelo. Estos valores se usan en el motor de decisiones.</p>
        <div>
          <label className="label">pH del suelo</label>
          <input type="number" step="0.1" min="0" max="14" value={local.ph} onChange={(e) => setLocal({ ...local, ph: parseFloat(e.target.value) || 0 })} className="input" />
          <p className="mt-1 text-xs text-earth-400">Rango óptimo para café: 5.0 – 6.5</p>
        </div>
        <div>
          <label className="label">Fósforo (P) — ppm</label>
          <input type="number" step="1" min="0" value={local.phosphorus} onChange={(e) => setLocal({ ...local, phosphorus: parseFloat(e.target.value) || 0 })} className="input" />
          <p className="mt-1 text-xs text-earth-400">Adecuado: mayor a 15 ppm</p>
        </div>
        <div>
          <label className="label">Potasio (K) — cmol/kg</label>
          <input type="number" step="0.01" min="0" value={local.potassium} onChange={(e) => setLocal({ ...local, potassium: parseFloat(e.target.value) || 0 })} className="input" />
          <p className="mt-1 text-xs text-earth-400">Adecuado: mayor a 0.3 cmol/kg</p>
        </div>
        <div>
          <label className="label">Materia Orgánica — %</label>
          <input type="number" step="0.1" min="0" value={local.organicMatter} onChange={(e) => setLocal({ ...local, organicMatter: parseFloat(e.target.value) || 0 })} className="input" />
          <p className="mt-1 text-xs text-earth-400">Adecuado: mayor a 3%</p>
        </div>
        <button onClick={handleSave} className="btn-primary w-full">
          <Check className="h-4 w-4" /> Guardar Parámetros
        </button>
      </div>
    </Modal>
  );
}

function HistoryTab({ diagnoses, onDelete }: { diagnoses: CoffeeDiagnosis[]; onDelete: (id: string) => void }) {
  if (diagnoses.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="Sin diagnósticos registrados"
        description="Toma tu primera foto de una hoja de café para comenzar el monitoreo de tu plantación."
      />
    );
  }
  return (
    <div className="space-y-3 animate-fade-in">
      {diagnoses.map((d) => {
        const info = DIAGNOSIS_INFO[d.result];
        const sevColor = info.severity === 'success' ? 'grove' : info.severity === 'warning' ? 'harvest' : 'clay';
        return (
          <div key={d.id} className="card p-4">
            <div className="flex items-start gap-3">
              {d.photoDataUrl ? (
                <img src={d.photoDataUrl} alt="Hoja" className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-earth-100 flex-shrink-0">
                  <ImageIcon className="h-6 w-6 text-earth-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-earth-900">{info.label}</h4>
                  <Badge color={sevColor as 'grove' | 'harvest' | 'clay'} dot>{Math.round(d.confidence * 100)}%</Badge>
                </div>
                <p className="text-xs text-earth-500 mt-0.5">{formatDate(d.date)}</p>
                <p className="text-xs text-earth-600 mt-1 line-clamp-2">{d.recommendation}</p>
              </div>
              <button onClick={() => onDelete(d.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 transition-colors flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GuideTab() {
  const guides = Object.entries(DIAGNOSIS_INFO);
  return (
    <div className="space-y-3 animate-fade-in">
      <Alert type="info" title="Guía de Plagas y Enfermedades">
        Referencia visual para identificar problemas comunes en cultivos de café. Usa el diagnóstico por IA para confirmar.
      </Alert>
      {guides.map(([key, info]) => {
        const sevColor = info.severity === 'success' ? 'grove' : info.severity === 'warning' ? 'harvest' : 'clay';
        const icon = key === 'sana' ? <Check className="h-5 w-5" /> :
          key === 'roya' ? <Bug className="h-5 w-5" /> :
          key === 'minador' ? <Bug className="h-5 w-5" /> :
          key === 'antracnosis' ? <Scissors className="h-5 w-5" /> :
          <Eye className="h-5 w-5" />;
        return (
          <div key={key} className="card p-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${info.bgColor} ${info.color} flex-shrink-0`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-earth-900">{info.label}</h4>
                  <Badge color={sevColor as 'grove' | 'harvest' | 'clay'}>
                    {info.severity === 'success' ? 'Saludable' : info.severity === 'warning' ? 'Moderado' : 'Crítico'}
                  </Badge>
                </div>
                <p className="text-sm text-earth-600 mt-1">{info.description}</p>
                <div className="mt-2">
                  <p className="text-xs font-semibold text-earth-500">Síntomas:</p>
                  <p className="text-xs text-earth-600 mt-0.5">{info.symptoms}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
