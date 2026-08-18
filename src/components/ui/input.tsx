import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', leftIcon, rightIcon, error, ...props }, ref) => (
  <div className="relative flex w-full items-center">
    {leftIcon && <div className="pointer-events-none absolute left-3.5 flex items-center text-muted-foreground">{leftIcon}</div>}
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex min-h-[48px] w-full rounded-[--radius-md] border bg-surface-1 px-4 py-3 text-sm tracking-[-0.01em] text-foreground shadow-xs',
        'border-input placeholder:text-muted-foreground/65',
        'transition-[border-color,box-shadow,background-color] duration-[--duration-fast] ease-[--ease-spring-default]',
        'hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-45',
        leftIcon && 'pl-10', rightIcon && 'pr-10',
        error && 'border-destructive focus-visible:ring-destructive/30', className
      )}
      aria-invalid={error || undefined}
      {...props}
    />
    {rightIcon && <div className="pointer-events-none absolute right-3.5 flex items-center text-muted-foreground">{rightIcon}</div>}
  </div>
));
Input.displayName = 'Input';

export { Input };
