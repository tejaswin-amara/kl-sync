import * as React from 'react';
import { Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        data-loading={isLoading || undefined}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer',
          'duration-[--duration-normal]',
          // Variants
          variant === 'default' &&
            'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 border border-primary/30',
          variant === 'primary' &&
            'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 border border-primary/30',
          variant === 'secondary' &&
            'bg-surface-2 hover:bg-surface-3 text-foreground border border-border shadow-xs',
          variant === 'ghost' &&
            'hover:bg-white/8 text-muted-foreground hover:text-foreground',
          variant === 'outline' &&
            'border border-border bg-transparent hover:bg-surface-2 text-muted-foreground hover:text-foreground',
          variant === 'destructive' &&
            'bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 border border-destructive/30',
          // Sizes
          size === 'default' && 'min-h-[44px] px-4 py-2.5 text-sm rounded-[--radius-md] gap-2',
          size === 'sm' && 'min-h-[44px] px-3 py-1.5 text-xs rounded-[--radius-sm] gap-1.5',
          size === 'lg' && 'min-h-[48px] px-6 py-3 text-[0.9375rem] rounded-[--radius-lg] gap-2.5',
          size === 'icon' && 'min-h-[44px] min-w-[44px] p-2.5 rounded-[--radius-md] justify-center',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
