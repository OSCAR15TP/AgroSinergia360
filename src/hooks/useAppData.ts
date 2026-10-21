import { useState, useEffect, useCallback } from 'react';
import type { AppData, FarmConfig } from '@/types';

const STORAGE_KEY = 'agro360_data_v1';

export const defaultFarmConfig: FarmConfig = {
  farmName: 'Mi Finca',
  location: '',
  size: 0,
  modules: { coffee: true, rice: true, livestock: true },
  lastBackup: null,
};

export const defaultData: AppData = {
  farmConfig: defaultFarmConfig,
  coffeeDiagnoses: [],
  ricePlots: [],
  cattle: [],
  paddocks: [],
  events: [],
  economicRecords: [],
  carbonRecords: [],
};

function loadLocal(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppData;
      return { ...defaultData, ...parsed };
    }
  } catch {
    // ignore corrupted storage
  }
  return defaultData;
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadLocal);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
