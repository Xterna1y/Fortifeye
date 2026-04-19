import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

type PaddingSize = 'sm' | 'md' | 'lg';

const paddingClasses: Record<PaddingSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

interface GlassPanelProps extends PropsWithChildren {
  className?: string;
  padding?: PaddingSize;
  title?: string;
  description?: string;
  titleAction?: ReactNode;
}

export default function GlassPanel({
  children,
  className,
  padding = 'md',
  title,
  description,
  titleAction,
}: GlassPanelProps) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl',
        paddingClasses[padding],
        className,
      )}
    >
      {(title || description || titleAction) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          {titleAction}
        </div>
      )}
      {children}
    </section>
  );
}
