'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Globe, Check } from '@/components/ui/icons';
import { triggerHaptic } from '@/lib/fluid-motion';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, changeLocale, currentLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setOpen(!open);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-2/80 hover:bg-surface-3 border border-white/10 text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="font-semibold uppercase tracking-wider text-[11px]">
          {currentLanguage.code}
        </span>
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-48 py-1 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl z-50 animate-spring-scale max-h-64 overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                changeLocale(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                locale === lang.code
                  ? 'bg-primary/20 text-white font-bold'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </div>
              {locale === lang.code && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
