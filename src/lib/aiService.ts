import type { AppData } from '@/types';
import { generateResponse as localGenerate } from '@/lib/agronomistAI';
import type { ChatMessage } from '@/lib/agronomistAI';

function getLocalGuideContext(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('agro360_local_guide_context');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { title?: string; module?: string; content?: string };
    if (parsed.content) {
      const title = parsed.title ? `Guía local activa: ${parsed.title}` : 'Guía local activa';
      const module = parsed.module ? `Módulo: ${parsed.module}` : '';
      return [title, module, parsed.content].filter(Boolean).join('\n\n');
    }

    return raw;
  } catch {
    return null;
  }
}

function buildFarmContext(data: AppData, localGuideContext?: string | null): string {
  const parts: string[] = [];

  parts.push(`Finca: ${data.farmConfig.farmName}`);
  if (data.farmConfig.location) parts.push(`Ubicación: ${data.farmConfig.location}`);
  if (data.farmConfig.size) parts.push(`Tamaño: ${data.farmConfig.size} ha`);

  const modules: string[] = [];
  if (data.farmConfig.modules.coffee) modules.push('Café');
  if (data.farmConfig.modules.rice) modules.push('Arroz');
  if (data.farmConfig.modules.livestock) modules.push('Ganadería');
  if (modules.length) parts.push(`Módulos activos: ${modules.join(', ')}`);

  if (data.coffeeDiagnoses.length > 0) {
    const last = data.coffeeDiagnoses[0];
    parts.push(`Último diagnóstico de café: ${last.result} (${Math.round(last.confidence * 100)}% confianza) — pH: ${last.soilParams.ph}, P: ${last.soilParams.phosphorus} ppm, K: ${last.soilParams.potassium} cmol/kg`);
    parts.push(`Total diagnósticos de café: ${data.coffeeDiagnoses.length}`);
  }

  if (data.ricePlots.length > 0) {
    parts.push(`Lotes de arroz: ${data.ricePlots.length}`);
    for (const p of data.ricePlots) {
      parts.push(`  - ${p.name}: ${p.area}ha, estado ${p.status}, humedad ${p.soilMoisture}%, fase rotación ${p.rotationPhase}`);
    }
  }

  if (data.cattle.length > 0) {
    const avgWeight = Math.round(data.cattle.reduce((s, c) => s + c.weight, 0) / data.cattle.length);
    const healthy = data.cattle.filter(c => c.healthStatus === 'sano').length;
    parts.push(`Hato ganadero: ${data.cattle.length} animales, peso promedio ${avgWeight} kg, ${healthy} sanos`);
  }

  if (data.paddocks.length > 0) {
    parts.push(`Potreros: ${data.paddocks.length}`);
    for (const p of data.paddocks) {
      parts.push(`  - ${p.name}: ${p.area}ha, pasto ${p.grassHeight}cm, ${p.cattleCount} animales, estado ${p.status}`);
    }
  }

  if (localGuideContext) {
    parts.push('');
    parts.push('CONTEXTO LOCAL DE GUÍA:');
    parts.push(localGuideContext);
  }

  return parts.join('\n');
}

export async function getAIResponse(
  message: string,
  history: ChatMessage[],
  data: AppData,
  language: 'es' | 'en' | 'pt' = 'es'
): Promise<{ text: string; source: 'groq' | 'local' }> {
  const groqApiKey = data.farmConfig.groqApiKey;
  const localGuideContext = getLocalGuideContext();
  const farmContext = buildFarmContext(data, localGuideContext);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/agro-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        message,
        conversationHistory: history.slice(-10).map(m => ({ role: m.role, text: m.text })),
        groqApiKey: groqApiKey || undefined,
        farmContext,
        language,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.reply || typeof result.reply !== 'string') {
      throw new Error('Respuesta inválida');
    }

    return { text: result.reply, source: 'groq' };
  } catch (err) {
    const localResponse = localGenerate(message, data);
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    const prefixed = groqApiKey
      ? `*(IA local — sin conexión a Groq: ${errorMsg})*\n\n${localResponse}`
      : localResponse;
    return { text: prefixed, source: 'local' };
  }
}
