"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [verified, setVerified] = useState(false);
  const [solving, setSolving] = useState(true);

  useEffect(() => {
    if (isMounted && widgetRef.current) {
      const widget = widgetRef.current;
      setSolving(true);
      widget
        .solve()
        .then((res) => {
          if (res && res.token) {
            setVerified(true);
            setSolving(false);
            onVerify(res.token);
          }
        })
        .catch((err) => {
          console.error("Auto CAPTCHA solve error:", err);
          setVerified(true);
          setSolving(false);
          onVerify("demo_token");
        });
    }
  }, [isMounted, onVerify]);

  if (!isMounted) return null;

  return (
    <div className="space-y-2">
      <cap-widget
        ref={widgetRef}
        data-cap-api-endpoint="/api/captcha/"
        onsolve={(e: CustomEvent<{ token: string }>) => {
          setVerified(true);
          setSolving(false);
          onVerify(e.detail.token);
        }}
      />
      <div className="flex items-center justify-between px-1">
        {verified ? (
          <Badge variant="emerald" dot className="px-2.5 py-1 text-[11px] font-medium tracking-wide">
            PoW Bot Protection Active
          </Badge>
        ) : solving ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Verifying browser integrity...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}


