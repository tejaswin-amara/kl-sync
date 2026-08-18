'use client';

import React, { useState } from 'react';
import { COMPLIANCE_BADGES, ComplianceBadge } from '@/lib/compliance/compliance-data';
import { exportAllUserData, purgeAllUserData } from '@/lib/compliance/compliance-manager';
import { useI18n, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { triggerHaptic } from '@/lib/fluid-motion';
import {
  ShieldCheck,
  Download,
  Trash2,
  Globe,
  CheckCircle,
  X,
  Lock,
} from '@/components/ui/icons';

export function ComplianceBadgeBar({ onOpenModal }: { onOpenModal?: () => void }) {
  const privacyBadges = COMPLIANCE_BADGES.filter((b) => b.category === 'privacy');
  const accessibilityBadges = COMPLIANCE_BADGES.filter((b) => b.category === 'accessibility');

  return (
    <div className="w-full space-y-4 text-xs font-sans select-none">
      {/* ── Privacy & Data Section ── */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Privacy & Data</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {privacyBadges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenModal?.();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500 text-zinc-200 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label={`View compliance details for ${badge.code}`}
            >
              <span className="text-sm leading-none">{badge.flagIcon}</span>
              <span className="tracking-tight">{badge.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Accessibility & Localization Section ── */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Accessibility</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {accessibilityBadges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenModal?.();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500 text-zinc-200 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label={`View compliance details for ${badge.code}`}
            >
              <span className="text-sm leading-none text-emerald-400">{badge.flagIcon}</span>
              <span className="tracking-tight">{badge.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComplianceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { locale, changeLocale, t, isRtl } = useI18n();
  const [selectedBadge, setSelectedBadge] = useState<ComplianceBadge | null>(COMPLIANCE_BADGES[0]);
  const [activeTab, setActiveTab] = useState<'standards' | 'data-rights' | 'language'>('standards');
  const [erasureConfirming, setErasureConfirming] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compliance-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compliance-modal-title" className="text-base font-bold tracking-tight text-white">
                Global Privacy & Accessibility Center
              </h2>
              <p className="text-xs text-muted-foreground">
                GDPR • CCPA • HIPAA • PIPEDA • LGPD • DPDPA • PIPL • 152-FZ • WCAG 2.2 AAA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('standards')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'standards'
                ? 'border-primary text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Compliance Standards ({COMPLIANCE_BADGES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data-rights')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'data-rights'
                ? 'border-primary text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Data Rights & Erasure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'language'
                ? 'border-primary text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Language & RTL ({SUPPORTED_LANGUAGES.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'standards' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Badge List */}
              <div className="md:col-span-1 space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {COMPLIANCE_BADGES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedBadge(b);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                      selectedBadge?.id === b.id
                        ? 'bg-primary/15 border border-primary/40 text-white font-bold'
                        : 'bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{b.flagIcon}</span>
                      <span className="truncate">{b.code}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                      {b.category}
                    </span>
                  </button>
                ))}
              </div>

              {/* Badge Detail Panel */}
              {selectedBadge && (
                <div className="md:col-span-2 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedBadge.flagIcon}</span>
                        <h3 className="text-base font-bold text-white">{selectedBadge.code}</h3>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{selectedBadge.name} • {selectedBadge.region}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      100% Compliant
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-300">
                    {selectedBadge.summary}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      Technical Guarantees
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-400">
                      {selectedBadge.principles.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data-rights' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Download className="w-4 h-4 text-primary" />
                  <h3>Right to Data Portability (GDPR Art. 20 / CCPA / DPDPA)</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You have the legal right to receive all personal data, cached academic records, attendance history, and session metadata stored locally on your device in a structured, commonly used, and machine-readable JSON format.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    exportAllUserData();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {t('exportData', 'Download JSON Data Export')}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <h3>Right to Erasure / &quot;Forget Me&quot; (GDPR Art. 17 / LGPD / DPDPA)</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Instantly purges all cookies, sessionStorage, localStorage, cached academic records, credentials, and cryptographic keys from your browser with zero server residue.
                </p>
                {!erasureConfirming ? (
                  <button
                    type="button"
                    onClick={() => setErasureConfirming(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('eraseData', 'Permanently Erase All My Data')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-spring-up">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('error');
                        purgeAllUserData();
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg"
                    >
                      Confirm: Delete Everything & Log Out
                    </button>
                    <button
                      type="button"
                      onClick={() => setErasureConfirming(false)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Choose your preferred language. Selecting Arabic will automatically mirror the UI layout to Right-to-Left (RTL) mode.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      changeLocale(lang.code);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all ${
                      locale === lang.code
                        ? 'bg-primary/15 border-primary text-white font-bold shadow-sm'
                        : 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <div>
                        <div className="font-semibold">{lang.nativeName}</div>
                        <div className="text-[10px] text-zinc-400">{lang.name}</div>
                      </div>
                    </div>
                    {lang.dir === 'rtl' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
                        RTL
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
          <span>Direction: <strong className="text-white uppercase font-mono">{isRtl ? 'RTL' : 'LTR'}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
