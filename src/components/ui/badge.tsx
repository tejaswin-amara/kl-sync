import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'emerald'
    | 'warning'
    | 'amber'
    | 'error'
    | 'red'
    | 'info'
    | 'indigo';
  dot?: boolean;
}

function Badge({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-200 border-white/10',
    secondary: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    outline: 'border-zinc-700 text-zinc-300 bg-transparent',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  };

  const dotColorStyles = {
    success: 'bg-emerald-400',
    emerald: 'bg-emerald-400',
    warning: 'bg-amber-400',
    amber: 'bg-amber-400',
    error: 'bg-red-400',
    red: 'bg-red-400',
    info: 'bg-indigo-400',
    indigo: 'bg-indigo-400',
    default: 'bg-zinc-400',
    secondary: 'bg-zinc-500',
    outline: 'bg-zinc-400',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            dotColorStyles[variant]
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge };
