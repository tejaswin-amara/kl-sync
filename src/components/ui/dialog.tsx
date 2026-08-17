'use client';

import * as React from 'react';
import { X } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/fluid-motion';

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
      if (value) {
        triggerHaptic('light');
      }
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      className={cn('touch-manipulation active:scale-95 transition-transform duration-[--duration-fast]', className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDialog();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Apple Translucent Dimming Scrim */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-[--duration-normal] ease-[--ease-spring-default] animate-in"
        onClick={() => {
          triggerHaptic('light');
          setOpen(false);
        }}
        aria-hidden="true"
      />
      {/* Apple Modal Body with Specular Highlight */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg apple-modal rounded-[--radius-2xl] p-6 shadow-2xl animate-spring-scale duration-[--duration-spring] ease-[--ease-spring-default]',
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setOpen(false);
          }}
          className="absolute right-4 top-4 rounded-full p-2 bg-white/6 hover:bg-white/12 text-muted-foreground hover:text-foreground transition-all duration-[--duration-fast] active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-tight tracking-[-0.015em] text-foreground font-heading', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-muted-foreground/90 leading-relaxed font-normal', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-border/40', className)}
      {...props}
    />
  );
}

export function DialogClose({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      className={cn('touch-manipulation active:scale-95 transition-transform duration-[--duration-fast]', className)}
      onClick={() => {
        triggerHaptic('light');
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
