'use client';

import * as React from 'react';
import { useToast, ToastItem } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full p-4 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastSingle key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastSingle({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { variant = 'default', title, description, action } = toast;

  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in-right glass-panel transition-all',
        variant === 'default' && 'border-border bg-surface-2/95 text-foreground',
        variant === 'destructive' && 'border-destructive/30 bg-destructive/10 text-destructive-foreground',
        variant === 'success' && 'border-success/30 bg-success/10 text-emerald-300',
        variant === 'warning' && 'border-warning/30 bg-warning/10 text-amber-300',
        variant === 'info' && 'border-primary/30 bg-primary/10 text-indigo-300'
      )}
    >
      <div className="shrink-0 mt-0.5">
        {variant === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
        {variant === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
        {variant === 'destructive' && <AlertCircle className="w-5 h-5 text-destructive" />}
        {variant === 'info' && <Info className="w-5 h-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        {title && <div className="text-sm font-semibold tracking-tight">{title}</div>}
        {description && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Close notification"
        className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export { ToastSingle as Toast };
