import * as React from 'react';
import { Loader2 } from 'lucide-react';
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
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none active-press cursor-pointer';

    const variantStyles = {
      default:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30',
      primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30',
      secondary:
        'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-white/10 shadow-sm',
      ghost:
        'hover:bg-white/10 text-zinc-300 hover:text-white',
      outline:
        'border border-zinc-700/80 bg-transparent hover:bg-zinc-800/60 text-zinc-200 hover:text-white',
      destructive:
        'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 border border-red-500/30',
    };

    const sizeStyles = {
      default: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl gap-2',
      sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
      lg: 'min-h-[48px] px-6 py-3 text-base rounded-xl gap-2.5',
      icon: 'min-h-[44px] min-w-[44px] p-2.5 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
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
