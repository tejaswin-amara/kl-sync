'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  return (
    <TooltipContext.Provider value={{ open, setOpen, id }}>
      <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { setOpen, open, id } = useTooltipContext();

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-describedby={open ? id : undefined}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className={cn('inline-flex items-center cursor-pointer focus:outline-hidden', className)}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'top', children, ...props }, ref) => {
    const { open, id } = useTooltipContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        id={id}
        role="tooltip"
        className={cn(
          'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-foreground bg-surface-3 border border-border rounded-md shadow-md animate-scale-in whitespace-nowrap pointer-events-none',
          side === 'top' && 'bottom-full mb-2 left-1/2 -translate-x-1/2',
          side === 'bottom' && 'top-full mt-2 left-1/2 -translate-x-1/2',
          side === 'left' && 'right-full mr-2 top-1/2 -translate-y-1/2',
          side === 'right' && 'left-full ml-2 top-1/2 -translate-y-1/2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';
