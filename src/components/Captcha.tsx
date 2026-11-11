'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import type { CapWidget } from 'cap-widget';
import { triggerHaptic } from '@/lib/fluid-motion';

type CaptchaProps = {
  onVerify: (token: string) => void;
};

export function Captcha({ onVerify }: CaptchaProps) {
  const widgetRef = useRef<CapWidget>(null);
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let activeWidget: CapWidget | null = null;

    const clearVerification = () => {
      if (cancelled) return;
      setVerified(false);
      onVerify('');
    };

    const handleSolve = (event: Event) => {
      if (cancelled) return;
      const token = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (typeof token !== 'string' || token.length === 0) return;

      setVerified(true);
      setFailed(false);
      setProgress(100);
      triggerHaptic('success');
      onVerify(token);
    };

    const handleReset = () => {
      if (cancelled) return;
      setVerified(false);
      setFailed(false);
      setProgress(null);
      onVerify('');
    };

    const handleProgress = (event: Event) => {
      if (cancelled) return;
      const value = (event as CustomEvent<{ progress?: number }>).detail?.progress;
      if (typeof value === 'number' && Number.isFinite(value)) {
        setProgress(Math.max(0, Math.min(100, value)));
      }
    };

    const handleError = (event: Event) => {
      if (cancelled) return;
      const detail = (event as CustomEvent<{ code?: string; message?: string }>).detail;
      console.warn(
        '[CAPTCHA] Browser verification failed:',
        detail?.code || detail?.message || 'Unknown widget error'
      );
      setVerified(false);
      setFailed(true);
      setProgress(null);
      onVerify('');
    };

    void import('cap-widget')
      .then(() => {
        if (cancelled) return;
        const widget = widgetRef.current;
        if (!widget) {
          setFailed(true);
          setReady(true);
          onVerify('');
          return;
        }

        activeWidget = widget;
        widget.addEventListener('solve', handleSolve);
        widget.addEventListener('reset', handleReset);
        widget.addEventListener('progress', handleProgress);
        widget.addEventListener('error', handleError);
        setReady(true);

        // The widget owns its proof-of-work and user-interaction lifecycle.
        // Do not call widget.solve() here: a login page must not silently
        // auto-complete the visible human-verification control.
        const existingToken = widget.token || widget.tokenValue;
        if (existingToken) {
          handleSolve(new CustomEvent('solve', { detail: { token: existingToken } }));
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn(
          '[CAPTCHA] Verification widget could not be loaded:',
          error instanceof Error ? error.message : 'Unknown loading error'
        );
        setFailed(true);
        setReady(true);
        onVerify('');
      });

    return () => {
      cancelled = true;
      if (activeWidget) {
        activeWidget.removeEventListener('solve', handleSolve);
        activeWidget.removeEventListener('reset', handleReset);
        activeWidget.removeEventListener('progress', handleProgress);
        activeWidget.removeEventListener('error', handleError);
      }
    };
  }, [onVerify]);

  return (
    <section
      className="captcha-verification w-full min-w-0 space-y-2"
      aria-label="Browser security verification"
    >
      <div className="flex flex-col items-center gap-2">
        <cap-widget
          ref={widgetRef}
          data-cap-api-endpoint="/api/captcha/"
          data-cap-worker-count="2"
          data-cap-i18n-group-aria-label="Browser security verification"
          data-cap-i18n-verify-aria-label="Verify that you are human"
          data-cap-i18n-verifying-aria-label="Browser verification in progress"
          data-cap-i18n-verified-aria-label="Browser verification complete"
          data-cap-i18n-error-aria-label="Browser verification failed"
          data-cap-disable-haptics
          className="captcha-cap-widget"
          style={
            {
              '--cap-widget-width': 'min(100%, 260px)',
              '--cap-widget-height': '56px',
              '--cap-widget-padding': '12px',
              '--cap-gap': '12px',
              '--cap-checkbox-size': '25px',
              '--cap-checkbox-border-radius': '7px',
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
        <div className="flex min-h-6 w-full items-center justify-center text-center">
          {verified ? (
            <Badge
              variant="emerald"
              dot
              className="px-2.5 py-1 text-[11px] font-medium tracking-wide"
            >
              Browser verification complete
            </Badge>
          ) : failed ? (
            <p className="text-xs text-error" role="alert">
              Browser verification could not be completed. Refresh the security code and try again.
            </p>
          ) : !ready || progress !== null ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin text-primary" />
              {progress === null
                ? 'Loading browser verification…'
                : `Verifying browser integrity… ${Math.round(progress)}%`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground" role="status">
              Select the verification control above to continue.
            </p>
          )}
        </div>
      </div>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        This browser check is separate from the university image security code.
      </p>
    </section>
  );
}
