import { useState, useEffect, useCallback } from 'react';

export interface UserSettings {
  displayName: string;
  language: 'es' | 'en' | 'pt';
  units: 'metric' | 'imperial';
  temperatureUnit: 'celsius' | 'fahrenheit';
  notifications: {
    weatherAlerts: boolean;
    fungalRisk: boolean;
    events: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

const SETTINGS_KEY = 'agro360_user_settings';

const defaultSettings: UserSettings = {
  displayName: '',
  language: 'es',
  units: 'metric',
  temperatureUnit: 'celsius',
  notifications: {
    weatherAlerts: true,
    fungalRisk: true,
    events: true,
  },
  theme: 'light',
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed, notifications: { ...defaultSettings.notifications, ...(parsed.notifications ?? {}) } };
  } catch {
    return defaultSettings;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // storage full
    }
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const updateNotificationSetting = useCallback((key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return { settings, updateSettings, updateNotificationSetting, resetSettings };
}
