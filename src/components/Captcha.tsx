'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Loader2, RefreshCw } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import type { CapWidget } from 'cap-widget';
import { triggerHaptic } from '@/lib/fluid-motion';

const emptySubscribe = () => () => {};

export function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const widgetRef = useRef<CapWidget>(null);
  const [verified, setVerified] = useState(false);
  const [solving, setSolving] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isMounted) return;

    let cancelled = false;
    let detachListeners = () => {};

    setVerified(false);
    setFailed(false);
    setSolving(true);

    void import('cap-widget')
      .then(() => {
        if (cancelled) return;

        const widget = widgetRef.current;
        if (!widget) {
          setSolving(false);
          setFailed(true);
          onVerify('');
          return;
        }

        let completed = false;
        const handleSolve = (event: Event) => {
          const customEvent = event as CustomEvent<{ token?: string }>;
          const token = customEvent.detail?.token;
          if (!token || completed || cancelled) return;

          completed = true;
          setVerified(true);
          setFailed(false);
          setSolving(false);
          triggerHaptic('success');
          onVerify(token);
        };

        const handleError = (event: Event) => {
          if (completed || cancelled) return;
          console.warn('[CAPTCHA] Browser verification widget failed:', event);
          setVerified(false);
          setFailed(true);
          setSolving(false);
          onVerify('');
        };

        widget.addEventListener('solve', handleSolve);
        widget.addEventListener('error', handleError);
        detachListeners = () => {
          widget.removeEventListener('solve', handleSolve);
          widget.removeEventListener('error', handleError);
        };

        void widget
          .solve()
          .then((result) => {
            if (result?.token) {
              handleSolve(
                new CustomEvent('solve', { detail: { token: result.token } })
              );
            }
          })
          .catch((error: unknown) => {
            if (cancelled || completed) return;
            console.warn('[CAPTCHA] Browser verification could not be solved:', error);
            setVerified(false);
            setFailed(true);
            setSolving(false);
            onVerify('');
          });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('[CAPTCHA] Failed to load verification widget:', error);
        setVerified(false);
        setFailed(true);
        setSolving(false);
        onVerify('');
      });

    return () => {
      cancelled = true;
      detachListeners();
    };
  }, [isMounted, onVerify]);

  if (!isMounted) return null;

  return (
    <div
      className="grid w-full min-w-0 place-items-center gap-2 overflow-visible py-1"
      role="group"
      aria-label="Browser security verification"
    >
      <cap-widget
        ref={widgetRef}
        data-cap-api-endpoint="/api/captcha/"
        data-cap-i18n-group-aria-label="Browser security verification"
        data-cap-i18n-verify-aria-label="Verify that you are human"
        className="block w-full max-w-[260px] min-w-0"
        style={
          {
            '--cap-widget-width': 'min(100%, 260px)',
            '--cap-widget-height': '58px',
            '--cap-background': '#121820',
            '--cap-border-color': '#64748b',
            '--cap-border-radius': '12px',
            '--cap-color': '#f4f7fb',
            '--cap-focus-ring': '#a3a6ff',
            '--cap-checkbox-border': '1px solid #9aa9ba',
            '--cap-checkbox-background': '#1b2530',
            '--cap-spinner-color': '#f4f7fb',
            '--cap-spinner-background-color': '#475569',
            '--cap-troubleshoot-color': '#c6c8ff',
          } as React.CSSProperties
        }
      />
      <div className="flex min-h-6 w-full items-center justify-center px-1">
        {verified ? (
          <Badge
            variant="emerald"
            dot
            className="px-2.5 py-1 text-[11px] font-medium tracking-wide apple-pill"
          >
            Browser verification complete
          </Badge>
        ) : solving ? (
          <div
            className="flex items-center gap-2 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin text-primary" />
            <span>Verifying browser integrity…</span>
          </div>
        ) : failed ? (
          <div
            className="flex items-center gap-2 text-center text-xs text-error"
            role="status"
            aria-live="polite"
          >
            <span>Browser verification failed. Refresh the security code to retry.</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground" role="status">
            Complete browser verification to sign in.
          </span>
        )}
      </div>
    </div>
  );
}
