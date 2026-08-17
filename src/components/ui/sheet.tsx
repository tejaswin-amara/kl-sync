'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from '@/components/ui/icons';

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const SheetContext = React.createContext<SheetContextType | undefined>(undefined);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet');
  }
  return context;
}

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <SheetContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </SheetContext.Provider>
  );
}

export const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, onClick, children, ...props }, ref) => {
  const { open, setOpen } = useSheetContext();

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e);
        setOpen(!open);
      }}
      className={cn('inline-flex items-center justify-center min-w-[44px] min-h-[44px]', className)}
      {...props}
    >
      {children}
    </button>
  );
});
SheetTrigger.displayName = 'SheetTrigger';

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', children, ...props }, ref) => {
    const { open, setOpen, titleId, descriptionId } = useSheetContext();

    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          setOpen(false);
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', handleKeyDown);
        }
      };
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop Overlay */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Close drawer backdrop"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(false);
            }
          }}
          className="fixed inset-0 bg-[var(--surface-overlay)] backdrop-blur-xs transition-opacity animate-in"
        />

        {/* Drawer Body */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            'fixed z-50 gap-4 glass-panel p-6 shadow-2xl transition ease-in-out flex flex-col',
            side === 'right' && 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border animate-slide-in-right',
            side === 'left' && 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border animate-slide-in-left',
            side === 'top' && 'inset-x-0 top-0 w-full border-b border-border animate-slide-in-top',
            side === 'bottom' && 'inset-x-0 bottom-0 w-full border-t border-border animate-slide-in-bottom rounded-t-2xl',
            className
          )}
          {...props}
        >
          {children}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close drawer"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }
);
SheetContent.displayName = 'SheetContent';

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-left', className)} {...props} />;
}

export function SheetTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useSheetContext();
  return (
    <h2 id={titleId} className={cn('text-lg font-semibold text-foreground tracking-tight', className)} {...props}>
      {children}
    </h2>
  );
}

export function SheetDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useSheetContext();
  return (
    <p id={descriptionId} className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto pt-4', className)} {...props} />;
}

export function SheetClose({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheetContext();
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={cn('inline-flex items-center justify-center min-w-[44px] min-h-[44px]', className)}
      {...props}
    >
      {children}
    </button>
  );
}
