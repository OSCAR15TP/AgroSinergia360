import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

const config: Record<AlertType, { icon: typeof Info; bg: string; border: string; text: string; title: string }> = {
  success: { icon: CheckCircle, bg: 'bg-grove-50', border: 'border-grove-300', text: 'text-grove-800', title: 'text-grove-900' },
  warning: { icon: AlertTriangle, bg: 'bg-harvest-50', border: 'border-harvest-300', text: 'text-harvest-800', title: 'text-harvest-900' },
  danger: { icon: AlertCircle, bg: 'bg-clay-50', border: 'border-clay-300', text: 'text-clay-800', title: 'text-clay-900' },
  info: { icon: Info, bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-800', title: 'text-sky-900' },
};

export function Alert({ type, title, children, onClose }: AlertProps) {
  const c = config[type];
  const Icon = c.icon;
  return (
    <div className={`flex gap-3 rounded-xl border ${c.bg} ${c.border} p-4 animate-slide-down`}>
      <Icon className={`h-5 w-5 flex-shrink-0 ${c.text}`} />
      <div className="flex-1">
        {title && <p className={`text-sm font-bold ${c.title}`}>{title}</p>}
        <div className={`text-sm ${c.text}`}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className={`flex-shrink-0 ${c.text} hover:opacity-70`}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
