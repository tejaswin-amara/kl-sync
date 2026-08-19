'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Lock, LogIn, RefreshCw, ShieldCheck, User } from '@/components/ui/icons';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { triggerHaptic } from '@/lib/fluid-motion';
import { prefetchAllUserData } from '@/lib/data-prefetcher';
import { useI18n } from '@/lib/i18n';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ComplianceModal } from '@/components/compliance/ComplianceModal';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [autoSolveFailed, setAutoSolveFailed] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);

  const fetchCaptcha = async (preserveError = false): Promise<string> => {
    setCaptchaLoading(true);
    if (!preserveError) setError(null);
    try {
      const response = await fetch('/api/captcha', { signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      setCaptchaImage(data.captchaImage);
      if (data.solvedCaptcha) { setCaptcha(data.solvedCaptcha); setAutoSolveFailed(false); } else { setCaptcha(''); setAutoSolveFailed(true); }
      return data.solvedCaptcha || '';
    } catch (err) {
      console.warn('[CAPTCHA] Client fetch timed out or failed, using instant fallback:', err);
      const fallbackSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMCwyMCBRMzAsNSA2MCwyMCBUMTIwLDIwIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAsMTAgUTQwLDMwIDgwLDEwIFQxMjAsMzAiIHN0cm9rZT0iI2Q1ZDVkNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgfont-weight="bold" fill="#16202a" letter-spacing="3">abcd</text></svg>';
      setCaptchaImage(fallbackSvg); setCaptcha('abcd');
      return 'abcd';
    } finally { setCaptchaLoading(false); }
  };

  useEffect(() => {
    queueMicrotask(() => {
      try {
        void fetchCaptcha();
        const savedDevice = localStorage.getItem('kl_erp_device_id');
        if (savedDevice) setDeviceId(savedDevice);
      } catch { void fetchCaptcha(); }
      const savedUser = localStorage.getItem('remember_username');
      if (savedUser) { setUsername(savedUser); setRememberMe(true); }
    });
  }, [router]);

  const handleLogin = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const cleanCaptcha = captcha.toLowerCase().trim().replace(/[^a-z]/g, '');
    if (!username || !password || !cleanCaptcha) { triggerHaptic('error'); setError('Please fill in all fields. The security code accepts lowercase letters a–z only.'); return; }
    setLoading(true); setError(null); setStatus(null); triggerHaptic('light');
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password, captcha: cleanCaptcha, deviceId: deviceId || (typeof localStorage !== 'undefined' ? localStorage.getItem('kl_erp_device_id') : '') || '', rememberMe }) });
      const data = await response.json();
      if (data.deviceId) { setDeviceId(data.deviceId); try { localStorage.setItem('kl_erp_device_id', data.deviceId); } catch {} }
      if (data.needsCaptchaRetry) { setError(null); setStatus('First-time device setup — please enter the captcha once more.'); await fetchCaptcha(true); setLoading(false); triggerHaptic('warning'); return; }
      if (!response.ok) throw new Error(data.message || data.error || 'Login failed');
      if (rememberMe) localStorage.setItem('remember_username', username); else localStorage.removeItem('remember_username');
      localStorage.removeItem('remember_password');
      try {
        localStorage.setItem('kl_erp_academic_years', JSON.stringify(data.academicYears || [])); localStorage.setItem('kl_erp_semesters', JSON.stringify(data.semesters || []));
      } catch {}
      let academicYear = '';
      if (data.academicYears?.length) { const sortedYears = [...data.academicYears].sort((a: { label: string }, b: { label: string }) => b.label.localeCompare(a.label)); academicYear = sortedYears[0].value; }
      let semesterId = '';
      if (data.semesters?.length) { const oddSem = data.semesters.find((semester: { label: string }) => semester.label.toLowerCase().includes('odd')); semesterId = oddSem ? oddSem.value : data.semesters[0].value; }
      if (academicYear) localStorage.setItem('kl_erp_year', academicYear);
      if (semesterId) localStorage.setItem('kl_erp_sem', semesterId);
      if (username) localStorage.setItem('studentId', username);
      void prefetchAllUserData({ academicYear, semesterId });
      triggerHaptic('success'); router.push('/dashboard');
    } catch (err: unknown) { triggerHaptic('error'); setError(err instanceof Error && err.message ? err.message : 'An unexpected error occurred'); await fetchCaptcha(true); } finally { setLoading(false); }
  };

  return (
    <main className="relative flex min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-background text-foreground lg:overflow-hidden">
      <h1 className="sr-only">KL Sync Student Portal</h1>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(79,70,200,0.10),transparent_35%),radial-gradient(circle_at_90%_100%,rgba(19,138,99,0.08),transparent_36%)]" />
      <div className="absolute right-4 top-4 z-30 flex items-center gap-2 sm:right-6 sm:top-6"><button type="button" onClick={() => { triggerHaptic('light'); setComplianceOpen(true); }} className="flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface-1/90 px-3 text-xs font-bold text-success shadow-xs backdrop-blur-md hover:bg-surface-2" aria-label="View Privacy & Accessibility Compliance"><ShieldCheck className="h-4 w-4" /><span className="hidden sm:inline">Privacy first</span></button><LanguageSelector /></div>

      <section className="relative z-10 hidden min-h-[100dvh] w-[46%] flex-col justify-between border-r border-border/70 bg-[#111922] p-6 lg:flex xl:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(33,46,59,0.78),transparent_52%),radial-gradient(circle_at_80%_10%,rgba(79,70,200,0.13),transparent_32%)]" />
        <div className="relative z-10"><div className="mb-8 flex items-center gap-3"><img src="/logo.png" alt="KLH" className="h-10 rounded-xl bg-surface-1 p-1.5 shadow-sm" /><div><p className="font-heading text-lg font-bold tracking-tight">KL Sync</p><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Student workspace</p></div></div><Badge variant="success" dot className="mb-5 rounded-full px-3 py-1.5 text-[11px]">Live ERP sync</Badge><h2 className="display-title max-w-xl text-5xl xl:text-6xl">Your academic day, <span className="text-gradient-brand">in one clear view.</span></h2><p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">A focused student portal for the information you check most: today’s classes, attendance, marks, fees, profile details, and campus updates.</p></div>
      </section>

      <section className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-5 sm:px-8 lg:overflow-visible lg:py-3"><div className="w-full max-w-[460px] animate-spring-up"><div className="mb-4 lg:hidden"><img src="/logo.png" alt="KLH" className="mb-5 h-10 rounded-xl bg-surface-1 p-1.5 shadow-sm" /><p className="caption-label text-muted-foreground">KL Sync · Student workspace</p></div><Card variant="glass" className="rounded-[--radius-2xl] p-4 sm:p-5"><CardHeader className="p-0 pb-3"><p className="caption-label mb-2 text-primary">Welcome back</p><h2 className="display-title text-3xl sm:text-4xl">Sign in to your <span className="text-gradient-brand">workspace.</span></h2><CardDescription className="mt-2 text-sm">Use your student ERP credentials to continue.</CardDescription></CardHeader><CardContent className="p-0">
        {error && <div role="alert" aria-live="assertive" className="mb-4 flex items-start gap-3 rounded-[--radius-md] border border-error/35 bg-error/10 p-3.5 text-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="leading-relaxed">{error}</p></div>}
        {status && !error && <div role="status" aria-live="polite" className="mb-4 flex items-start gap-3 rounded-[--radius-md] border border-info/35 bg-info/10 p-3.5 text-sm text-info"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p className="leading-relaxed">{status}</p></div>}
        <form onSubmit={handleLogin} className="space-y-3" aria-label="Student ERP Authentication Form">
          <div className="space-y-1.5"><label htmlFor="student-id-field" className="caption-label text-muted-foreground">{t('studentId', 'Student ID / username')}</label><Input id="student-id-field" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="210003xxxx" leftIcon={<User className="h-4 w-4" />} aria-required="true" autoComplete="username" /></div>
          <div className="space-y-1.5"><label htmlFor="password-field" className="caption-label text-muted-foreground">{t('password', 'Password')}</label><Input id="password-field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" leftIcon={<Lock className="h-4 w-4" />} aria-required="true" autoComplete="current-password" /></div>
          <label htmlFor="remember" className="flex min-h-[44px] items-center gap-2.5 text-sm text-muted-foreground"><input type="checkbox" id="remember" checked={rememberMe} onChange={(event) => { triggerHaptic('selection'); setRememberMe(event.target.checked); }} className="h-4 w-4 rounded border-border accent-[--primary]" />Remember me on this device</label>
          <div className="space-y-1.5"><div className="flex items-center justify-between gap-3"><label htmlFor="captcha-field" className="caption-label text-muted-foreground">{t('securityCode', 'Security code')}</label><span className="text-[10px] font-semibold text-primary">{autoSolveFailed ? 'Type the code shown' : 'Lowercase letters only'}</span></div><div className="flex gap-2.5"><Input id="captcha-field" value={captcha} onChange={(event) => setCaptcha(event.target.value.toLowerCase().replace(/[^a-z]/g, ''))} placeholder="e.g. abcd" aria-required="true" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="min-w-0 flex-1 font-mono lowercase tracking-[0.25em]" /><div className="flex shrink-0 items-center gap-2"><div className="flex h-11 w-[96px] items-center justify-center overflow-hidden rounded-[--radius-md] border border-border bg-surface-1 shadow-xs">{captchaLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading captcha" /> : captchaImage ? <img src={captchaImage} alt="Security code" className="h-full w-full object-contain mix-blend-normal" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}</div><Button type="button" variant="outline" size="icon" onClick={() => { triggerHaptic('light'); void fetchCaptcha(); }} isLoading={captchaLoading} disabled={captchaLoading} aria-label="Refresh captcha"><RefreshCw className="h-4 w-4" /></Button></div></div></div>
          <Button type="submit" size="lg" isLoading={loading} disabled={loading || !captcha} className="mt-2 w-full"><LogIn className="h-4 w-4" />{t('signIn', 'Sign in')}</Button>
        </form>
      </CardContent></Card><div className="mt-2 flex items-start gap-2 rounded-[--radius-lg] border border-border bg-surface-1/80 px-3 py-2 text-[11px] text-muted-foreground shadow-xs"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" /><p>Your session is protected with encrypted tokens and privacy-conscious defaults.</p></div></div></section>
      <ComplianceModal isOpen={complianceOpen} onClose={() => setComplianceOpen(false)} />
    </main>
  );
}
