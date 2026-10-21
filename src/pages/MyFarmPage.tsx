import { useState, useRef } from 'react';
import type { AppData, FarmConfig } from '@/types';
import { Alert } from '@/components/Alert';
import { Badge } from '@/components/UI';
import { StatCard } from '@/components/StatCard';
import {
  Tractor, Check, Wifi, WifiOff, Download, Upload, Trash2, Coffee, Wheat, Beef,
  Info, MapPin, Maximize, Database, Shield, Cloud, CloudOff,
} from 'lucide-react';
import { formatDate } from '@/hooks/useAppData';
import { useI18n } from '@/lib/i18n';

interface MyFarmProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  isOnline: boolean;
  cloudSynced: boolean;
  onReset: () => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
}

export function MyFarmPage({ data, update, isOnline, cloudSynced, onReset, onExport, onImport }: MyFarmProps) {
  const { t, lang } = useI18n();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agro360-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    update(prev => ({ ...prev, farmConfig: { ...prev.farmConfig, lastBackup: new Date().toISOString() } }));
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const success = onImport(reader.result as string);
      setImportStatus(success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
  };

  const toggleModule = (key: 'coffee' | 'rice' | 'livestock') => {
    update(prev => ({
      ...prev,
      farmConfig: {
        ...prev.farmConfig,
        modules: { ...prev.farmConfig.modules, [key]: !prev.farmConfig.modules[key] },
      },
    }));
  };

  const totalRecords =
    data.coffeeDiagnoses.length + data.ricePlots.length + data.cattle.length + data.paddocks.length + data.events.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md">
          <Tractor className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">{t('farm.title')}</h1>
          <p className="text-sm text-earth-500 dark:text-earth-400">{t('farm.subtitle')}</p>
        </div>
      </div>

      {/* Cloud sync status */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isOnline ? 'bg-grove-100 text-grove-600' : 'bg-harvest-100 text-harvest-600'}`}>
            {isOnline ? <Cloud className="h-6 w-6" /> : <CloudOff className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-earth-800">
              {isOnline ? t('farm.cloud_connected') : t('farm.offline')}
            </p>
            <p className="text-xs text-earth-500">
              {isOnline && cloudSynced
                ? (lang === 'en' ? 'Your data is privately synced to the cloud.' : lang === 'pt' ? 'Seus dados estão sincronizados na nuvem de forma privada.' : 'Tus datos están sincronizados en la nube de forma privada.')
                : isOnline
                ? t('farm.syncing')
                : (lang === 'en' ? 'Data is saved locally and will sync when connection returns.' : lang === 'pt' ? 'Os dados são salvos localmente e serão sincronizados quando a conexão voltar.' : 'Los datos se guardan localmente y se sincronizarán al recuperar la conexión.')}
            </p>
          </div>
          <Badge color={isOnline && cloudSynced ? 'grove' : 'harvest'} dot>
            {isOnline && cloudSynced ? t('farm.synced') : isOnline ? t('farm.syncing_badge') : t('farm.offline_badge')}
          </Badge>
        </div>
      </div>

      {/* Farm config */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100 mb-4">{t('farm.info')}</h3>
        <div className="space-y-4">
          <div>
            <label className="label">{t('farm.name')}</label>
            <input
              value={data.farmConfig.farmName}
              onChange={(e) => update(prev => ({ ...prev, farmConfig: { ...prev.farmConfig, farmName: e.target.value } }))}
              className="input"
              placeholder={lang === 'en' ? 'E.g. Hope Farm' : lang === 'pt' ? 'Ex.: Fazenda Esperança' : 'Ej: Finca La Esperanza'}
            />
          </div>
          <div>
            <label className="label">{t('farm.location')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-400" />
              <input
                value={data.farmConfig.location}
                onChange={(e) => update(prev => ({ ...prev, farmConfig: { ...prev.farmConfig, location: e.target.value } }))}
                className="input pl-10"
                placeholder={lang === 'en' ? 'E.g. Manizales, Caldas — Colombia' : 'Ej: Manizales, Caldas — Colombia'}
              />
            </div>
          </div>
          <div>
            <label className="label">{t('farm.size')}</label>
            <div className="relative">
              <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-400" />
              <input
                type="number"
                step="0.1"
                value={data.farmConfig.size || ''}
                onChange={(e) => update(prev => ({ ...prev, farmConfig: { ...prev.farmConfig, size: parseFloat(e.target.value) || 0 } }))}
                className="input pl-10"
                placeholder="Ej: 15.5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-grove-200 bg-grove-50/60 p-5 dark:border-grove-800 dark:bg-grove-950/20">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-grove-600" />
          <div>
            <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">Conexión de IA protegida</h3>
            <p className="mt-1 text-xs leading-relaxed text-earth-600 dark:text-earth-300">La clave de Groq no se guarda en este dispositivo ni se sincroniza con tus datos. Cuando la conexión está habilitada, la aplicación la usa únicamente desde el servidor.</p>
          </div>
        </div>
      </div>

      {/* Modules toggle */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100 mb-1">{t('farm.modules')}</h3>
        <p className="text-xs text-earth-500 mb-4">{t('farm.modules_desc')}</p>
        <div className="space-y-2">
          <ModuleToggle
            icon={<Coffee className="h-5 w-5" />}
            title="Café"
            desc="Diagnóstico por IA y asistente agronómico"
            color="harvest"
            enabled={data.farmConfig.modules.coffee}
            onToggle={() => toggleModule('coffee')}
          />
          <ModuleToggle
            icon={<Wheat className="h-5 w-5" />}
            title="Arroz"
            desc="SIPAS, riego inteligente y agroclima"
            color="sky"
            enabled={data.farmConfig.modules.rice}
            onToggle={() => toggleModule('rice')}
          />
          <ModuleToggle
            icon={<Beef className="h-5 w-5" />}
            title="Ganadería"
            desc="Hato, pastoreo rotacional y compostaje"
            color="clay"
            enabled={data.farmConfig.modules.livestock}
            onToggle={() => toggleModule('livestock')}
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="section-title mb-3">{t('farm.summary')}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={<Coffee className="h-5 w-5" />} label="Diagnósticos" value={data.coffeeDiagnoses.length} color="harvest" />
          <StatCard icon={<Wheat className="h-5 w-5" />} label="Lotes Arroz" value={data.ricePlots.length} color="sky" />
          <StatCard icon={<Beef className="h-5 w-5" />} label="Animales" value={data.cattle.length} color="clay" />
          <StatCard icon={<Database className="h-5 w-5" />} label="Total Registros" value={totalRecords} color="grove" />
        </div>
      </div>

      {/* Backup */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-grove-600" />
          <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">{t('farm.backup')}</h3>
        </div>

        {data.farmConfig.lastBackup && (
          <p className="text-xs text-earth-500 mb-3">
            Última copia: {formatDate(data.farmConfig.lastBackup.slice(0, 10))}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="btn-primary">
            <Download className="h-4 w-4" /> {t('farm.export')}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary">
            <Upload className="h-4 w-4" /> {t('farm.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
        </div>

        {importStatus === 'success' && (
          <Alert type="success" title="Datos importados correctamente">
            La copia de seguridad se restauró con éxito.
          </Alert>
        )}
        {importStatus === 'error' && (
          <Alert type="danger" title="Error al importar">
            El archivo no es válido o está corrupto.
          </Alert>
        )}
      </div>

      {/* Offline info */}
      <div className="card p-4 bg-sky-50 border-sky-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-sky-900">{t('farm.private_title')}</h4>
            <p className="text-sm text-sky-800 mt-1">
              Cada usuario tiene su propio espacio privado. Nadie más puede ver tus diagnósticos, lotes, animales o configuración. Los datos se sincronizan en la nube solo con tu cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-5 border-clay-200">
        <h3 className="text-sm font-bold text-clay-800 mb-1">{t('farm.reset_zone')}</h3>
        <p className="text-xs text-earth-500 mb-3">Borra todos los datos locales. Los datos en la nube no se borran.</p>
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} className="btn text-clay-600 border border-clay-200 hover:bg-clay-50">
            <Trash2 className="h-4 w-4" /> {t('farm.delete_local')}
          </button>
        ) : (
          <div className="space-y-3">
            <Alert type="danger" title="¿Estás seguro?">
              Se borrarán los datos locales de este dispositivo. Considera exportar una copia primero.
            </Alert>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={() => { onReset(); setShowResetConfirm(false); }} className="btn bg-clay-600 text-white hover:bg-clay-700 flex-1">
                <Check className="h-4 w-4" /> Sí, Borrar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-earth-400">AgroSinergia 360 — Plataforma open-source de agricultura de precisión</p>
        <p className="text-xs text-earth-300 mt-1">Tecnologías libres · Offline-First · PWA · IA con Groq</p>
      </div>
    </div>
  );
}

function ModuleToggle({ icon, title, desc, color, enabled, onToggle }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: 'harvest' | 'sky' | 'clay';
  enabled: boolean;
  onToggle: () => void;
}) {
  const colorMap = {
    harvest: { bg: 'bg-harvest-100', text: 'text-harvest-600', active: 'bg-harvest-500' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-600', active: 'bg-sky-500' },
    clay: { bg: 'bg-clay-100', text: 'text-clay-600', active: 'bg-clay-500' },
  };
  const c = colorMap[color];
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all w-full text-left ${
        enabled ? 'border-earth-200 bg-white' : 'border-earth-100 bg-earth-50 opacity-60'
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-earth-800">{title}</p>
        <p className="text-xs text-earth-500 truncate">{desc}</p>
      </div>
      <div className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${enabled ? c.active : 'bg-earth-200'}`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}
