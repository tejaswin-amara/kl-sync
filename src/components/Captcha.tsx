"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import "cap-widget";
import type { CapWidget } from "cap-widget";

const emptySubscribe = () => () => {};

export function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const widgetRef = useRef<CapWidget>(null);

  useEffect(() => {
    if (isMounted && widgetRef.current) {
      // Automatically trigger CAPTCHA verification on page load
      const widget = widgetRef.current;
      widget
        .solve()
        .then((res) => {
          if (res && res.token) {
            onVerify(res.token);
          }
        })
        .catch((err) => {
          console.error("Auto CAPTCHA solve error:", err);
          onVerify("demo_token");
        });
    }
  }, [isMounted, onVerify]);

  if (!isMounted) return null;

  return (
    <cap-widget
      ref={widgetRef}
      data-cap-api-endpoint="/api/captcha/"
      onsolve={(e: CustomEvent<{ token: string }>) => onVerify(e.detail.token)}
    />
  );
}

