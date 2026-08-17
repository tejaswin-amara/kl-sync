import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'destructive'
    | 'info'
    | 'outline'
    | 'emerald'
    | 'present'
    | 'absent'
    | 'pending'
    | 'neutral'
    | 'glass';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default: 'bg-surface-2 text-zinc-300 border-border',
  secondary: 'bg-secondary text-secondary-foreground border-border',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-amber-300 border-warning/20',
  danger: 'bg-destructive/10 text-red-300 border-destructive/20',
  destructive: 'bg-destructive/10 text-red-300 border-destructive/20',
  info: 'bg-primary/10 text-indigo-300 border-primary/20',
  outline: 'bg-transparent text-zinc-300 border-border',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  present: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  absent: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  neutral: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  glass: 'glass-card text-foreground border-white/10 shadow-xs',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-[11px] px-2.5 py-1',
  lg: 'text-xs px-3 py-1.5',
};

const dotColorStyles: Record<string, string> = {
  success: 'bg-success',
  emerald: 'bg-success',
  present: 'bg-success',
  warning: 'bg-warning',
  pending: 'bg-warning',
  danger: 'bg-destructive',
  destructive: 'bg-destructive',
  absent: 'bg-destructive',
  info: 'bg-primary',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, pulse, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold tracking-wide rounded-full border transition-all select-none',
          sizeStyles[size],
          variantStyles[variant],
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              pulse && 'animate-ping',
              dotColorStyles[variant] || 'bg-muted-foreground'
            )}
          />
        )}
        {icon && <span className="shrink-0 flex items-center">{icon}</span>}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
