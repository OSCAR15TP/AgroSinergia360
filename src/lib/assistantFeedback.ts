import { supabase } from '@/lib/supabaseClient';
import type { AiArea } from '@/lib/agronomistAI';

export interface AssistantFeedbackInput {
  messageId: string;
  area: AiArea;
  guideTitle: string | null;
  helpful: boolean;
  consentToReview: boolean;
  question: string | null;
  answer: string;
}

export const DUPLICATE_FEEDBACK_CODE = '23505';

export async function saveAssistantFeedback(input: AssistantFeedbackInput): Promise<void> {
  const { error } = await supabase.from('assistant_feedback').insert({
    message_id: input.messageId,
    area: input.area,
    guide_title: input.guideTitle,
    helpful: input.helpful,
    consent_to_review: input.consentToReview,
    question: input.consentToReview ? input.question : null,
    answer: input.consentToReview ? input.answer : null,
  });
  if (error) throw error;
}
