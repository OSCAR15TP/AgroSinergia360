import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, MessageCircle, RotateCcw, Upload, X } from 'lucide-react';
import type { AppData } from '@/types';
import type { AiArea } from '@/lib/agronomistAI';
import { getAIImageResponse } from '@/lib/aiService';
import type { LocalGuide } from '@/lib/localGuides';

interface AgroImageAnalyzerProps {
  area: AiArea;
  data: AppData;
  guide: LocalGuide | null;
  disabled?: boolean;
  onAnalysis: (result: { text: string; source: 'groq' | 'local'; sources: string[] }) => void;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function AgroImageAnalyzer({ area, data, guide, disabled = false, onAnalysis }: AgroImageAnalyzerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      setError('Elige una fotografía JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('La fotografía debe pesar menos de 8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => setError('No se pudo leer la fotografía. Intenta con otra imagen.');
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image || analyzing || disabled) return;
    setError('');
    setAnalyzing(true);
    try {
      const result = await getAIImageResponse(description.trim(), image, data, area, guide);
      onAnalysis(result);
      setImage(null);
      setDescription('');
    } catch {
      setError('No se pudo analizar la fotografía. Puedes conservarla y reintentar cuando haya conexión.');
    } finally {
      setAnalyzing(false);
    }
  };

  return <section className="rounded-3xl border border-earth-200 bg-white p-4 shadow-sm dark:border-earth-700 dark:bg-earth-800/70 md:p-5">
    <div className="mb-4 flex items-start gap-3"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-grove-100 text-grove-700"><Camera className="h-5 w-5" /></div><div><h2 className="font-bold text-earth-900 dark:text-earth-100">Consultar con una fotografía</h2><p className="mt-1 text-sm text-earth-500 dark:text-earth-400">La imagen ayuda a describir señales visibles, pero no confirma por sí sola una enfermedad.</p></div></div>
    {!image ? <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => cameraRef.current?.click()} className="flex items-center justify-center gap-2 rounded-2xl border border-grove-200 bg-grove-50 px-4 py-3 text-sm font-semibold text-grove-800 transition-colors hover:bg-grove-100 dark:border-grove-800 dark:bg-grove-950/30 dark:text-grove-200"><Camera className="h-4 w-4" />Tomar una fotografía</button><button type="button" onClick={() => uploadRef.current?.click()} className="flex items-center justify-center gap-2 rounded-2xl border border-earth-200 bg-earth-50 px-4 py-3 text-sm font-semibold text-earth-700 transition-colors hover:bg-earth-100 dark:border-earth-700 dark:bg-earth-700/40 dark:text-earth-200"><Upload className="h-4 w-4" />Subir una imagen</button></div> : <div className="grid gap-4 md:grid-cols-[180px_1fr]"><div className="relative"><img src={image} alt="Vista previa de la fotografía" className="h-40 w-full rounded-2xl bg-earth-50 object-cover" /><button type="button" onClick={() => setImage(null)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white" title="Quitar imagen"><X className="h-4 w-4" /></button></div><div><label className="mb-1.5 block text-xs font-semibold text-earth-600 dark:text-earth-300">¿Qué está pasando? <span className="font-normal text-earth-400">(opcional)</span></label><div className="relative"><MessageCircle className="absolute left-3 top-3 h-4 w-4 text-earth-400" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej.: Estas manchas aparecieron hace tres días..." rows={3} className="input resize-none pl-9" /></div><div className="mt-2 flex gap-2"><button type="button" onClick={() => setImage(null)} className="btn-secondary flex-1 text-sm"><RotateCcw className="h-4 w-4" />Cambiar</button><button type="button" onClick={() => void analyze()} disabled={analyzing || disabled} className="btn-primary flex-1 text-sm">{analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}{analyzing ? 'Analizando...' : 'Analizar fotografía'}</button></div></div></div>}
    <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
    <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
    {error && <p className="mt-3 rounded-xl bg-clay-50 px-3 py-2 text-xs text-clay-800">{error}</p>}
    <p className="mt-3 text-[11px] leading-relaxed text-earth-400">La fotografía se envía solo para esta consulta cuando hay conexión. No se guarda automáticamente.</p>
  </section>;
}
