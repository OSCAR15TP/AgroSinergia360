import { useState, useRef, useEffect } from 'react';
import type { LocalUser } from '@/hooks/useAuth';
import type { Page } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, ChevronDown, Settings } from 'lucide-react';

interface UserProfileProps {
  user: LocalUser;
  compact?: boolean;
  onNavigate?: (page: Page) => void;
}

export function UserProfile({ user, compact, onNavigate }: UserProfileProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const name = user.fullName;
  const subtitle = `Cuenta local · ${new Date(user.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const handleNavigate = (page: Page) => {
    setOpen(false);
    onNavigate?.(page);
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut();
  };

  const dropdown = (
    <div className={`absolute z-50 w-56 rounded-xl border border-earth-200 bg-white shadow-lg animate-slide-down overflow-hidden ${
      compact ? 'right-0 top-full mt-1' : 'left-0 right-0 bottom-full mb-1 mx-2'
    }`}>
      <div className="px-4 py-3 border-b border-earth-100">
        <p className="text-sm font-bold text-earth-800 truncate">{name}</p>
        <p className="text-xs text-earth-500 truncate">{subtitle}</p>
      </div>
      {onNavigate && (
        <button
          onClick={() => handleNavigate('settings')}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-earth-700 hover:bg-earth-50 transition-colors"
        >
          <Settings className="h-4 w-4" /> Configuracion
        </button>
      )}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-clay-600 hover:bg-clay-50 transition-colors"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesion
      </button>
    </div>
  );

  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-earth-50 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-grove-600 text-white text-xs font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <ChevronDown className="h-3 w-3 text-earth-400" />
        </button>
        {open && dropdown}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-earth-50 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-grove-600 text-white text-sm font-bold flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-earth-800 truncate">{name}</p>
          <p className="text-xs text-earth-500 truncate">Cuenta local</p>
        </div>
        <ChevronDown className="h-4 w-4 text-earth-400 flex-shrink-0" />
      </button>
      {open && dropdown}
    </div>
  );
}
