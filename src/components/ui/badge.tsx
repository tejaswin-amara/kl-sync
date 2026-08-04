import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'emerald';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide rounded-full px-2.5 py-1 border transition-colors',
          variant === 'default' && 'bg-surface-2 text-muted-foreground border-border',
          variant === 'success' && 'bg-success/10 text-success border-success/20',
          variant === 'warning' && 'bg-warning/10 text-warning border-warning/20',
          variant === 'danger' && 'bg-destructive/10 text-destructive border-destructive/20',
          variant === 'info' && 'bg-primary/10 text-primary border-primary/20',
          variant === 'outline' && 'bg-transparent text-muted-foreground border-border',
          variant === 'emerald' && 'bg-success/10 text-success border-success/20',
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' || variant === 'emerald' ? 'bg-success' :
            variant === 'warning' ? 'bg-warning' :
            variant === 'danger' ? 'bg-destructive' :
            variant === 'info' ? 'bg-primary' :
            'bg-muted-foreground'
          )} />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
