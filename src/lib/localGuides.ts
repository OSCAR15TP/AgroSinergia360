export interface LocalGuideMeta {
  id: string;
  module: string;
  title: string;
  description: string;
  path: string;
  type: 'json';
}

export interface GuideSection {
  title: string;
  keywords: string[];
  content: string;
}

export interface LocalGuide {
  id: string;
  module: string;
  title: string;
  summary: string;
  sections: GuideSection[];
}

const STORAGE_KEY = 'agro360_local_guide_context';

export function resolveDocPath(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(resolveDocPath(path));
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('json')) {
    throw new Error(`No se encontró el archivo ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchGuideIndex(): Promise<LocalGuideMeta[]> {
  const data = await fetchJson<{ guides?: LocalGuideMeta[] }>('/docs/index.json');
  return data.guides ?? [];
}

export function fetchGuide(meta: LocalGuideMeta): Promise<LocalGuide> {
  return fetchJson<LocalGuide>(meta.path);
}

export function saveActiveGuide(guide: LocalGuide) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guide));
}

export function clearActiveGuide() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getActiveGuide(): LocalGuide | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalGuide>;
    if (!parsed.title || !Array.isArray(parsed.sections)) return null;
    return parsed as LocalGuide;
  } catch {
    return null;
  }
}

export function guideToText(guide: LocalGuide): string {
  const sections = guide.sections.map((s) => `### ${s.title}\n${s.content}`).join('\n\n');
  return `Guía local activa: ${guide.title} (módulo: ${guide.module})\n${guide.summary}\n\n${sections}`;
}

export function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function findRelevantSections(guide: LocalGuide, query: string, max = 2): GuideSection[] {
  const q = normalizeText(query);
  const queryWords = q.split(/[^a-z0-9]+/).filter((w) => w.length > 3);

  return guide.sections
    .map((section) => {
      let score = 0;
      for (const kw of section.keywords) {
        if (q.includes(normalizeText(kw))) score += kw.includes(' ') ? 3 : 2;
      }
      const titleWords = normalizeText(section.title).split(/\s+/);
      const contentWords = normalizeText(section.content).split(/[^a-z0-9]+/).filter((w) => w.length > 4);
      for (const w of queryWords) {
        if (titleWords.some((t) => t.length > 3 && (t.startsWith(w) || w.startsWith(t)))) score += 2;
        if (contentWords.some((contentWord) => contentWord.startsWith(w) || w.startsWith(contentWord))) score += 1;
      }
      return { section, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.section);
}
