import { useState, useEffect, useCallback } from 'react';
import type { AppData, FarmConfig } from '@/types';

const LEGACY_STORAGE_KEY = 'agro360_data_v1';
const LEGACY_CLAIM_KEY = 'agro360_legacy_claimed';

function storageKeyFor(userId: string): string {
  return `${LEGACY_STORAGE_KEY}:${userId}`;
}

export const defaultFarmConfig: FarmConfig = {
  farmName: 'Mi Finca',
  location: '',
  size: 0,
  modules: { coffee: true, rice: true, cacao: true },
  lastBackup: null,
};

export const defaultData: AppData = {
  farmConfig: defaultFarmConfig,
  coffeeDiagnoses: [],
  coffeeHarvests: [],
  ricePlots: [],
  riceHarvests: [],
  cacaoLots: [],
  cacaoHarvests: [],
  cacaoDiagnoses: [],
  cacaoManagement: [],
  events: [],
  economicRecords: [],
  carbonRecords: [],
};

function loadLocal(userId: string): AppData {
  try {
    let stored = localStorage.getItem(storageKeyFor(userId));
    if (!stored && !localStorage.getItem(LEGACY_CLAIM_KEY)) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        stored = legacy;
        localStorage.setItem(LEGACY_CLAIM_KEY, userId);
      }
    }
    if (stored) {
      const parsed = JSON.parse(stored) as AppData;
      return { ...defaultData, ...parsed };
    }
  } catch {
    // ignore corrupted storage
  }
  return defaultData;
}

export function useAppData(userId: string) {
  const [data, setData] = useState<AppData>(() => loadLocal(userId));
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFor(userId), JSON.stringify(data));
    } catch {
      // storage full or unavailable
    }
  }, [data]);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData(updater);
  }, []);

  const resetData = useCallback(() => {
    setData(defaultData);
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppData;
      setData({ ...defaultData, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { data, update, isOnline, resetData, exportData, importData };
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
