import { useRef, useState } from 'react';
import { Camera, Check, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { Modal } from '@/components/Modal';

export interface VisualDiagnosisResult {
  label: string;
  confidence: number;
  summary: string;
  recommendations: string[];
  severity: 'success' | 'warning' | 'danger';
}

interface ImageDiagnosisModalProps {
  open: boolean;
  title: string;
  description: string;
  accent: 'sky' | 'clay';
  analyze: (photoDataUrl: string) => Promise<VisualDiagnosisResult>;
  onClose: () => void;
}

export function ImageDiagnosisModal({ open, title, description, accent, analyze, onClose }: ImageDiagnosisModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<VisualDiagnosisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setAnalyzing(false);
    onClose();
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(typeof reader.result === 'string' ? reader.result : null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!photo || analyzing) return;
    setAnalyzing(true);
    setResult(await analyze(photo));
    setAnalyzing(false);
  };

  const accentClasses = accent === 'sky'
    ? { button: 'btn-primary', border: 'border-sky-200', background: 'bg-sky-50', text: 'text-sky-700' }
    : { button: 'btn-clay', border: 'border-clay-200', background: 'bg-clay-50', text: 'text-clay-700' };

  return (
    <Modal open={open} onClose={reset} title={title} size="md">
      <div className="space-y-4">
        <p className="text-sm text-earth-500">{description}</p>
        {!photo ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed ${accentClasses.border} ${accentClasses.background} p-8 text-center transition-colors hover:brightness-95`}
          >
            <Camera className={`mx-auto h-10 w-10 ${accentClasses.text} mb-3`} />
            <span className="block text-sm font-semibold text-earth-700">Sube una fotografía para analizarla</span>
            <span className="mt-1 block text-xs text-earth-500">Usa una imagen clara y bien iluminada</span>
          </button>
        ) : (
          <div className="space-y-3">
            <img src={photo} alt="Imagen seleccionada para diagnóstico" className="mx-auto max-h-56 w-full rounded-2xl object-contain bg-earth-50" />
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary flex-1">
                <Upload className="h-4 w-4" /> Cambiar imagen
              </button>
              <button type="button" onClick={handleAnalyze} disabled={analyzing} className={`${accentClasses.button} flex-1`}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {analyzing ? 'Analizando...' : 'Analizar imagen'}
              </button>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} />

        {result && (
          <div className={`rounded-2xl border p-4 ${result.severity === 'danger' ? 'border-clay-200 bg-clay-50' : result.severity === 'warning' ? 'border-harvest-200 bg-harvest-50' : 'border-grove-200 bg-grove-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Resultado estimado</p>
                <h3 className="mt-1 text-lg font-bold text-earth-900">{result.label}</h3>
              </div>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-earth-700">{Math.round(result.confidence * 100)}%</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-earth-700">{result.summary}</p>
            <div className="mt-3 space-y-2">
              {result.recommendations.map((recommendation) => (
                <p key={recommendation} className="flex gap-2 text-sm text-earth-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-grove-600" />
                  <span>{recommendation}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
