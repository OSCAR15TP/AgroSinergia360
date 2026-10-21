import type { AppData } from '@/types';
import { findRelevantSections, type LocalGuide } from '@/lib/localGuides';

export type AiArea = 'cafe' | 'arroz' | 'ganaderia';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  area?: AiArea;
  sources?: string[];
}

export const AI_AREAS: Array<{ id: AiArea; label: string; description: string; image: string }> = [
  { id: 'cafe', label: 'Café', description: 'Hojas, frutos, suelo y manejo del cafetal', image: 'https://images.pexels.com/photos/7761601/pexels-photo-7761601.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { id: 'arroz', label: 'Arroz', description: 'Desarrollo, agua, nutrición y problemas del lote', image: 'https://images.pexels.com/photos/19239403/pexels-photo-19239403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { id: 'ganaderia', label: 'Ganadería', description: 'Alimentación, manejo y observación del ganado', image: 'https://images.pexels.com/photos/28962577/pexels-photo-28962577.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
];

const areaNames: Record<AiArea, string> = { cafe: 'café', arroz: 'arroz', ganaderia: 'ganadería bovina' };

function observationsFor(area: AiArea): string {
  if (area === 'cafe') return 'Observa el color y la forma de las manchas, si están en una o ambas caras de la hoja, cuántas plantas presentan el cambio y si también hay daños en frutos o ramas.';
  if (area === 'arroz') return 'Observa la etapa del cultivo, el color y la forma de las manchas, si aparecen en hojas jóvenes o viejas, cómo está la humedad del lote y si el problema se repite en varias plantas.';
  return 'Observa desde cuándo cambió el comportamiento, si el animal bebe agua, cómo camina, si rumia y si hay fiebre, secreciones, diarrea o dificultad para respirar.';
}

function safetyFor(area: AiArea): string {
  return area === 'ganaderia'
    ? 'Si el animal no puede mantenerse en pie, respira con dificultad, tiene sangrado, fiebre marcada o deja de beber, busca atención veterinaria cuanto antes.'
    : 'Evita aplicar productos mientras no se haya identificado mejor el problema. Si el daño avanza rápidamente o afecta muchas plantas, consulta a un técnico agrícola.';
}

function sourceFor(guide: LocalGuide | null): string {
  return guide ? `**Fuente consultada:** ${guide.title}. Confirma dosis, productos y normas con la autoridad o profesional de tu zona.` : '**Fuente:** no hay una ficha local disponible en este momento.';
}

export function generateResponse(query: string, data: AppData, guide: LocalGuide | null, area: AiArea = 'arroz'): string {
  void data;
  if (!query.trim()) return 'Escribe una pregunta y elige primero el área que quieres consultar.';
  const sections = guide ? findRelevantSections(guide, query, 2) : [];
  const areaName = areaNames[area];
  if (sections.length === 0) {
    return `**Para orientarte sobre ${areaName}, necesito algunos datos más.**\n\n${observationsFor(area)}\n\n**Qué puedes hacer ahora**\n1. Describe qué observas y desde cuándo comenzó.\n2. Indica la etapa del cultivo o la edad y condición del animal.\n3. Cuenta si el problema aparece en una sola planta o animal, o en varios.\n\n${safetyFor(area)}\n\n${sourceFor(guide)}`;
  }
  const evidence = sections.map((section) => `**${section.title}**\n${section.content}`).join('\n\n');
  return `**Esto es lo que conviene revisar primero**\n\n${evidence}\n\n**Qué puedes hacer ahora**\n1. Compara esas señales con lo que observas en tu ${area === 'ganaderia' ? 'animal o lote' : 'cultivo'}.\n2. Anota cuándo comenzó, cuánto se ha extendido y qué manejo recibió recientemente.\n3. Toma una fotografía clara o registra los datos del lote para facilitar la revisión.\n\n**Importante:** una señal aislada no confirma por sí sola una enfermedad, plaga o deficiencia. Si faltan datos, es mejor observar y consultar antes de aplicar un tratamiento.\n\n${safetyFor(area)}\n\n${sourceFor(guide)}`;
}

export const SUGGESTED_QUESTIONS: Record<AiArea, string[]> = {
  cafe: ['¿Cómo reconozco problemas en las hojas de mi café?', '¿Qué señales debo revisar si veo manchas en el cafetal?', '¿Cómo puedo cuidar el suelo y la sombra del café?'],
  arroz: ['¿Cómo reconozco problemas en las hojas de mi arroz?', '¿Por qué mis plantas de arroz están creciendo poco?', '¿Qué debo revisar antes de cambiar el riego?'],
  ganaderia: ['¿Qué debo revisar si una vaca está comiendo menos?', '¿Cómo sé si el pastoreo está siendo adecuado?', '¿Qué señales de estrés por calor debo observar?'],
};

export function getSuggestedQuestions(area: AiArea): string[] {
  return SUGGESTED_QUESTIONS[area];
}
