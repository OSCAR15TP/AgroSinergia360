import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signUp: (firstName: string, lastName: string, email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

function toAppUser(user: User): AppUser {
  const firstName = String(user.user_metadata?.first_name ?? '');
  const lastName = String(user.user_metadata?.last_name ?? '');
  return {
    id: user.id,
    email: user.email ?? '',
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || user.email || 'Usuario',
    createdAt: user.created_at,
  };
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Correo o contrasena incorrectos.';
  if (lower.includes('already registered') || lower.includes('already been registered')) return 'Ya existe una cuenta con ese correo.';
  if (lower.includes('password should be at least')) return 'La contrasena debe tener al menos 6 caracteres.';
  if (lower.includes('invalid email')) return 'Ingresa un correo valido.';
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Demasiados intentos. Espera unos minutos.';
  return 'No se pudo completar la operacion. Intenta de nuevo.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => setUser(data.session?.user ? toAppUser(data.session.user) : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ? toAppUser(session.user) : null);
      })();
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const signUp = async (firstName: string, lastName: string, email: string, password: string) => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) return { error: 'Ingresa tu nombre y apellidos.' };

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: trimmedFirst, last_name: trimmedLast } },
    });
    if (error) return { error: translateAuthError(error.message) };
    if (!data.session) return { error: 'Tu cuenta se creo, pero necesita confirmacion. Pide al administrador que la active.' };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
