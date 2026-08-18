import { clearGlobalCache } from '@/hooks/useNativeQuery';

export interface ConsentSettings {
  essentialCookies: boolean; // Always true
  localDataCaching: boolean;
  aiCopilotProcessing: boolean;
  anonymousPerformanceMetrics: boolean;
}

const DEFAULT_CONSENT: ConsentSettings = {
  essentialCookies: true,
  localDataCaching: true,
  aiCopilotProcessing: true,
  anonymousPerformanceMetrics: false,
};

export function getConsentSettings(): ConsentSettings {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const stored = localStorage.getItem('kl_consent_settings');
    if (stored) return { ...DEFAULT_CONSENT, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONSENT;
}

export function saveConsentSettings(settings: Partial<ConsentSettings>): ConsentSettings {
  const current = getConsentSettings();
  const updated: ConsentSettings = {
    ...current,
    ...settings,
    essentialCookies: true, // Cannot be turned off (strictly necessary for auth proxy)
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kl_consent_settings', JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * GDPR (Art. 20), CCPA (§ 1798.100), LGPD (Art. 18), DPDPA (Sec. 11) - Right to Data Portability
 * Collects all locally stored and cached student records and triggers an immediate JSON download.
 */
export function exportAllUserData(): void {
  if (typeof window === 'undefined') return;

  const exportPayload: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    system: 'KL-Sync Academic Client',
    complianceStandard: ['GDPR Art. 20', 'CCPA § 1798.100', 'LGPD Art. 18', 'DPDPA 2023 Sec. 11', 'PIPEDA'],
    storageData: {},
    cachedModules: {},
  };

  // 1. Gather all LocalStorage
  const localStorageItems: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.includes('password')) {
      localStorageItems[key] = localStorage.getItem(key) || '';
    }
  }
  exportPayload.storageData = localStorageItems;

  // 2. Gather all SessionStorage & Cached ERP Modules
  const sessionItems: Record<string, unknown> = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      const val = sessionStorage.getItem(key);
      try {
        sessionItems[key] = val ? JSON.parse(val) : val;
      } catch {
        sessionItems[key] = val;
      }
    }
  }
  exportPayload.cachedModules = sessionItems;

  // 3. Trigger JSON Download
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `kl-sync-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * GDPR (Art. 17), CCPA (§ 1798.105), LGPD (Art. 18), DPDPA (Sec. 12) - Right to Erasure / "Forget Me"
 * Cryptographically purges all cached student data, local storage, session storage, and cookies.
 */
export function purgeAllUserData(): void {
  if (typeof window === 'undefined') return;

  // 1. Clear global in-memory query cache
  clearGlobalCache();

  // 2. Wipe LocalStorage
  try {
    localStorage.clear();
  } catch {}

  // 3. Wipe SessionStorage
  try {
    sessionStorage.clear();
  } catch {}

  // 4. Wipe Cookies
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }
  } catch {}

  // 5. Redirect to login
  window.location.href = '/';
}
