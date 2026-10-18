import type { Page } from '@/types';
import type { LocalUser } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Coffee, Wheat, Beef, Tractor, Sparkles, TrendingUp, Leaf, Settings, BookOpenText } from 'lucide-react';
import { UserProfile } from '@/components/UserProfile';

interface NavItem {
  id: Page;
  labelKey: string;
  shortKey: string;
  icon: typeof LayoutDashboard;
  color: string;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.dashboard', icon: LayoutDashboard, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
  { id: 'coffee', labelKey: 'nav.coffee', shortKey: 'nav.coffee', icon: Coffee, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-harvest-700 bg-harvest-100 dark:text-harvest-300 dark:bg-harvest-800/50' },
  { id: 'rice', labelKey: 'nav.rice', shortKey: 'nav.rice', icon: Wheat, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-800/50' },
  { id: 'livestock', labelKey: 'nav.livestock', shortKey: 'nav.livestock', icon: Beef, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-clay-700 bg-clay-100 dark:text-clay-300 dark:bg-clay-800/50' },
  { id: 'economics', labelKey: 'nav.economics', shortKey: 'nav.economics', icon: TrendingUp, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
  { id: 'carbon', labelKey: 'nav.carbon', shortKey: 'nav.carbon', icon: Leaf, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
  { id: 'myfarm', labelKey: 'nav.myfarm', shortKey: 'nav.myfarm', icon: Tractor, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
  { id: 'assistant', labelKey: 'nav.assistant', shortKey: 'nav.assistant', icon: Sparkles, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
  { id: 'docs', labelKey: 'nav.docs', shortKey: 'nav.docs', icon: BookOpenText, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
  { id: 'settings', labelKey: 'nav.settings', shortKey: 'nav.settings', icon: Settings, color: 'text-earth-500 dark:text-earth-400', activeColor: 'text-grove-700 bg-grove-100 dark:text-grove-300 dark:bg-grove-800/50' },
];

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  farmName: string;
  user: LocalUser;
}

export function Sidebar({ current, onNavigate, farmName, user }: SidebarProps) {
  const { t } = useI18n();
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-earth-200/60 bg-white z-30 dark:border-earth-700/40 dark:bg-earth-800 transition-colors duration-300">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-earth-100 dark:border-earth-700">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-grove-600 text-white shadow-sm">
          <svg viewBox="0 0 64 64" className="h-7 w-7" fill="currentColor">
            <path d="M32 14c-7 8-7 18 0 26 7-8 7-18 0-26z" opacity="0.8" />
            <path d="M32 14c-4 5-5 11-5 16 0 4 1 7 5 10 4-3 5-6 5-10 0-5-1-11-5-16z" opacity="0.6" />
            <path d="M20 40c2-2 5-2 7 0s5 2 7 0 5-2 7 0c1 1 1 3 0 4-2 2-5 2-7 0s-5-2-7 0-5 2-7 0c-1-1-1-3 0-4z" />
            <circle cx="32" cy="46" r="3" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-earth-900 leading-tight dark:text-earth-100">AgroSinergia</h1>
          <p className="text-xs text-grove-600 font-semibold dark:text-grove-400">360</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active ? item.activeColor : `${item.color} hover:bg-earth-50 dark:hover:bg-earth-700/50`
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        <div className="rounded-xl bg-earth-50 p-3 border border-earth-100 dark:bg-earth-700/50 dark:border-earth-600">
          <p className="text-xs font-medium text-earth-500 uppercase tracking-wide dark:text-earth-400">Finca Actual</p>
          <p className="mt-0.5 text-sm font-bold text-earth-800 truncate dark:text-earth-100">{farmName}</p>
        </div>
        <UserProfile user={user} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}

interface BottomNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  const { t } = useI18n();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-earth-200/60 safe-bottom dark:bg-earth-800 dark:border-earth-700/40 transition-colors duration-300">
      <div className="flex items-center justify-between gap-1 overflow-x-auto px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 min-w-[58px] transition-all duration-200 ${
                active ? item.activeColor : 'text-earth-400 dark:text-earth-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{t(item.shortKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface MobileHeaderProps {
  current: Page;
  farmName: string;
  user: LocalUser;
  onNavigate: (page: Page) => void;
}

export function MobileHeader({ current, farmName, user, onNavigate }: MobileHeaderProps) {
  const { t } = useI18n();
  const titles: Record<Page, string> = {
    dashboard: 'AgroSinergia 360',
    coffee: t('nav.coffee'),
    rice: t('nav.rice'),
    livestock: t('nav.livestock'),
    economics: t('nav.economics'),
    carbon: t('nav.carbon'),
    myfarm: t('nav.myfarm'),
    assistant: t('nav.assistant'),
    docs: t('nav.docs'),
    settings: t('nav.settings'),
  };
  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-earth-100 px-4 py-3 dark:bg-earth-800/95 dark:border-earth-700/40 transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-grove-600 text-white">
          <svg viewBox="0 0 64 64" className="h-5 w-5" fill="currentColor">
            <path d="M32 14c-7 8-7 18 0 26 7-8 7-18 0-26z" opacity="0.8" />
            <path d="M20 40c2-2 5-2 7 0s5 2 7 0 5-2 7 0c1 1 1 3 0 4-2 2-5 2-7 0s-5-2-7 0-5 2-7 0c-1-1-1-3 0-4z" />
            <circle cx="32" cy="46" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-earth-900 leading-tight truncate dark:text-earth-100">{titles[current]}</h1>
          <p className="text-[11px] text-earth-500 truncate dark:text-earth-400">{farmName}</p>
        </div>
        <UserProfile user={user} compact onNavigate={onNavigate} />
      </div>
    </header>
  );
}
