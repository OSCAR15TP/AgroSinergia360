import type { AppData } from '@/types';
import { generateResponse, type AiArea, type ChatMessage } from '@/lib/agronomistAI';
import { guideToText, type LocalGuide } from '@/lib/localGuides';

function buildFarmContext(data: AppData): string {
  const parts: string[] = [];
  if (data.farmConfig.farmName) parts.push(`Finca: ${data.farmConfig.farmName}`);
  if (data.farmConfig.location) parts.push(`Ubicación: ${data.farmConfig.location}`);
  if (data.farmConfig.size) parts.push(`Tamaño: ${data.farmConfig.size} ha`);
  if (data.coffeeDiagnoses.length) {
    const last = data.coffeeDiagnoses[0];
    parts.push(`Último registro de café: ${last.result}; pH ${last.soilParams.ph}; fósforo ${last.soilParams.phosphorus} ppm; potasio ${last.soilParams.potassium} cmol/kg`);
  }
  if (data.ricePlots.length) parts.push(`Lotes de arroz: ${data.ricePlots.length}. Humedad registrada: ${data.ricePlots.map((plot) => `${plot.name} ${plot.soilMoisture}%`).join(', ')}`);
  if (data.cattle.length) {
    const averageWeight = Math.round(data.cattle.reduce((sum, cattle) => sum + cattle.weight, 0) / data.cattle.length);
    parts.push(`Ganado registrado: ${data.cattle.length} animales; peso promedio ${averageWeight} kg`);
  }
  return parts.join('\n') || 'No hay datos de finca registrados.';
}

export async function getAIResponse(message: string, history: ChatMessage[], data: AppData, language: 'es' | 'en' | 'pt' = 'es', area: AiArea = 'arroz', guide: LocalGuide | null = null): Promise<{ text: string; source: 'groq' | 'local'; sources: string[] }> {
  const groqApiKey = data.farmConfig.groqApiKey;
  const sources = guide ? [guide.title] : [];
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Conexión no disponible');
    const response = await fetch(`${supabaseUrl}/functions/v1/agro-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}`, apikey: supabaseAnonKey },
      body: JSON.stringify({
        message,
        area,
        conversationHistory: history.slice(-8).map((item) => ({ role: item.role, text: item.text })),
        groqApiKey: groqApiKey || undefined,
        farmContext: buildFarmContext(data),
        guideContext: guide ? guideToText(guide) : '',
        guideTitle: guide?.title ?? '',
        language,
      }),
    });
    if (!response.ok) throw new Error('La IA conectada no pudo responder');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || !('reply' in result) || typeof result.reply !== 'string') throw new Error('Respuesta inválida');
    return { text: result.reply, source: 'groq', sources };
  } catch {
    const localText = generateResponse(message, data, guide, area);
    const notice = groqApiKey ? '*No pude conectar con la IA en línea. Te respondo con la biblioteca local.*\n\n' : '';
    return { text: `${notice}${localText}`, source: 'local', sources };
  }
}
