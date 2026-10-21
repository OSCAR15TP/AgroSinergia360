const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Eres AgroIA, un asistente técnico agropecuario para agricultores y ganaderos de América Latina.

Explica con español sencillo, natural y respetuoso. Responde primero lo más útil y usa solo las secciones necesarias: Respuesta directa, Qué debes observar, Qué puedes hacer ahora, Cuándo buscar ayuda especializada y Fuente consultada.

No conviertas una posibilidad en un diagnóstico confirmado. No inventes datos, fuentes, dosis, productos ni requisitos legales. Usa únicamente la ficha técnica incluida para el área seleccionada. Si la ficha no alcanza, dilo claramente y pide los datos que faltan. En ganadería no recetes medicamentos. En cultivos no indiques aplicar productos sin recomendar confirmar el diagnóstico y la etiqueta local. Explica los términos técnicos con palabras cotidianas.`;

interface RequestBody {
  message?: unknown;
  area?: unknown;
  conversationHistory?: unknown;
  farmContext?: unknown;
  guideContext?: unknown;
  guideTitle?: unknown;
  groqApiKey?: unknown;
  language?: unknown;
}

function respond(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const body = await req.json() as RequestBody;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return respond({ error: "Escribe una pregunta para continuar." }, 400);
    const area = body.area === "cafe" || body.area === "arroz" || body.area === "ganaderia" ? body.area : "arroz";
    const languageNames: Record<string, string> = { es: "español", en: "inglés", pt: "portugués" };
    const language = typeof body.language === "string" && body.language in languageNames ? body.language : "es";
    const apiKey = typeof body.groqApiKey === "string" && body.groqApiKey.trim() ? body.groqApiKey.trim() : Deno.env.get("GROQ_API_KEY");
    if (!apiKey) return respond({ error: "No hay una clave de IA conectada. Puedes usar la biblioteca local." }, 400);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [{ role: "system", content: `${SYSTEM_PROMPT}\n\nResponde en ${languageNames[language]}. Área elegida: ${area}.` }];
    if (typeof body.guideContext === "string" && body.guideContext.trim()) {
      const title = typeof body.guideTitle === "string" ? body.guideTitle : "ficha técnica local";
      messages.push({ role: "system", content: `Fuente disponible: ${title}.\n${body.guideContext}` });
    } else {
      messages.push({ role: "system", content: "No hay una ficha técnica local disponible. Explica qué información falta y no inventes recomendaciones específicas." });
    }
    if (typeof body.farmContext === "string") messages.push({ role: "system", content: `Datos de la finca:\n${body.farmContext}` });
    if (Array.isArray(body.conversationHistory)) {
      for (const item of body.conversationHistory.slice(-8)) {
        if (!item || typeof item !== "object") continue;
        const role = (item as { role?: unknown }).role;
        const text = (item as { text?: unknown }).text;
        if ((role === "user" || role === "assistant") && typeof text === "string") messages.push({ role, content: text.slice(0, 4000) });
      }
    }
    messages.push({ role: "user", content: message.slice(0, 4000) });

    const modelsResponse = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    const modelsData = await modelsResponse.json().catch(() => ({ data: [] }));
    const availableModels = Array.isArray(modelsData.data) ? modelsData.data.map((model: { id?: unknown }) => typeof model.id === "string" ? model.id : "") : [];
    const preferredModels = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    const model = preferredModels.find((candidate) => availableModels.includes(candidate)) ?? availableModels.find((candidate) => !/(whisper|guard|orpheus|tts|safeguard)/i.test(candidate));
    if (!model) return respond({ error: "La clave de IA no tiene un modelo disponible." }, 502);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.25, max_tokens: 1200, top_p: 0.85 }),
    });
    if (!response.ok) return respond({ error: "La IA conectada no pudo responder en este momento." }, 502);
    const result = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return respond({ error: "La IA devolvió una respuesta vacía." }, 502);
    return respond({ reply: reply.trim() });
  } catch {
    return respond({ error: "No fue posible procesar la consulta." }, 500);
  }
});
