import { AlertCircle, BookOpenText, ChevronRight, FileText, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import {
  clearActiveGuide,
  fetchGuide,
  fetchGuideIndex,
  getActiveGuide,
  saveActiveGuide,
  type LocalGuide,
  type LocalGuideMeta,
} from '@/lib/localGuides';

export function DocsList() {
  const [guides, setGuides] = useState<LocalGuideMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => getActiveGuide()?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<LocalGuide | null>(null);

  useEffect(() => {
    fetchGuideIndex()
      .then(setGuides)
      .catch(() => setError('No se pudo cargar el índice de guías.'));
  }, []);

  const loadGuide = async (meta: LocalGuideMeta) => {
    setBusyId(meta.id);
    setError(null);
    try {
      return await fetchGuide(meta);
    } catch {
      setError(`No se pudo cargar "${meta.title}". Verifica que el archivo exista en ${meta.path}.`);
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const handleOpen = async (meta: LocalGuideMeta) => {
    const guide = await loadGuide(meta);
    if (guide) setOpenGuide(guide);
  };

  const handleApply = async (meta: LocalGuideMeta) => {
    const guide = await loadGuide(meta);
    if (!guide) return;
    saveActiveGuide(guide);
    setActiveId(guide.id);
    setNotice(`"${guide.title}" está activa. El asistente la usará en sus respuestas.`);
  };

  const handleClear = () => {
    clearActiveGuide();
    setActiveId(null);
    setNotice(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-grove-700">
          <BookOpenText className="h-5 w-5" />
          <h2 className="text-lg font-bold text-earth-900 dark:text-earth-100">Guías locales</h2>
        </div>
        {activeId && (
          <button onClick={handleClear} className="text-xs font-semibold text-earth-500 hover:text-clay-600 dark:text-earth-300">
            Quitar guía activa
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-clay-200 bg-clay-50 p-3 text-sm text-clay-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {notice && !error && (
        <div role="status" className="flex items-start gap-2 rounded-2xl border border-grove-200 bg-grove-50 p-3 text-sm text-grove-800">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {guides.map((guide) => {
          const isActive = activeId === guide.id;
          const isBusy = busyId === guide.id;
          return (
            <div
              key={guide.id}
              className={`flex flex-col rounded-2xl border p-4 transition-all ${
                isActive
                  ? 'border-grove-400 bg-grove-50 shadow-sm dark:border-grove-500 dark:bg-grove-900/30'
                  : 'border-earth-200 bg-white dark:border-earth-700 dark:bg-earth-900'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-grove-100 text-grove-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-earth-500 dark:text-earth-400">{guide.module}</span>
                </div>
                {isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-grove-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Sparkles className="h-3 w-3" /> Activa
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-earth-900 dark:text-earth-100">{guide.title}</h3>
              <p className="mt-2 flex-1 text-sm text-earth-600 dark:text-earth-300">{guide.description}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleOpen(guide)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-xl border border-earth-200 bg-white px-3 py-2 text-xs font-semibold text-earth-700 hover:border-grove-300 hover:bg-grove-50 disabled:opacity-60 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-200 dark:hover:bg-earth-700"
                >
                  Abrir guía
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleApply(guide)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-xl bg-grove-600 px-3 py-2 text-xs font-semibold text-white hover:bg-grove-700 disabled:opacity-60"
                >
                  {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isActive ? 'Reaplicar' : 'Usar como contexto'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={openGuide !== null} onClose={() => setOpenGuide(null)} title={openGuide?.title ?? ''} size="lg">
        {openGuide && (
          <div className="space-y-4">
            <p className="text-sm text-earth-600">{openGuide.summary}</p>
            {openGuide.sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-earth-200 p-4">
                <h4 className="text-sm font-bold text-earth-900">{section.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-earth-700">{section.content}</p>
              </section>
            ))}
            <button
              onClick={() => {
                saveActiveGuide(openGuide);
                setActiveId(openGuide.id);
                setNotice(`"${openGuide.title}" está activa. El asistente la usará en sus respuestas.`);
                setOpenGuide(null);
              }}
              className="w-full rounded-xl bg-grove-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-grove-700"
            >
              Usar esta guía como contexto
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
