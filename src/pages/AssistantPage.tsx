import { useState, useRef, useEffect } from 'react';
import type { AppData } from '@/types';
import { Sparkles, Send, MessageCircle, User, Trash2, Lightbulb, Cloud, CloudOff, Camera, Save, History, X } from 'lucide-react';
import { getSuggestedQuestions, type ChatMessage } from '@/lib/agronomistAI';
import { getAIResponse } from '@/lib/aiService';
import { useI18n } from '@/lib/i18n';
import { uid } from '@/hooks/useAppData';
import { ImageDiagnosisModal, type VisualDiagnosisResult } from '@/components/ImageDiagnosisModal';
import { analyzeGeneralPhoto } from '@/lib/visualDiagnosis';

interface AssistantPageProps {
  data: AppData;
}

const CHAT_STORAGE_KEY = 'agro360_chat_history';

function loadChatHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as ChatMessage[];
  } catch {
    // ignore
  }
  return [];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
}

function formatInline(value: string): string {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let tableRows: string[] = [];

  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };

  const closeTable = () => {
    if (tableRows.length === 0) return;
    const rows = tableRows.filter(row => !/^\s*\|?\s*:?-{3,}/.test(row));
    const [header, ...body] = rows;
    html.push('<div class="overflow-x-auto my-3"><table class="w-full border-collapse text-left text-xs"><thead><tr>');
    html.push(header.split('|').filter(Boolean).map(cell => `<th class="border-b border-earth-200 px-2 py-1.5 font-bold">${formatInline(cell.trim())}</th>`).join(''));
    html.push('</tr></thead><tbody>');
    body.forEach(row => {
      html.push(`<tr>${row.split('|').filter(Boolean).map(cell => `<td class="border-b border-earth-100 px-2 py-1.5 align-top">${formatInline(cell.trim())}</td>`).join('')}</tr>`);
    });
    html.push('</tbody></table></div>');
    tableRows = [];
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('|')) {
      closeList();
      tableRows.push(line);
      return;
    }
    closeTable();
    const bullet = line.match(/^\s*[-•]\s+(.+)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      const nextType = bullet ? 'ul' : 'ol';
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        html.push(`<${listType} class="my-2 space-y-1 pl-5 ${listType === 'ul' ? 'list-disc' : 'list-decimal'}">`);
      }
      html.push(`<li>${formatInline((bullet ?? numbered)?.[1] ?? '')}</li>`);
      return;
    }
    closeList();
    if (line.trim()) html.push(`<p class="mb-2 last:mb-0">${formatInline(line)}</p>`);
  });

  closeList();
  closeTable();
  return html.join('');
}

