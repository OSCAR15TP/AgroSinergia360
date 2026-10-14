import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface LocalUser {
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
}

interface StoredAccount {
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
}

interface AuthContextValue {
  user: LocalUser | null;
  loading: boolean;
  signUp: (firstName: string, lastName: string, password: string) => { error: string | null };
  signIn: (firstName: string, lastName: string, password: string) => { error: string | null };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signUp: () => ({ error: null }),
  signIn: () => ({ error: null }),
  signOut: () => {},
});

const ACCOUNTS_KEY = 'agro360_accounts';
const SESSION_KEY = 'agro360_session';

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + '_agro360_salt');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function loadSession(): LocalUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(loadSession());
    setLoading(false);
  }, []);

  const signUp = (firstName: string, lastName: string, password: string): { error: string | null } => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) return { error: 'Ingresa tu nombre y apellidos.' };
    if (password.length < 4) return { error: 'La contrasena debe tener al menos 4 caracteres.' };

    const accounts = loadAccounts();
    const exists = accounts.find(a =>
      a.firstName.toLowerCase() === trimmedFirst.toLowerCase() &&
      a.lastName.toLowerCase() === trimmedLast.toLowerCase()
    );
    if (exists) return { error: 'Ya existe una cuenta con ese nombre y apellidos.' };

    (async () => {
      const passwordHash = await hashPassword(password);
      const newAccount: StoredAccount = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      saveAccounts([...accounts, newAccount]);
      const localUser: LocalUser = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        fullName: `${trimmedFirst} ${trimmedLast}`,
        createdAt: newAccount.createdAt,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
      setUser(localUser);
    })();
    return { error: null };
  };

  const signIn = (firstName: string, lastName: string, password: string): { error: string | null } => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) return { error: 'Ingresa tu nombre y apellidos.' };

    const accounts = loadAccounts();
    const account = accounts.find(a =>
      a.firstName.toLowerCase() === trimmedFirst.toLowerCase() &&
      a.lastName.toLowerCase() === trimmedLast.toLowerCase()
    );
    if (!account) return { error: 'No se encontro una cuenta con ese nombre. Registrate primero.' };

    (async () => {
      const passwordHash = await hashPassword(password);
      if (passwordHash !== account.passwordHash) {
        return;
      }
      const localUser: LocalUser = {
        firstName: account.firstName,
        lastName: account.lastName,
        fullName: `${account.firstName} ${account.lastName}`,
        createdAt: account.createdAt,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
      setUser(localUser);
    })();
    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
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
