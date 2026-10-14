import type { ReactNode } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  unit?: string;
  color?: 'grove' | 'harvest' | 'clay' | 'sky';
  size?: 'sm' | 'md';
}

const colorMap = {
  grove: 'bg-grove-500',
  harvest: 'bg-harvest-500',
  clay: 'bg-clay-500',
  sky: 'bg-sky-500',
};

export function ProgressBar({ value, max, label, unit, color = 'grove', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-earth-600">{label}</span>
          <span className="text-xs font-bold text-earth-800">
            {value}{unit} <span className="text-earth-400 font-normal">/ {max}{unit}</span>
          </span>
        </div>
      )}
      <div className={`w-full ${h} rounded-full bg-earth-100 overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorMap[color]} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'grove' | 'harvest' | 'clay' | 'sky' | 'earth' | 'gray';
  dot?: boolean;
}

const badgeColors = {
  grove: 'bg-grove-100 text-grove-700',
  harvest: 'bg-harvest-100 text-harvest-700',
  clay: 'bg-clay-100 text-clay-700',
  sky: 'bg-sky-100 text-sky-700',
  earth: 'bg-earth-100 text-earth-700',
  gray: 'bg-gray-100 text-gray-600',
};

const dotColors = {
  grove: 'bg-grove-500',
  harvest: 'bg-harvest-500',
  clay: 'bg-clay-500',
  sky: 'bg-sky-500',
  earth: 'bg-earth-500',
  gray: 'bg-gray-400',
};

export function Badge({ children, color = 'gray', dot }: BadgeProps) {
  return (
    <span className={`badge ${badgeColors[color]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-earth-100 text-earth-400">
        {icon}
      </div>
      <h3 className="text-base font-bold text-earth-800">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-earth-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
