import { useState } from 'react';
import { Check, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ChatMessage } from '@/lib/agronomistAI';
import { DUPLICATE_FEEDBACK_CODE, saveAssistantFeedback } from '@/lib/assistantFeedback';

interface AssistantFeedbackProps {
  message: ChatMessage;
  question: string | null;
}

type Stage = 'idle' | 'consent' | 'saving' | 'done' | 'error';

export function AssistantFeedback({ message, question }: AssistantFeedbackProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [helpful, setHelpful] = useState(true);
  const [consent, setConsent] = useState(false);

  const choose = (value: boolean) => { setHelpful(value); setStage('consent'); };

  const submit = async () => {
    setStage('saving');
    try {
      await saveAssistantFeedback({
        messageId: message.id,
        area: message.area ?? 'arroz',
        guideTitle: message.sources?.[0] ?? null,
        helpful,
        consentToReview: consent,
        question,
        answer: message.text,
      });
      setStage('done');
    } catch (cause) {
      if ((cause as { code?: string }).code === DUPLICATE_FEEDBACK_CODE) { setStage('done'); return; }
      console.error('assistant feedback failed', cause);
      setStage('error');
    }
  };

  if (stage === 'done') {
    return <p className="mt-3 flex items-center gap-1.5 border-t border-earth-100 pt-2 text-[11px] font-medium text-grove-700 dark:border-earth-700 dark:text-grove-300"><Check className="h-3 w-3" />Gracias por tu opinión</p>;
  }

  if (stage === 'idle' || stage === 'error') {
    return <div className="mt-3 border-t border-earth-100 pt-2 dark:border-earth-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-earth-500 dark:text-earth-400">¿Te ayudó esta respuesta?</span>
        <button type="button" onClick={() => choose(true)} className="inline-flex items-center gap-1 rounded-lg border border-earth-200 px-2 py-1 text-[11px] font-semibold text-earth-700 transition-colors hover:border-grove-300 hover:bg-grove-50 dark:border-earth-600 dark:text-earth-200"><ThumbsUp className="h-3 w-3" />Sí</button>
        <button type="button" onClick={() => choose(false)} className="inline-flex items-center gap-1 rounded-lg border border-earth-200 px-2 py-1 text-[11px] font-semibold text-earth-700 transition-colors hover:border-clay-300 hover:bg-clay-50 dark:border-earth-600 dark:text-earth-200"><ThumbsDown className="h-3 w-3" />No</button>
      </div>
      {stage === 'error' && <p className="mt-2 text-[11px] text-clay-600">No pudimos guardar tu opinión. Intenta de nuevo.</p>}
    </div>;
  }

  return <div className="mt-3 space-y-2 border-t border-earth-100 pt-2 dark:border-earth-700">
    <label className="flex items-start gap-2 text-[11px] leading-relaxed text-earth-600 dark:text-earth-300">
      <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 accent-grove-600" />
      <span>Acepto que el equipo revise esta pregunta y respuesta para mejorar las fichas técnicas. Si no marcas esta casilla, solo se guarda tu opinión, sin el texto.</span>
    </label>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => void submit()} disabled={stage === 'saving'} className="btn-primary px-3 py-1 text-[11px] disabled:opacity-50">{stage === 'saving' ? 'Enviando...' : 'Enviar opinión'}</button>
      <button type="button" onClick={() => setStage('idle')} disabled={stage === 'saving'} className="text-[11px] font-medium text-earth-500 hover:text-earth-700 dark:text-earth-400">Cancelar</button>
    </div>
  </div>;
}
