import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color?: 'grove' | 'harvest' | 'clay' | 'sky' | 'earth';
  trend?: string;
}

const colorMap = {
  grove: { bg: 'bg-grove-100', text: 'text-grove-700', ring: 'ring-grove-200' },
  harvest: { bg: 'bg-harvest-100', text: 'text-harvest-700', ring: 'ring-harvest-200' },
  clay: { bg: 'bg-clay-100', text: 'text-clay-700', ring: 'ring-clay-200' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
  earth: { bg: 'bg-earth-100', text: 'text-earth-700', ring: 'ring-earth-200' },
};

export function StatCard({ icon, label, value, unit, color = 'grove', trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-4 animate-slide-up">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-earth-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-earth-900">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-earth-500">{unit}</span>}
      </p>
      {trend && <p className={`mt-1 text-xs font-medium ${c.text}`}>{trend}</p>}
    </div>
  );
}
