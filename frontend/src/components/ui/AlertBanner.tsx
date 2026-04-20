import type { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type AlertTone = 'success' | 'error' | 'warning' | 'info';

interface AlertBannerProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

const config = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  },
  error: {
    icon: XCircle,
    className: 'border-red-500/30 bg-red-500/10 text-red-100',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  },
  info: {
    icon: Info,
    className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
  },
} as const;

export default function AlertBanner({
  children,
  title,
  tone = 'info',
}: AlertBannerProps) {
  const { icon: Icon, className } = config[tone];

  return (
    <div className={clsx('rounded-xl border px-4 py-3', className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          {title && <p className="font-medium">{title}</p>}
          <div className="text-sm opacity-95">{children}</div>
        </div>
      </div>
    </div>
  );
}
