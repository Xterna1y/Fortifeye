import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90 shadow-lg shadow-cyan-950/30',
  secondary:
    'border border-slate-700/70 bg-slate-900/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800/80',
  danger:
    'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20',
  ghost:
    'border border-transparent bg-transparent text-slate-300 hover:border-slate-700/60 hover:bg-slate-800/60 hover:text-white',
};

export default function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
