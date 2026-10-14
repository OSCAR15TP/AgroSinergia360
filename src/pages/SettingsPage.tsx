import type { Page } from '@/types';
import type { LocalUser } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';
import { useSettings, type UserSettings } from '@/hooks/useSettings';
import { useI18n } from '@/lib/i18n';
import { Modal } from '@/components/Modal';
import { useState } from 'react';
import {
  Settings as SettingsIcon, Globe, Ruler, Thermometer,
  Bell, Sun, Moon, Monitor, LogOut, Trash2,
  Languages, Clock, Info, Recycle, AlertCircle,
} from 'lucide-react';

interface SettingsPageProps {
  user: LocalUser;
  onNavigate: (page: Page) => void;
}

export function SettingsPage({ user, onNavigate }: SettingsPageProps) {
  const { signOut } = useAuth();
  const { settings, updateSettings, updateNotificationSetting, resetSettings } = useSettings();
  const { t } = useI18n();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const name = user.fullName;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md dark:bg-grove-500">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">{t('settings.title')}</h1>
          <p className="text-sm text-earth-500 dark:text-earth-400">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-grove-600 text-white text-2xl font-bold flex-shrink-0 dark:bg-grove-500">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-earth-900 truncate dark:text-earth-100">{name}</h2>
            <p className="text-sm text-earth-500 truncate dark:text-earth-400">
              {t('settings.about')} · {new Date(user.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Language */}
      <SettingsSection icon={<Globe className="h-4 w-4" />} title={t('settings.language')}>
        <OptionRow
          icon={<Languages className="h-4 w-4 text-earth-400" />}
          label={t('settings.language_label')}
          description={t('settings.language_desc')}
        >
          <select
            value={settings.language}
            onChange={e => updateSettings({ language: e.target.value as UserSettings['language'] })}
            className="rounded-lg border border-earth-200 bg-white px-3 py-1.5 text-sm font-semibold text-earth-800 focus:outline-none focus:ring-2 focus:ring-grove-200 dark:border-earth-600 dark:bg-earth-700 dark:text-earth-100"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </OptionRow>
      </SettingsSection>

      {/* Units */}
      <SettingsSection icon={<Ruler className="h-4 w-4" />} title={t('settings.units')}>
        <OptionRow
          icon={<Thermometer className="h-4 w-4 text-earth-400" />}
          label={t('settings.temp_unit')}
          description={t('settings.temp_desc')}
        >
          <select
            value={settings.temperatureUnit}
            onChange={e => updateSettings({ temperatureUnit: e.target.value as UserSettings['temperatureUnit'] })}
            className="rounded-lg border border-earth-200 bg-white px-3 py-1.5 text-sm font-semibold text-earth-800 focus:outline-none focus:ring-2 focus:ring-grove-200 dark:border-earth-600 dark:bg-earth-700 dark:text-earth-100"
          >
            <option value="celsius">Celsius (°C)</option>
            <option value="fahrenheit">Fahrenheit (°F)</option>
          </select>
        </OptionRow>
        <OptionRow
          icon={<Ruler className="h-4 w-4 text-earth-400" />}
          label={t('settings.unit_system')}
          description={t('settings.unit_desc')}
        >
          <select
            value={settings.units}
            onChange={e => updateSettings({ units: e.target.value as UserSettings['units'] })}
            className="rounded-lg border border-earth-200 bg-white px-3 py-1.5 text-sm font-semibold text-earth-800 focus:outline-none focus:ring-2 focus:ring-grove-200 dark:border-earth-600 dark:bg-earth-700 dark:text-earth-100"
          >
            <option value="metric">Métrico</option>
            <option value="imperial">Imperial</option>
          </select>
        </OptionRow>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={<Bell className="h-4 w-4" />} title={t('settings.notifications')}>
        <ToggleRow
          icon={<Sun className="h-4 w-4 text-sky-400" />}
          label={t('settings.weather_alerts')}
          description={t('settings.weather_alerts_desc')}
          value={settings.notifications.weatherAlerts}
          onChange={v => updateNotificationSetting('weatherAlerts', v)}
        />
        <ToggleRow
          icon={<AlertCircle className="h-4 w-4 text-harvest-400" />}
          label={t('settings.fungal_alerts')}
          description={t('settings.fungal_alerts_desc')}
          value={settings.notifications.fungalRisk}
          onChange={v => updateNotificationSetting('fungalRisk', v)}
        />
        <ToggleRow
          icon={<Clock className="h-4 w-4 text-grove-400" />}
          label={t('settings.event_alerts')}
          description={t('settings.event_alerts_desc')}
          value={settings.notifications.events}
          onChange={v => updateNotificationSetting('events', v)}
        />
      </SettingsSection>

      {/* Theme */}
      <SettingsSection icon={<Monitor className="h-4 w-4" />} title={t('settings.appearance')}>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <ThemeButton
            active={settings.theme === 'light'}
            onClick={() => updateSettings({ theme: 'light' })}
            icon={<Sun className="h-5 w-5" />}
            label={t('settings.light')}
          />
          <ThemeButton
            active={settings.theme === 'dark'}
            onClick={() => updateSettings({ theme: 'dark' })}
            icon={<Moon className="h-5 w-5" />}
            label={t('settings.dark')}
          />
          <ThemeButton
            active={settings.theme === 'auto'}
            onClick={() => updateSettings({ theme: 'auto' })}
            icon={<Monitor className="h-5 w-5" />}
            label={t('settings.auto')}
          />
        </div>
      </SettingsSection>

      {/* About */}
      <SettingsSection icon={<Info className="h-4 w-4" />} title={t('settings.about')}>
        <div className="px-4 py-3 space-y-2">
          <AboutRow label={t('settings.version')} value="1.0.0" />
          <AboutRow label={t('settings.platform')} value="AgroSinergia 360" />
          <AboutRow label={t('settings.type')} value="PWA · Gratis" />
          <div className="flex items-center gap-2 pt-2 text-xs text-earth-400 dark:text-earth-500">
            <Recycle className="h-3.5 w-3.5" />
            <span>Economía circular · Agricultura de precisión</span>
          </div>
        </div>
      </SettingsSection>

      {/* Reset settings */}
      <button
        onClick={() => {
          if (confirm('¿Restablecer toda la configuración a los valores por defecto?')) {
            resetSettings();
          }
        }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-earth-200 bg-white px-4 py-3 text-sm font-semibold text-earth-600 hover:bg-earth-50 transition-colors dark:border-earth-600 dark:bg-earth-800 dark:text-earth-300 dark:hover:bg-earth-700"
      >
        <Trash2 className="h-4 w-4" />
        {t('settings.reset')}
      </button>

      {/* Sign out */}
      <button
        onClick={() => setShowSignOutConfirm(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm font-semibold text-clay-600 hover:bg-clay-100 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        {t('settings.sign_out')}
      </button>

      <Modal open={showSignOutConfirm} onClose={() => setShowSignOutConfirm(false)} title={t('settings.sign_out')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-earth-600 dark:text-earth-300">
            {t('settings.sign_out_confirm')}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowSignOutConfirm(false)} className="btn-ghost flex-1">
              {t('settings.cancel')}
            </button>
            <button onClick={() => signOut()} className="btn-clay flex-1">
              <LogOut className="h-4 w-4" /> {t('settings.confirm')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-earth-100 bg-earth-50/50 dark:border-earth-700 dark:bg-earth-700/30">
        <span className="text-grove-600 dark:text-grove-400">{icon}</span>
        <h2 className="text-sm font-bold text-earth-800 dark:text-earth-100">{title}</h2>
      </div>
      <div className="divide-y divide-earth-100 dark:divide-earth-700">{children}</div>
    </div>
  );
}

function OptionRow({ icon, label, description, children }: { icon: React.ReactNode; label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-earth-800 dark:text-earth-100">{label}</p>
        <p className="text-xs text-earth-400 dark:text-earth-500">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({ icon, label, description, value, onChange }: { icon: React.ReactNode; label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-earth-800 dark:text-earth-100">{label}</p>
        <p className="text-xs text-earth-400 dark:text-earth-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-grove-500' : 'bg-earth-200 dark:bg-earth-600'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function ThemeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold transition-all ${
        active ? 'border-grove-400 bg-grove-50 text-grove-700 dark:bg-grove-800/50 dark:text-grove-300 dark:border-grove-500' : 'border-earth-200 text-earth-500 hover:bg-earth-50 dark:border-earth-600 dark:text-earth-400 dark:hover:bg-earth-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-earth-500 dark:text-earth-400">{label}</span>
      <span className="font-semibold text-earth-800 dark:text-earth-100">{value}</span>
    </div>
  );
}
