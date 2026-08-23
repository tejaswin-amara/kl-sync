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

  const openDetails = () => {
    triggerHaptic('light');
    onOpenModal?.();
  };

  return (
    <div className="w-full select-none space-y-4 text-xs font-sans">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span>Privacy &amp; data</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {privacyBadges.map((badge) => (
            <button key={badge.id} type="button" onClick={openDetails} className="apple-pill inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground shadow-xs active:scale-95" aria-label={`View compliance details for ${badge.code}`}>
              <span className="text-sm leading-none">{badge.flagIcon}</span>
              <span className="tracking-tight">{badge.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Globe className="h-3.5 w-3.5 text-success" />
          <span>Accessibility</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accessibilityBadges.map((badge) => (
            <button key={badge.id} type="button" onClick={openDetails} className="apple-pill inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground shadow-xs active:scale-95" aria-label={`View compliance details for ${badge.code}`}>
              <span className="text-sm leading-none text-success">{badge.flagIcon}</span>
              <span className="tracking-tight">{badge.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComplianceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { locale, changeLocale, t, isRtl } = useI18n();
  const [selectedBadge, setSelectedBadge] = useState<ComplianceBadge | null>(COMPLIANCE_BADGES[0]);
  const [activeTab, setActiveTab] = useState<'standards' | 'data-rights' | 'language'>('standards');
  const [erasureConfirming, setErasureConfirming] = useState(false);

  if (!isOpen) return null;

  const tabs = [
    { id: 'standards' as const, label: `Compliance standards (${COMPLIANCE_BADGES.length})` },
    { id: 'data-rights' as const, label: 'Data rights & erasure' },
    { id: 'language' as const, label: `Language & RTL (${SUPPORTED_LANGUAGES.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="compliance-modal-title">
      <div className="apple-modal relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden text-foreground">
        <div className="flex items-center justify-between border-b border-border bg-surface-1/90 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-[--radius-md] bg-accent p-2 text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h2 id="compliance-modal-title" className="text-base font-bold tracking-tight">Global privacy &amp; accessibility center</h2>
              <p className="text-xs text-muted-foreground">GDPR • CCPA • HIPAA • PIPEDA • LGPD • DPDPA • PIPL • 152-FZ • WCAG 2.2 AAA</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground" aria-label="Close modal"><X className="h-5 w-5" /></button>
        </div>

        <div className="custom-scrollbar flex gap-1 overflow-x-auto border-b border-border bg-surface-2/55 px-6" role="tablist" aria-label="Compliance sections">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-[48px] shrink-0 border-b-2 px-3 text-left text-xs font-semibold transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
          {activeTab === 'standards' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="custom-scrollbar max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
                {COMPLIANCE_BADGES.map((badge) => {
                  const selected = selectedBadge?.id === badge.id;
                  return (
                    <button key={badge.id} type="button" onClick={() => { triggerHaptic('selection'); setSelectedBadge(badge); }} className={`flex w-full items-center justify-between rounded-[--radius-md] border p-2.5 text-left text-xs font-medium transition-colors ${selected ? 'border-primary/35 bg-accent text-primary' : 'border-transparent bg-surface-2 text-muted-foreground hover:border-border hover:bg-surface-3 hover:text-foreground'}`}>
                      <span className="flex min-w-0 items-center gap-2"><span className="text-base leading-none">{badge.flagIcon}</span><span className="truncate">{badge.code}</span></span>
                      <span className="shrink-0 rounded-full bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">{badge.category}</span>
                    </button>
                  );
                })}
              </div>

              {selectedBadge && (
                <div className="space-y-4 rounded-[--radius-lg] border border-border bg-surface-2/65 p-5 md:col-span-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2"><span className="text-xl">{selectedBadge.flagIcon}</span><h3 className="text-base font-bold">{selectedBadge.code}</h3></div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{selectedBadge.name} • {selectedBadge.region}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success"><CheckCircle className="h-3 w-3" />100% compliant</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{selectedBadge.summary}</p>
                  <div className="space-y-2 border-t border-border pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Technical guarantees</h4>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">{selectedBadge.principles.map((principle, index) => <li key={index} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{principle}</span></li>)}</ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data-rights' && (
            <div className="space-y-6">
              <div className="space-y-3 rounded-[--radius-lg] border border-border bg-surface-2/65 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><Download className="h-4 w-4 text-primary" /><h3>Right to data portability (GDPR Art. 20 / CCPA / DPDPA)</h3></div>
                <p className="text-xs leading-relaxed text-muted-foreground">You have the legal right to receive all personal data, cached academic records, attendance history, and session metadata stored locally on your device in a structured, commonly used, and machine-readable JSON format.</p>
                <button type="button" onClick={() => { triggerHaptic('success'); exportAllUserData(); }} className="inline-flex min-h-[44px] items-center gap-2 rounded-[--radius-md] bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95"><Download className="h-4 w-4" />{t('exportData', 'Download JSON data export')}</button>
              </div>

              <div className="space-y-3 rounded-[--radius-lg] border border-error/20 bg-error/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-error"><Trash2 className="h-4 w-4" /><h3>Right to erasure / “Forget me”</h3></div>
                <p className="text-xs leading-relaxed text-muted-foreground">Instantly purges all cookies, sessionStorage, localStorage, cached academic records, credentials, and cryptographic keys from your browser with zero server residue.</p>
                {!erasureConfirming ? (
                  <button type="button" onClick={() => setErasureConfirming(true)} className="inline-flex min-h-[44px] items-center gap-2 rounded-[--radius-md] bg-error px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-sm transition-transform active:scale-95"><Trash2 className="h-4 w-4" />{t('eraseData', 'Permanently erase all my data')}</button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 animate-spring-up">
                    <button type="button" onClick={() => { triggerHaptic('error'); purgeAllUserData(); }} className="min-h-[44px] rounded-[--radius-md] bg-error px-4 py-2 text-xs font-bold text-destructive-foreground shadow-sm">Confirm: delete everything &amp; log out</button>
                    <button type="button" onClick={() => setErasureConfirming(false)} className="min-h-[44px] rounded-[--radius-md] bg-surface-3 px-3 py-2 text-xs text-foreground">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Choose your preferred language. Selecting Arabic will automatically mirror the UI layout to right-to-left (RTL) mode.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const selected = locale === lang.code;
                  return (
                    <button key={lang.code} type="button" onClick={() => { triggerHaptic('selection'); changeLocale(lang.code); }} className={`flex min-h-[68px] items-center justify-between rounded-[--radius-md] border p-3.5 text-left text-xs transition-colors ${selected ? 'border-primary bg-accent font-bold text-primary shadow-sm' : 'border-border bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground'}`}>
                      <span className="flex items-center gap-2.5"><span className="text-lg">{lang.flag}</span><span><span className="block font-semibold">{lang.nativeName}</span><span className="block text-[10px] text-muted-foreground">{lang.name}</span></span></span>
                      {lang.dir === 'rtl' && <span className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] text-primary">RTL</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-2/55 px-6 py-3 text-xs text-muted-foreground">
          <span>Direction: <strong className="font-mono uppercase text-foreground">{isRtl ? 'RTL' : 'LTR'}</strong></span>
          <button type="button" onClick={onClose} className="min-h-[40px] rounded-[--radius-md] bg-surface-3 px-4 py-1.5 font-medium text-foreground transition-colors hover:bg-surface-4">{t('close', 'Close')}</button>
        </div>
      </div>
    </div>
  );
}
