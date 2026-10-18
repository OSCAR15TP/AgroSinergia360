import { ArrowLeft, BookOpenText } from 'lucide-react';
import { DocsList } from '@/components/DocsList';

export function DocsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-3xl border border-earth-200 bg-white p-5 shadow-sm dark:border-earth-700 dark:bg-earth-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-100 text-grove-700">
            <BookOpenText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-grove-600">Documentación local</p>
            <h1 className="mt-1 text-2xl font-bold text-earth-900 dark:text-earth-100">Guías de referencia</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-earth-600 dark:text-earth-300">
          Estas guías permiten reforzar el contexto del asistente con información agronómica especializada por módulo.
          Al aplicarlas, el asistente usará esa guía como parte de la conversación contextual.
        </p>
      </div>

      <div className="rounded-3xl border border-earth-200 bg-white p-5 shadow-sm dark:border-earth-700 dark:bg-earth-800">
        <DocsList />
      </div>

      <div className="flex items-center gap-2 text-sm text-earth-500 dark:text-earth-300">
        <ArrowLeft className="h-4 w-4" />
        Las guías se usan como contexto local para las consultas del asistente.
      </div>
    </div>
  );
}
