import clsx from 'clsx';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-500/20 text-emerald-200',
  warning: 'bg-amber-500/20 text-amber-200',
  danger: 'bg-red-500/20 text-red-200',
  info: 'bg-cyan-500/20 text-cyan-200',
  neutral: 'bg-slate-700/70 text-slate-200',
};

export default function StatusBadge({
  children,
  className,
  tone = 'neutral',
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
