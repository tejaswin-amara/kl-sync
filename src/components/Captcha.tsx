"use client";

import { useEffect, useRef, useState } from "react";
import "cap-widget";
import type { CapWidget } from "cap-widget";

export function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const widgetRef = useRef<CapWidget>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && widgetRef.current) {
      // Automatically trigger CAPTCHA verification on page load
      const widget = widgetRef.current;
      widget.solve().then((res) => {
        if (res && res.token) {
          onVerify(res.token);
        }
      }).catch((err) => {
        console.error("Auto CAPTCHA solve error:", err);
      });
    }
  }, [mounted, onVerify]);

  if (!mounted) return null;

  return (
    <cap-widget
      ref={widgetRef}
      data-cap-api-endpoint="/api/captcha/"
      onsolve={(e: CustomEvent<{ token: string }>) => onVerify(e.detail.token)}
    />
  );
}
