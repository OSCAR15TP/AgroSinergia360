import { supabase } from '@/lib/supabaseClient';
import type { AiArea, ChatMessage } from '@/lib/agronomistAI';

export interface SavedChat {
  id: string;
  name: string;
  date: number;
  messages: ChatMessage[];
  area: AiArea;
}

interface MessageRow {
  id: string;
  area: AiArea;
  role: ChatMessage['role'];
  text: string;
  sources: string[];
  created_at: string;
}

interface SavedChatRow {
  id: string;
  name: string;
  area: AiArea;
  messages: ChatMessage[];
  created_at: string;
}

function toChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    timestamp: new Date(row.created_at).getTime(),
    area: row.area,
    sources: row.sources,
  };
}

export async function fetchCurrentMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('assistant_messages')
    .select('id, area, role, text, sources, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => toChatMessage(row as MessageRow));
}

export async function saveCurrentMessage(message: ChatMessage, area: AiArea): Promise<void> {
  const { error } = await supabase.from('assistant_messages').insert({
    id: message.id,
    area,
    role: message.role,
    text: message.text,
    sources: message.sources ?? [],
    created_at: new Date(message.timestamp).toISOString(),
  });
  if (error) throw error;
}

export async function clearCurrentMessages(): Promise<void> {
  const { error } = await supabase.from('assistant_messages').delete().not('id', 'is', null);
  if (error) throw error;
}

export async function fetchSavedChats(): Promise<SavedChat[]> {
  const { data, error } = await supabase
    .from('assistant_saved_chats')
    .select('id, name, area, messages, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const saved = row as SavedChatRow;
    return {
      id: saved.id,
      name: saved.name,
      area: saved.area,
      messages: Array.isArray(saved.messages) ? saved.messages : [],
      date: new Date(saved.created_at).getTime(),
    };
  });
}

export async function saveChat(chat: SavedChat): Promise<void> {
  const { error } = await supabase.from('assistant_saved_chats').insert({
    id: chat.id,
    name: chat.name,
    area: chat.area,
    messages: chat.messages,
    created_at: new Date(chat.date).toISOString(),
  });
  if (error) throw error;
}

export async function deleteSavedChat(chatId: string): Promise<void> {
  const { error } = await supabase.from('assistant_saved_chats').delete().eq('id', chatId);
  if (error) throw error;
}
