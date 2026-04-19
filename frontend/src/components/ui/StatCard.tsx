import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import GlassPanel from './GlassPanel';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  iconWrapperClassName?: string;
  valueClassName?: string;
  className?: string;
  trailing?: React.ReactNode;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  valueClassName,
  className,
  trailing,
}: StatCardProps) {
  return (
    <GlassPanel padding="md" className={clsx('transition-all hover:border-slate-600/50', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/60', iconWrapperClassName)}>
            <Icon className={clsx('h-6 w-6 text-cyan-400', iconClassName)} />
          </div>
          <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className={clsx('text-2xl font-bold text-white', valueClassName)}>{value}</p>
          </div>
        </div>
        {trailing}
      </div>
    </GlassPanel>
  );
}