export function AssistantPage({ data }: AssistantPageProps) {
  const { lang, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiSource, setAiSource] = useState<'groq' | 'local' | null>(null);
  const [showImageDiagnosis, setShowImageDiagnosis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedChats, setSavedChats] = useState<{ id: string; name: string; date: number; messages: ChatMessage[] }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || isThinking) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      text: q,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const result = await getAIResponse(q, [...messages], data, lang);

    const botMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      text: result.text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, botMsg]);
    setAiSource(result.source);
    setIsThinking(false);
  };

  const clearChat = () => {
    setMessages([]);
    setAiSource(null);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const saveChat = () => {
    if (messages.length === 0) return;
    const firstMsg = messages.find(m => m.role === 'user')?.text ?? 'Conversación';
    const name = firstMsg.length > 30 ? firstMsg.slice(0, 30) + '...' : firstMsg;
    const newSavedChat = {
      id: uid(),
      name,
      date: Date.now(),
      messages: [...messages],
    };
    const updated = [newSavedChat, ...savedChats].slice(0, 20);
    setSavedChats(updated);
    try {
      localStorage.setItem('agro360_saved_chats', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const loadSavedChats = () => {
    try {
      const stored = localStorage.getItem('agro360_saved_chats');
      if (stored) setSavedChats(JSON.parse(stored));
    } catch {
      // ignore
    }
  };

  const openHistory = () => {
    loadSavedChats();
    setShowHistory(true);
  };

  const loadChat = (chat: { messages: ChatMessage[] }) => {
    setMessages(chat.messages);
    setShowHistory(false);
  };

  const deleteSavedChat = (id: string) => {
    const updated = savedChats.filter(c => c.id !== id);
    setSavedChats(updated);
    try {
      localStorage.setItem('agro360_saved_chats', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleImageDiagnosis = async (photoDataUrl: string): Promise<VisualDiagnosisResult> => {
    const result = await analyzeGeneralPhoto(photoDataUrl);
    const summaryMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      text: '[Diagnóstico por imagen]',
      timestamp: Date.now(),
    };
    const resultMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      text: `**Diagnóstico visual: ${result.label}**\n\n${result.summary}\n\n**Recomendaciones:**\n${result.recommendations.map(r => `- ${r}`).join('\n')}\n\n_Nivel de confianza: ${Math.round(result.confidence * 100)}%_`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, summaryMsg, resultMsg]);
    return result;
  };

  const hasGroqKey = !!data.farmConfig.groqApiKey;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">{t('ai.title')}</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-earth-500 dark:text-earth-400">
              {hasGroqKey ? t('ai.groq_connected') : t('ai.local_active')}
            </p>
            {aiSource && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${aiSource === 'groq' ? 'text-grove-600' : 'text-harvest-600'}`}>
                {aiSource === 'groq' ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
                {aiSource === 'groq' ? 'Groq' : 'Local'}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={saveChat} disabled={messages.length === 0} className="btn-ghost text-sm py-1.5 px-2.5 disabled:opacity-40" title={t('ai.save_chat')}>
            <Save className="h-4 w-4" />
          </button>
          <button onClick={openHistory} className="btn-ghost text-sm py-1.5 px-2.5" title={t('ai.history')}>
            <History className="h-4 w-4" />
          </button>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-ghost text-sm py-1.5 px-2.5" title={t('ai.clear')}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!hasGroqKey && messages.length === 0 && (
        <div className="card p-3 mb-3 bg-harvest-50 border-harvest-200 animate-slide-down">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-harvest-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-harvest-800">
              <strong> {t('ai.groq_hint')}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 px-1 pb-2 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-grove-100 text-grove-600">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="font-serif text-xl text-earth-800 mb-1 dark:text-earth-100">{t('ai.welcome')}</h2>
            <p className="text-sm text-earth-500 max-w-md mb-6 dark:text-earth-400">
              {t('ai.welcome_desc')}
            </p>
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-earth-400 uppercase tracking-wide">
                <Lightbulb className="h-3.5 w-3.5" /> {t('ai.suggested')}
              </div>
              {getSuggestedQuestions(lang).map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={isThinking}
                  className="w-full text-left rounded-xl border border-earth-200 bg-white px-4 py-2.5 text-sm text-earth-700 hover:border-grove-300 hover:bg-grove-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isThinking && (
          <div className="flex gap-2.5 animate-fade-in">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-grove-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="card px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-grove-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-grove-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-grove-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-earth-200/60 bg-white/80 backdrop-blur pt-3 pb-1 dark:border-earth-700/40 dark:bg-earth-800/80">
        <div className="flex gap-2 items-end">
          <button
            onClick={() => setShowImageDiagnosis(true)}
            disabled={isThinking}
            className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl border border-earth-200 bg-white text-earth-600 hover:border-grove-300 hover:bg-grove-50 hover:text-grove-600 transition-all disabled:opacity-50"
            title={t('ai.image_diag')}
          >
            <Camera className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t('ai.placeholder')}
              rows={1}
              className="input resize-none pr-12 max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isThinking}
            className="btn-primary h-[44px] w-[44px] flex-shrink-0 !px-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-earth-400 text-center">
          {hasGroqKey
            ? t('ai.groq_footer')
            : t('ai.local_footer')}
        </p>
      </div>

      {/* Image Diagnosis Modal */}
      <ImageDiagnosisModal
        open={showImageDiagnosis}
        onClose={() => setShowImageDiagnosis(false)}
        title={t('ai.image_diag')}
        description={t('ai.image_diag_desc')}
        accent="sky"
        analyze={handleImageDiagnosis}
      />

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-earth-100 p-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-grove-600" />
                <h3 className="text-base font-bold text-earth-900">{t('ai.history')}</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-earth-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {savedChats.length === 0 ? (
                <p className="text-center text-sm text-earth-500 py-8">{t('ai.no_saved')}</p>
              ) : (
                savedChats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between rounded-xl border border-earth-200 p-3 hover:border-grove-300 transition-colors">
                    <button onClick={() => loadChat(chat)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-earth-800 truncate">{chat.name}</p>
                      <p className="text-xs text-earth-500 mt-0.5">
                        {chat.messages.length} mensajes — {new Date(chat.date).toLocaleDateString(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                    <button onClick={() => deleteSavedChat(chat.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex gap-2.5 justify-end animate-slide-up">
        <div className="bg-grove-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-earth-200 text-earth-600">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 animate-slide-up">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-grove-600 text-white">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="card px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%]">
        {message.text === '[Diagnóstico por imagen]' ? (
          <div className="flex items-center gap-2 text-sm text-earth-500 italic">
            <Camera className="h-4 w-4 text-grove-600" />
            Diagnóstico por imagen
          </div>
        ) : (
          <div
            className="text-sm text-earth-700 leading-relaxed [&_strong]:font-bold [&_strong]:text-earth-900 dark:text-earth-200 dark:[&_strong]:text-earth-100"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
          />
        )}
      </div>
    </div>
  );
}
