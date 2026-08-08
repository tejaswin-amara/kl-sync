import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
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

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, pulse, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold tracking-wide rounded-full border transition-all select-none',
          // Size scale
          size === 'sm' && 'text-[10px] px-2 py-0.5',
          size === 'md' && 'text-[11px] px-2.5 py-1',
          size === 'lg' && 'text-xs px-3 py-1.5',

          // Variants
          variant === 'default' && 'bg-surface-2 text-zinc-300 border-border',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground border-border',
          variant === 'success' && 'bg-success/10 text-success border-success/20',
          variant === 'warning' && 'bg-warning/10 text-amber-300 border-warning/20',
          variant === 'danger' && 'bg-destructive/10 text-red-300 border-destructive/20',
          variant === 'info' && 'bg-primary/10 text-indigo-300 border-primary/20',
          variant === 'outline' && 'bg-transparent text-zinc-300 border-border',
          variant === 'emerald' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          variant === 'present' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          variant === 'absent' && 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          variant === 'pending' && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          variant === 'neutral' && 'bg-zinc-800 text-zinc-300 border-zinc-700',
          variant === 'glass' && 'glass-card text-foreground border-white/10 shadow-xs',

          // Pulse animation container
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
              variant === 'success' || variant === 'emerald' || variant === 'present' ? 'bg-success' :
              variant === 'warning' || variant === 'pending' ? 'bg-warning' :
              variant === 'danger' || variant === 'absent' ? 'bg-destructive' :
              variant === 'info' ? 'bg-primary' :
              'bg-muted-foreground'
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

export { Badge };
