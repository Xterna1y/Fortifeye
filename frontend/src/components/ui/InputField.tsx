import type { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leading?: ReactNode;
}

export default function InputField({
  className,
  error,
  helperText,
  id,
  label,
  leading,
  ...props
}: InputFieldProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            {leading}
          </div>
        )}
        <input
          id={id}
          className={clsx(
            'w-full rounded-xl border bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none',
            leading ? 'pl-11' : 'pl-4',
            error
              ? 'border-red-500/50 focus:border-red-400'
              : 'border-slate-600/60 focus:border-cyan-500',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-300">{error}</p>
      ) : helperText ? (
        <p className="mt-2 text-sm text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
