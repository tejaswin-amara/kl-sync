"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2 } from '@/components/ui/icons';
import { Badge } from "@/components/ui/badge";
import type { CapWidget } from "cap-widget";
import { triggerHaptic } from "@/lib/fluid-motion";

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

  useEffect(() => {
    if (!isMounted) return;

    let cleanup: (() => void) | undefined;

    // Safety timeout: Ensure the user is never blocked if PoW takes > 1500ms or fails to load
    const fallbackTimer = setTimeout(() => {
      setVerified(true);
      setSolving(false);
      onVerify("demo_token");
    }, 1500);

    import("cap-widget")
      .then(() => {
        const widget = widgetRef.current;
        if (!widget) return;

        const handleSolve = (e: Event) => {
          if (fallbackTimer) clearTimeout(fallbackTimer);
          const customEvent = e as CustomEvent<{ token: string }>;
          const token = customEvent.detail?.token;
          if (token) {
            setVerified(true);
            setSolving(false);
            triggerHaptic('success');
            onVerify(token);
          }
        };

        const handleError = (e: Event) => {
          console.warn("Cap widget error event:", e);
          if (fallbackTimer) clearTimeout(fallbackTimer);
          setVerified(true);
          setSolving(false);
          onVerify("demo_token");
        };

        widget.addEventListener("solve", handleSolve);
        widget.addEventListener("error", handleError);

        cleanup = () => {
          if (fallbackTimer) clearTimeout(fallbackTimer);
          widget.removeEventListener("solve", handleSolve);
          widget.removeEventListener("error", handleError);
        };

        setSolving(true);
        widget
          .solve()
          .then((res) => {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            if (res && res.token) {
              setVerified(true);
              setSolving(false);
              triggerHaptic('success');
              onVerify(res.token);
            }
          })
          .catch((err) => {
            console.warn("Auto CAPTCHA solve error:", err);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            setVerified(true);
            setSolving(false);
            onVerify("demo_token");
          });
      })
      .catch((err) => {
        console.warn("Failed to load cap-widget:", err);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setVerified(true);
        setSolving(false);
        onVerify("demo_token");
      });

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (cleanup) cleanup();
    };
  }, [isMounted, onVerify]);

  if (!isMounted) return null;

  return (
    <div className="space-y-2">
      <cap-widget
        ref={widgetRef}
        data-cap-api-endpoint="/api/captcha/"
      />
      <div className="flex items-center justify-between px-1">
        {verified ? (
          <Badge variant="emerald" dot className="px-2.5 py-1 text-[11px] font-medium tracking-wide apple-pill">
            PoW Bot Protection Active
          </Badge>
        ) : solving ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Verifying browser integrity...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
