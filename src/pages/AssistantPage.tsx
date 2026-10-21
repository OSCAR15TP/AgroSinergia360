import { useEffect, useRef, useState } from 'react';
import { BookOpen, Cloud, CloudOff, History, Leaf, Lightbulb, MessageCircle, Save, Send, Sparkles, Trash2, User, Wheat, X } from 'lucide-react';
import { AgroImageAnalyzer } from '@/components/AgroImageAnalyzer';
import type { AppData } from '@/types';
import { AI_AREAS, getSuggestedQuestions, type AiArea, type ChatMessage } from '@/lib/agronomistAI';
import { getAIResponse } from '@/lib/aiService';
import { fetchGuide, fetchGuideIndex, type LocalGuide, type LocalGuideMeta } from '@/lib/localGuides';
import { useI18n } from '@/lib/i18n';
import { uid } from '@/hooks/useAppData';

interface AssistantPageProps { data: AppData; }
interface SavedChat { id: string; name: string; date: number; messages: ChatMessage[]; area: AiArea; }
const CHAT_STORAGE_KEY = 'agro360_chat_history';
const SAVED_CHATS_KEY = 'agro360_saved_chats';

function loadHistory(): ChatMessage[] {
  try { const stored = localStorage.getItem(CHAT_STORAGE_KEY); return stored ? JSON.parse(stored) as ChatMessage[] : []; } catch { return []; }
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character); }
function renderMarkdown(text: string): string {
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => { if (list) html.push(`</${list}>`); list = null; };
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*[-•]\s+(.+)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      const next = bullet ? 'ul' : 'ol';
      if (list !== next) { closeList(); list = next; html.push(`<${list} class="my-2 space-y-1 pl-5 ${list === 'ul' ? 'list-disc' : 'list-decimal'}">`); }
      html.push(`<li>${inline((bullet ?? numbered)?.[1] ?? '')}</li>`);
    } else { closeList(); if (line.trim()) html.push(`<p class="mb-2 last:mb-0">${inline(line)}</p>`); }
  }
  closeList();
  return html.join('');
}
function inline(value: string): string { return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>'); }
function iconFor(area: AiArea) { return area === 'arroz' ? Wheat : Leaf; }

export function AssistantPage({ data }: AssistantPageProps) {
  const { lang } = useI18n();
  const [area, setArea] = useState<AiArea>('arroz');
  const [guide, setGuide] = useState<LocalGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [source, setSource] = useState<'groq' | 'local' | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setGuide(null); setGuideLoading(true);
    void fetchGuideIndex().then((guides: LocalGuideMeta[]) => {
      const meta = guides.find((item) => item.module === area);
      return meta ? fetchGuide(meta) : null;
    }).then((selected) => { if (!cancelled) setGuide(selected); }).catch(() => { if (!cancelled) setGuide(null); }).finally(() => { if (!cancelled) setGuideLoading(false); });
    return () => { cancelled = true; };
  }, [area]);

  useEffect(() => { try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)); } catch { /* Optional local history. */ } }, [messages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, thinking]);

  const send = async (value: string) => {
    const question = value.trim();
    if (!question || thinking) return;
    const userMessage: ChatMessage = { id: uid(), role: 'user', text: question, timestamp: Date.now(), area };
    setMessages((current) => [...current, userMessage]); setInput(''); setThinking(true);
    const result = await getAIResponse(question, messages, data, lang, area, guide);
    setMessages((current) => [...current, { id: uid(), role: 'assistant', text: result.text, timestamp: Date.now(), area, sources: result.sources }]);
    setSource(result.source); setThinking(false);
  };
  const clear = () => { setMessages([]); setSource(null); localStorage.removeItem(CHAT_STORAGE_KEY); };
  const addImageResult = (result: { text: string; source: 'groq' | 'local'; sources: string[] }) => {
    setMessages((current) => [...current, { id: uid(), role: 'assistant', text: result.text, timestamp: Date.now(), area, sources: result.sources }]);
    setSource(result.source);
  };
  const save = () => {
    if (!messages.length) return;
    const first = messages.find((message) => message.role === 'user')?.text ?? 'Conversación';
    const chat: SavedChat = { id: uid(), name: first.length > 36 ? `${first.slice(0, 36)}...` : first, date: Date.now(), messages: [...messages], area };
    const updated = [chat, ...savedChats].slice(0, 20); setSavedChats(updated); localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
  };
  const openHistory = () => { try { const stored = localStorage.getItem(SAVED_CHATS_KEY); setSavedChats(stored ? JSON.parse(stored) as SavedChat[] : []); } catch { setSavedChats([]); } setHistoryOpen(true); };
  const selected = AI_AREAS.find((item) => item.id === area) ?? AI_AREAS[1];

  return <div className="flex min-h-[calc(100vh-140px)] flex-col animate-fade-in md:min-h-[calc(100vh-80px)]">
    <header className="mb-5 flex items-start gap-3">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md"><Sparkles className="h-6 w-6" /></div>
      <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">AgroIA</h1><span className="rounded-full bg-grove-100 px-2.5 py-1 text-[11px] font-bold text-grove-700">Asistente técnico agropecuario</span></div><p className="mt-1 text-sm text-earth-500 dark:text-earth-400">Orientación clara basada en fichas técnicas locales.</p></div>
      <div className="flex gap-1"><button onClick={save} disabled={!messages.length} className="btn-ghost px-2.5 py-1.5 disabled:opacity-40" title="Guardar conversación"><Save className="h-4 w-4" /></button><button onClick={openHistory} className="btn-ghost px-2.5 py-1.5" title="Historial"><History className="h-4 w-4" /></button>{messages.length > 0 && <button onClick={clear} className="btn-ghost px-2.5 py-1.5" title="Borrar conversación"><Trash2 className="h-4 w-4" /></button>}</div>
    </header>

    <section className="mb-4 rounded-3xl border border-earth-200 bg-white p-4 shadow-sm dark:border-earth-700 dark:bg-earth-800/70 md:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-earth-900 dark:text-earth-100">¿En qué área necesitas orientación hoy?</h2><p className="mt-1 text-sm text-earth-500 dark:text-earth-400">Elige un área para consultar su ficha técnica correspondiente.</p></div><span className="hidden rounded-full bg-grove-50 px-3 py-1 text-xs font-semibold text-grove-700 sm:inline-flex">Consulta guiada</span></div><div className="grid gap-3 md:grid-cols-3">{AI_AREAS.map((item) => { const Icon = iconFor(item.id); const active = item.id === area; return <button key={item.id} type="button" onClick={() => setArea(item.id)} className={`group overflow-hidden rounded-2xl border text-left transition-all ${active ? 'border-grove-500 bg-grove-50 ring-2 ring-grove-200 dark:bg-grove-950/30' : 'border-earth-200 bg-white hover:-translate-y-0.5 hover:border-grove-300 dark:border-earth-700 dark:bg-earth-800'}`}><div className="relative h-28 overflow-hidden"><img src={item.image} alt={item.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><div className="absolute bottom-3 left-3 flex items-center gap-2 text-white"><Icon className="h-5 w-5" /><span className="font-bold">{item.label}</span></div></div><p className="p-3 text-xs leading-relaxed text-earth-600 dark:text-earth-300">{item.description}</p></button>; })}</div></section>

    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-earth-200/80 bg-earth-50 px-4 py-2.5 dark:border-earth-700 dark:bg-earth-800/60"><div className="flex min-w-0 items-center gap-2 text-sm text-earth-700 dark:text-earth-200"><BookOpen className="h-4 w-4 flex-shrink-0 text-grove-600" /><span className="truncate">{guideLoading ? 'Cargando ficha local...' : guide ? guide.title : 'Ficha local no disponible'}</span></div><div className="flex flex-shrink-0 items-center gap-1.5 text-xs font-medium text-earth-500 dark:text-earth-400">{source === 'groq' ? <Cloud className="h-3.5 w-3.5 text-grove-600" /> : <CloudOff className="h-3.5 w-3.5" />}{source === 'groq' ? 'IA conectada' : 'Biblioteca local'}</div></div>

    <AgroImageAnalyzer area={area} data={data} guide={guide} disabled={guideLoading || thinking} onAnalysis={addImageResult} />

    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-1 pb-3 no-scrollbar">{messages.length === 0 && <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border border-dashed border-earth-200 px-5 py-8 text-center dark:border-earth-700"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-grove-100 text-grove-600"><MessageCircle className="h-8 w-8" /></div><h2 className="font-serif text-xl text-earth-800 dark:text-earth-100">Hola, soy AgroIA</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-earth-500 dark:text-earth-400">Te ayudaré a comprender qué observar, qué puedes hacer con seguridad y cuándo conviene buscar ayuda especializada.</p><div className="mt-5 w-full max-w-xl"><div className="mb-2 flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-earth-400"><Lightbulb className="h-3.5 w-3.5" /> Ejemplos para {selected.label}</div><div className="grid gap-2 md:grid-cols-3">{getSuggestedQuestions(area).map((question) => <button key={question} onClick={() => void send(question)} disabled={thinking || guideLoading} className="rounded-xl border border-earth-200 bg-white px-3 py-2.5 text-left text-sm text-earth-700 transition-all hover:border-grove-300 hover:bg-grove-50 disabled:opacity-50 dark:border-earth-700 dark:bg-earth-800 dark:text-earth-200">{question}</button>)}</div></div></div>}{messages.map((message) => <MessageBubble key={message.id} message={message} />)}{thinking && <div className="flex gap-2.5 animate-fade-in"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-grove-600 text-white"><Sparkles className="h-4 w-4" /></div><div className="card rounded-2xl rounded-tl-sm px-4 py-3"><div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-grove-400" /><span className="h-2 w-2 animate-bounce rounded-full bg-grove-400 [animation-delay:150ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-grove-400 [animation-delay:300ms]" /></div></div></div>}</div>

    <div className="border-t border-earth-200/60 bg-white/80 pt-3 backdrop-blur dark:border-earth-700/40 dark:bg-earth-800/80"><div className="flex items-end gap-2"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(input); } }} placeholder={`Pregunta sobre ${selected.label.toLowerCase()}...`} rows={1} className="input max-h-32 flex-1 resize-none" style={{ minHeight: '44px' }} /><button onClick={() => void send(input)} disabled={!input.trim() || thinking || guideLoading} className="btn-primary h-[44px] w-[44px] flex-shrink-0 !px-0"><Send className="h-4 w-4" /></button></div><p className="mt-1.5 text-center text-[10px] text-earth-400">{source === 'groq' ? 'La IA conectada redacta usando la ficha seleccionada.' : 'Sin conexión, la biblioteca local sigue disponible para orientar tu consulta.'}</p></div>

    {historyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setHistoryOpen(false)}><div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-earth-800" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-earth-100 p-4 dark:border-earth-700"><div className="flex items-center gap-2"><History className="h-5 w-5 text-grove-600" /><h3 className="font-bold text-earth-900 dark:text-earth-100">Historial</h3></div><button onClick={() => setHistoryOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-earth-100"><X className="h-4 w-4" /></button></div><div className="max-h-96 space-y-2 overflow-y-auto p-4">{savedChats.length === 0 ? <p className="py-8 text-center text-sm text-earth-500">No hay conversaciones guardadas aún.</p> : savedChats.map((chat) => <div key={chat.id} className="flex items-center justify-between rounded-xl border border-earth-200 p-3 dark:border-earth-700"><button onClick={() => { setArea(chat.area); setMessages(chat.messages); setHistoryOpen(false); }} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-earth-800 dark:text-earth-100">{chat.name}</p><p className="mt-0.5 text-xs text-earth-500">{chat.area} · {chat.messages.length} mensajes · {new Date(chat.date).toLocaleDateString(lang)}</p></button><button onClick={() => { const updated = savedChats.filter((item) => item.id !== chat.id); setSavedChats(updated); localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated)); }} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600"><Trash2 className="h-4 w-4" /></button></div>)}</div></div></div>}
  </div>;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') return <div className="flex justify-end gap-2.5 animate-slide-up"><div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-grove-600 px-4 py-2.5 text-white"><p className="whitespace-pre-wrap text-sm">{message.text}</p></div><div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-earth-200 text-earth-600"><User className="h-4 w-4" /></div></div>;
  return <div className="flex gap-2.5 animate-slide-up"><div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-grove-600 text-white"><Sparkles className="h-4 w-4" /></div><div className="card max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-3"><div className="text-sm leading-relaxed text-earth-700 dark:text-earth-200 [&_em]:text-earth-500 [&_strong]:font-bold [&_strong]:text-earth-900 dark:[&_em]:text-earth-400 dark:[&_strong]:text-earth-100" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }} />{message.sources && message.sources.length > 0 && <div className="mt-3 flex items-center gap-1.5 border-t border-earth-100 pt-2 text-[11px] text-earth-500 dark:border-earth-700"><BookOpen className="h-3 w-3 text-grove-600" />Fuente: {message.sources.join(', ')}</div>}</div></div>;
}
