import { BookOpenText, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocalGuideMeta {
  id: string;
  module: string;
  title: string;
  description: string;
  path: string;
  type: 'json';
}

function getGuideStorageKey() {
  return 'agro360_local_guide_context';
}

export function DocsList() {
  const [guides, setGuides] = useState<LocalGuideMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGuides = async () => {
      try {
        const response = await fetch('/docs/index.json');
        if (!response.ok) return;
        const data = await response.json();
        setGuides(data.guides ?? []);
      } catch {
        // ignore invalid JSON or unavailable docs
      }
    };

    loadGuides();
  }, []);

  const applyGuide = async (guide: LocalGuideMeta) => {
    setLoading(true);
    try {
      const response = await fetch(guide.path);
      if (!response.ok) throw new Error('No se pudo cargar la guía');
      const content = await response.json();
      const cleaned = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      const payload = JSON.stringify({
        title: guide.title,
        module: guide.module,
        content: cleaned,
      });
      window.localStorage.setItem(getGuideStorageKey(), payload);
      setSelectedId(guide.id);
    } catch {
      const fallback = JSON.stringify({ title: guide.title, module: guide.module, content: guide.description }, null, 2);
      window.localStorage.setItem(getGuideStorageKey(), fallback);
      setSelectedId(guide.id);
    } finally {
      setLoading(false);
    }
  };

  const clearGuide = () => {
    window.localStorage.removeItem(getGuideStorageKey());
    setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-grove-700">
          <BookOpenText className="h-5 w-5" />
          <h2 className="text-lg font-bold text-earth-900 dark:text-earth-100">Guías locales</h2>
        </div>
        {selectedId && (
          <button onClick={clearGuide} className="text-xs font-semibold text-earth-500 hover:text-clay-600 dark:text-earth-300">
            Quitar guía activa
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {guides.map((guide) => {
          const isActive = selectedId === guide.id;
          return (
            <div key={guide.id} className={`rounded-2xl border p-4 transition-all ${isActive ? 'border-grove-300 bg-grove-50 shadow-sm' : 'border-earth-200 bg-white'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-grove-100 text-grove-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-earth-500">{guide.module}</span>
                </div>
                {isActive && <Sparkles className="h-4 w-4 text-grove-600" />}
              </div>

              <h3 className="text-base font-bold text-earth-900 dark:text-earth-100">{guide.title}</h3>
              <p className="mt-2 text-sm text-earth-600 dark:text-earth-300">{guide.description}</p>

              <div className="mt-4 flex gap-2">
                <a href={guide.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-earth-200 bg-white px-3 py-2 text-xs font-semibold text-earth-700 hover:border-grove-300 hover:bg-grove-50">
                  Abrir guía
                  <ChevronRight className="h-3 w-3" />
                </a>
                <button onClick={() => applyGuide(guide)} disabled={loading} className="rounded-xl bg-grove-600 px-3 py-2 text-xs font-semibold text-white hover:bg-grove-700 disabled:opacity-60">
                  {isActive ? 'Reaplicar' : 'Usar como contexto'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
