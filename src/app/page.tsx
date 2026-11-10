'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Lock,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
} from '@/components/ui/icons';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { triggerHaptic } from '@/lib/fluid-motion';
import { prefetchAllUserData } from '@/lib/data-prefetcher';
import { useI18n } from '@/lib/i18n';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Captcha } from '@/components/Captcha';
import {
  isValidCaptchaInput,
  normalizeCaptchaInput,
} from '@/lib/captcha-input';

type LoginResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  field?: string;
  needsCaptchaRetry?: boolean;
  deviceId?: string;
  academicYears?: Array<{ value: string; label: string }>;
  semesters?: Array<{ value: string; label: string }>;
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaChallengeVersion, setCaptchaChallengeVersion] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [credentialsInvalid, setCredentialsInvalid] = useState(false);
  const [captchaInvalid, setCaptchaInvalid] = useState(false);
  const captchaRequestRef = useRef(0);

  const fetchCaptcha = useCallback(
    async (preserveError = false): Promise<void> => {
      const requestId = ++captchaRequestRef.current;

      setCaptchaLoading(true);
      setCaptcha('');
      setCaptchaImage(null);
      setCaptchaToken('');
      setCaptchaInvalid(false);
      setCaptchaChallengeVersion((version) => version + 1);
      if (!preserveError) setError(null);

      try {
        const response = await fetch('/api/captcha', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: AbortSignal.timeout(12000),
        });
        const data = (await response.json()) as {
          captchaImage?: unknown;
          error?: unknown;
          minLength?: unknown;
          maxLength?: unknown;
        };

        if (
          !response.ok ||
          typeof data.captchaImage !== 'string' ||
          !data.captchaImage
        ) {
          const message =
            typeof data.error === 'string'
              ? data.error
              : 'The security-code service is unavailable.';
          throw new Error(message);
        }

        // A newer refresh wins. Late responses must never replace the image
        // and ERP session created by the latest request.
        if (requestId !== captchaRequestRef.current) return;

        setCaptchaImage(data.captchaImage);
      } catch (cause) {
        if (requestId !== captchaRequestRef.current) return;

        console.warn('[CAPTCHA] Image challenge refresh failed:', cause);
        setCaptchaImage(null);
        setCaptchaToken('');
        setCaptchaInvalid(true);
        if (!preserveError) {
          setError(
            cause instanceof Error && cause.message
              ? cause.message
              : 'Could not load the security code. Please retry.'
          );
        }
      } finally {
        if (requestId === captchaRequestRef.current) {
          setCaptchaLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    try {
      const savedDevice = localStorage.getItem('kl_erp_device_id');
      if (savedDevice) setDeviceId(savedDevice);

      const savedUser = localStorage.getItem('remember_username');
      if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true);
      }
    } catch {
      // Storage may be unavailable in private browsing; login remains usable.
    }

    void fetchCaptcha();
  }, [fetchCaptcha]);

  const speakCaptchaInstructions = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setStatus('Spoken instructions are not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      'Enter the four to seven lowercase letters shown in the university security-code image. Use Refresh security code if the image is difficult to read. The university ERP currently supplies an image challenge only.'
    );
    utterance.lang = document.documentElement.lang || 'en';
    window.speechSynthesis.speak(utterance);
  };

  const handleLogin = async (
    event?: React.FormEvent,
    overrideCreds?: { u: string; p: string; c: string }
  ) => {
    event?.preventDefault();

    const u = overrideCreds ? overrideCreds.u : username;
    const p = overrideCreds ? overrideCreds.p : password;
    const c = overrideCreds ? overrideCreds.c : captcha;

    const validCredentials =
      typeof u === 'string' &&
      u.trim().length > 0 &&
      u.trim().length <= 128 &&
      typeof p === 'string' &&
      p.length > 0 &&
      p.length <= 1024;
    const validCaptcha = isValidCaptchaInput(c);

    if (!validCredentials || !validCaptcha) {
      triggerHaptic('error');
      setCredentialsInvalid(!validCredentials);
      setCaptchaInvalid(!validCaptcha);
      setError(
        !validCredentials
          ? 'Enter your student ID and password.'
          : 'Enter the 4–7 lowercase letters shown in the security-code image.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);
    setCredentialsInvalid(false);
    setCaptchaInvalid(false);
    triggerHaptic('light');

    try {
      let storedDeviceId = deviceId;
      try {
        storedDeviceId =
          storedDeviceId || localStorage.getItem('kl_erp_device_id') || '';
      } catch {
        // Continue without a remembered device identifier.
      }

      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: u.trim(),
          password: p,
          captcha: c,
          captchaToken: captchaToken || undefined,
          deviceId: storedDeviceId,
          rememberMe,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (data.deviceId) {
        setDeviceId(data.deviceId);
        try {
          localStorage.setItem('kl_erp_device_id', data.deviceId);
        } catch {
          // Storage is an optional convenience, not an auth requirement.
        }
      }

      if (data.needsCaptchaRetry) {
        setError(null);
        setStatus(
          'The university ERP requested a new security code. Enter the new image to continue.'
        );
        await fetchCaptcha(true);
        triggerHaptic('warning');
        return;
      }

      if (!response.ok) {
        if (response.status === 401) setCredentialsInvalid(true);
        if (data.field === 'captcha' || data.field === 'captchaToken') {
          setCaptchaInvalid(true);
        }
        throw new Error(
          data.message || data.error || 'Login failed. Please try again.'
        );
      }

      try {
        if (rememberMe) localStorage.setItem('remember_username', u.trim());
        else localStorage.removeItem('remember_username');

        localStorage.removeItem('remember_password');
        localStorage.setItem(
          'kl_erp_academic_years',
          JSON.stringify(data.academicYears || [])
        );
        localStorage.setItem(
          'kl_erp_semesters',
          JSON.stringify(data.semesters || [])
        );
        if (data.academicYears?.length) {
          localStorage.setItem('kl_erp_year', data.academicYears[0].value);
        }
        if (data.semesters?.length) {
          localStorage.setItem('kl_erp_sem', data.semesters[0].value);
        }
        localStorage.setItem('studentId', u.trim());
      } catch {
        // Private browsing/storage restrictions must not block authentication.
      }

      const academicYear = data.academicYears?.[0]?.value || '';
      const semesterId = data.semesters?.[0]?.value || '';
      void prefetchAllUserData({ academicYear, semesterId });
      triggerHaptic('success');
      router.push('/dashboard');
    } catch (cause: unknown) {
      triggerHaptic('error');
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : 'An unexpected error occurred.'
      );
      await fetchCaptcha(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    triggerHaptic('selection');
    setUsername('2100030000');
    setPassword('demo_password');
    setCaptcha('abcd');
    setCaptchaInvalid(false);
    void handleLogin(undefined, {
      u: '2100030000',
      p: 'demo_password',
      c: 'abcd',
    });
  };

  return (
    <main
      id="main-content"
      className="relative flex h-[100dvh] w-full overflow-hidden bg-background text-foreground"
    >
      <h1 className="sr-only">KL Sync Student Portal</h1>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(79,70,200,0.10),transparent_35%),radial-gradient(circle_at_90%_100%,rgba(19,138,99,0.08),transparent_36%)]" />
      <div className="absolute right-4 top-4 z-30 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSelector />
      </div>

      <section className="relative flex min-h-[100dvh] flex-col overflow-y-auto bg-background py-6 custom-scrollbar sm:py-8">
        <div className="m-auto w-full max-w-[420px] px-4 animate-spring-up">
          <Card
            variant="glass"
            className="rounded-[--radius-2xl] border-border/60 p-4 shadow-xl backdrop-blur-xl sm:p-6"
          >
            <CardHeader className="p-0 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface-1 p-1.5 shadow-xs backdrop-blur-md">
                  <img
                    src="/logo.webp"
                    alt="KL University Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                    KL Sync
                  </h2>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    KL University Student Portal
                  </p>
                </div>
              </div>

              <p className="caption-label mb-0.5 text-primary font-semibold">
                Welcome back
              </p>
              <h3 className="display-title text-2xl font-extrabold tracking-tight sm:text-3xl">
                Sign in to your{' '}
                <span className="text-gradient-brand">workspace.</span>
              </h3>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                Use your student ERP credentials to continue.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mb-3 flex items-start gap-2.5 rounded-[--radius-md] border border-error/35 bg-error/10 p-2.5 text-xs text-error sm:text-sm"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}
              {status && !error && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-3 flex items-start gap-2.5 rounded-[--radius-md] border border-info/35 bg-info/10 p-2.5 text-xs text-info sm:text-sm"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">{status}</p>
                </div>
              )}

              <form
                onSubmit={(event) => void handleLogin(event)}
                className="space-y-3"
                aria-label="Student ERP Authentication Form"
                noValidate
              >
                <div className="space-y-1">
                  <label
                    htmlFor="student-id-field"
                    className="caption-label text-muted-foreground"
                  >
                    {t('studentId', 'Student ID / username')}
                  </label>
                  <Input
                    id="student-id-field"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.currentTarget.value);
                      setCredentialsInvalid(false);
                    }}
                    placeholder="210003xxxx"
                    leftIcon={<User className="h-4 w-4" />}
                    required
                    maxLength={128}
                    autoComplete="username"
                    error={credentialsInvalid}
                    aria-describedby={
                      credentialsInvalid ? 'login-error' : undefined
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="password-field"
                    className="caption-label text-muted-foreground"
                  >
                    {t('password', 'Password')}
                  </label>
                  <Input
                    id="password-field"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.currentTarget.value);
                      setCredentialsInvalid(false);
                    }}
                    placeholder="Enter your password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                    maxLength={1024}
                    autoComplete="current-password"
                    error={credentialsInvalid}
                    aria-describedby={
                      credentialsInvalid ? 'login-error' : undefined
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="captcha-field"
                      className="caption-label text-muted-foreground"
                    >
                      {t('securityCode', 'Security code')}
                    </label>
                    <span className="text-[10px] font-semibold text-primary">
                      4–7 lowercase letters
                    </span>
                  </div>

                  <div
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                    role="group"
                    aria-label="University visual security code"
                  >
                    <Input
                      id="captcha-field"
                      value={captcha}
                      onChange={(event) => {
                        setCaptcha(normalizeCaptchaInput(event.currentTarget.value));
                        setCaptchaInvalid(false);
                        setError(null);
                      }}
                      placeholder="e.g. abcd"
                      required
                      minLength={4}
                      maxLength={7}
                      pattern="[a-z]{4,7}"
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="off"
                      className="min-w-0 font-mono lowercase tracking-[0.2em]"
                      error={captchaInvalid}
                      aria-describedby="captcha-instructions"
                      aria-invalid={captchaInvalid || undefined}
                    />

                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="flex h-11 w-[112px] items-center justify-center overflow-hidden rounded-[--radius-md] border border-border bg-surface-1 shadow-xs">
                        {captchaLoading ? (
                          <Loader2
                            className="h-4 w-4 motion-safe:animate-spin text-muted-foreground"
                            aria-label="Loading security code"
                          />
                        ) : captchaImage ? (
                          <img
                            src={captchaImage}
                            alt="Distorted university security code. Enter the 4 to 7 lowercase letters shown."
                            className="h-full w-full object-contain"
                            onError={() => {
                              setCaptchaImage(null);
                              setCaptchaInvalid(true);
                            }}
                          />
                        ) : (
                          <span className="px-2 text-center text-[10px] text-muted-foreground">
                            Image unavailable
                          </span>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          triggerHaptic('light');
                          setStatus(null);
                          void fetchCaptcha();
                        }}
                        isLoading={captchaLoading}
                        disabled={captchaLoading || loading}
                        aria-label="Refresh security code image and browser verification"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div
                    id="captcha-instructions"
                    className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"
                  >
                    <span>
                      Type the letters as shown. Refresh the image if it is unclear.
                    </span>
                    <button
                      type="button"
                      onClick={speakCaptchaInstructions}
                      className="min-h-[32px] rounded px-1 font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Speak instructions
                    </button>
                  </div>

                  <p className="sr-only" aria-live="polite">
                    {captchaLoading
                      ? 'Loading a new security-code image.'
                      : captchaImage
                        ? 'Security-code image loaded. Enter 4 to 7 lowercase letters.'
                        : 'Security-code image is unavailable. Use the refresh button.'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label
                    htmlFor="remember-me-checkbox"
                    className="flex min-h-[44px] cursor-pointer select-none items-center gap-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                  >
                    <input
                      id="remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-input bg-surface-2 text-primary accent-primary focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <span>{t('rememberMe', 'Remember me')}</span>
                  </label>
                </div>

                <Captcha
                  key={captchaChallengeVersion}
                  onVerify={setCaptchaToken}
                />

                <Button
                  type="submit"
                  size="lg"
                  isLoading={loading}
                  disabled={
                    loading ||
                    captchaLoading ||
                    !isValidCaptchaInput(captcha) ||
                    !captchaToken
                  }
                  className="mt-1 w-full"
                >
                  <LogIn className="h-4 w-4" />
                  {t('signIn', 'Sign in')}
                </Button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="flex-grow border-t border-border/60" />
                  <span className="shrink-0 px-3 text-[11px] font-medium text-muted-foreground">
                    or
                  </span>
                  <div className="flex-grow border-t border-border/60" />
                </div>

                <button
                  type="button"
                  onClick={handleDemoMode}
                  disabled={loading || captchaLoading || !captchaImage}
                  className="apple-pill flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:text-primary active:scale-[0.98] disabled:opacity-50 sm:text-sm"
                  aria-label="Explore Demo Portal"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Explore Demo Portal</span>
                </button>
              </form>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                <span>Protected with AES-256 encrypted session tokens</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
