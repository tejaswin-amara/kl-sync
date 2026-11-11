'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Captcha } from '@/components/Captcha';
import { triggerHaptic } from '@/lib/fluid-motion';
import { prefetchAllUserData } from '@/lib/data-prefetcher';
import { useI18n } from '@/lib/i18n';
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

const CAPTCHA_MIN_LENGTH = 4;
const CAPTCHA_MAX_LENGTH = 7;

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
  const mountedRef = useRef(false);

  const fetchCaptcha = useCallback(
    async (preserveMessage = false): Promise<void> => {
      const requestId = ++captchaRequestRef.current;

      setCaptchaLoading(true);
      setCaptcha('');
      setCaptchaImage(null);
      setCaptchaToken('');
      setCaptchaInvalid(false);
      setCaptchaChallengeVersion((version) => version + 1);
      if (!preserveMessage) {
        setError(null);
        setStatus(null);
      }

      try {
        const response = await fetch('/api/captcha', {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(12000),
        });

        const data = (await response.json().catch(() => ({}))) as {
          captchaImage?: unknown;
          error?: unknown;
          minLength?: unknown;
          maxLength?: unknown;
          rule?: unknown;
        };

        if (
          !response.ok ||
          typeof data.captchaImage !== 'string' ||
          !data.captchaImage
        ) {
          const message =
            typeof data.error === 'string'
              ? data.error
              : 'The university security-code service is unavailable.';
          throw new Error(message);
        }

        // A stale request must never replace the current image/session.
        if (requestId !== captchaRequestRef.current) return;

        setCaptchaImage(data.captchaImage);
        setStatus('A new university security-code image is ready.');
      } catch (cause) {
        if (requestId !== captchaRequestRef.current) return;

        console.warn(
          '[CAPTCHA] Image challenge refresh failed:',
          cause instanceof Error ? cause.message : 'Unknown error'
        );
        setCaptchaImage(null);
        setCaptchaToken('');
        setCaptchaInvalid(true);
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : 'Could not load the security code. Refresh to try again.'
        );
      } finally {
        if (requestId === captchaRequestRef.current && mountedRef.current) {
          setCaptchaLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    try {
      const savedDevice = localStorage.getItem('kl_erp_device_id');
      if (savedDevice) setDeviceId(savedDevice);

      const savedUser = localStorage.getItem('remember_username');
      if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true);
      }
    } catch {
      // Private browsing and storage restrictions must not block login.
    }

    void fetchCaptcha();

    return () => {
      mountedRef.current = false;
      captchaRequestRef.current += 1;
    };
  }, [fetchCaptcha]);

  const speakCaptchaInstructions = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setStatus('Spoken instructions are not supported by this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      'Enter the four to seven lowercase letters shown in the university security-code image. The optional KLU ERP Auto-Fill extension can provide an on-device suggestion. Review any suggestion before signing in. If the image is difficult to read, refresh the security code. The university ERP does not currently provide an audio version of this image challenge.'
    );
    utterance.lang = document.documentElement.lang || 'en';
    window.speechSynthesis.speak(utterance);
  };

  const handleCaptchaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = normalizeCaptchaInput(event.currentTarget.value);
    setCaptcha(nextValue);
    setCaptchaInvalid(false);
    setError(null);

    // The optional extension dispatches bubbling input/change events after
    // local inference. Announce its suggestion, but never treat it as proof.
    if (event.nativeEvent.isTrusted === false && nextValue) {
      setStatus(
        `On-device suggestion filled: ${nextValue}. Compare it with the image before continuing.`
      );
    } else {
      setStatus(null);
    }
  };

  const handleLogin = async (
    event?: React.FormEvent<HTMLFormElement>,
    overrideCreds?: { username: string; password: string; captcha: string }
  ) => {
    event?.preventDefault();

    const submittedUsername = overrideCreds?.username ?? username;
    const submittedPassword = overrideCreds?.password ?? password;
    const submittedCaptcha = overrideCreds?.captcha ?? captcha;

    const validCredentials =
      typeof submittedUsername === 'string' &&
      submittedUsername.trim().length > 0 &&
      submittedUsername.trim().length <= 128 &&
      typeof submittedPassword === 'string' &&
      submittedPassword.length > 0 &&
      submittedPassword.length <= 1024;
    const validCode = isValidCaptchaInput(submittedCaptcha);

    if (!validCredentials || !validCode) {
      triggerHaptic('error');
      setCredentialsInvalid(!validCredentials);
      setCaptchaInvalid(!validCode);
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
      let currentDeviceId = deviceId;
      try {
        currentDeviceId =
          currentDeviceId || localStorage.getItem('kl_erp_device_id') || '';
      } catch {
        // Device persistence is optional.
      }

      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: submittedUsername.trim(),
          password: submittedPassword,
          captcha: submittedCaptcha,
          captchaToken: captchaToken || undefined,
          deviceId: currentDeviceId,
          rememberMe,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (data.deviceId) {
        setDeviceId(data.deviceId);
        try {
          localStorage.setItem('kl_erp_device_id', data.deviceId);
        } catch {
          // Storage is an optional convenience, not an authentication requirement.
        }
      }

      if (data.needsCaptchaRetry) {
        setStatus(
          'The university ERP requested a fresh security code. Enter the new image to continue.'
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
        if (rememberMe) {
          localStorage.setItem('remember_username', submittedUsername.trim());
        } else {
          localStorage.removeItem('remember_username');
        }

        // Never persist passwords or CAPTCHA/CapJS tokens in browser storage.
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
        localStorage.setItem('studentId', submittedUsername.trim());
      } catch {
        // Browser storage is optional.
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
    if (!captchaImage || captchaLoading || loading) return;

    triggerHaptic('selection');
    setUsername('2100030000');
    setPassword('demo_password');
    setCaptcha('abcd');
    setCaptchaInvalid(false);
    void handleLogin(undefined, {
      username: '2100030000',
      password: 'demo_password',
      captcha: 'abcd',
    });
  };

  const canSignIn =
    !loading &&
    !captchaLoading &&
    Boolean(captchaImage) &&
    isValidCaptchaInput(captcha) &&
    Boolean(captchaToken);

  return (
    <main
      id="main-content"
      className="relative min-h-[100svh] overflow-x-hidden bg-background text-foreground"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(111,115,230,0.17),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(51,170,135,0.10),transparent_30%)]"
      />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
        <header className="flex w-full items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="KL Sync Student Portal home"
            className="group inline-flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface-1 p-1.5 shadow-sm">
              <img
                src="/logo.webp"
                alt=""
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight text-foreground sm:text-base">
                KL Sync
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                KL University Student Portal
              </span>
            </span>
          </Link>
          <LanguageSelector />
        </header>

        <div className="grid flex-1 grid-cols-1 items-center gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)] lg:gap-16 lg:py-10">
          <section className="hidden max-w-2xl flex-col justify-center gap-8 lg:flex">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Student workspace · Live ERP sync
            </div>

            <div className="space-y-5">
              <p className="caption-label text-muted-foreground">
                Your university, in one place
              </p>
              <h1 className="display-title max-w-xl text-5xl font-bold leading-[1.04] tracking-[-0.045em] xl:text-6xl">
                Your academic day,
                <span className="block text-gradient-brand">
                  in clear view.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">
                A focused student portal for the information you check most:
                classes, attendance, marks, fees, profile details and campus
                updates.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-2 gap-3">
              {[
                ['01', 'Timetable', 'Today’s classes and schedule'],
                ['02', 'Attendance', 'Course-wise attendance'],
                ['03', 'Marks', 'Assessment results'],
                ['04', 'Fees', 'Dues and payment status'],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-border/80 bg-surface-1/75 p-4 shadow-sm backdrop-blur"
                >
                  <span className="text-[10px] font-bold tracking-[0.16em] text-primary">
                    {number}
                  </span>
                  <h2 className="mt-2 text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>
                Session credentials are protected with encrypted,
                HttpOnly browser cookies.
              </span>
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-[480px] flex-col justify-center">
            <Card
              variant="glass"
              className="w-full overflow-visible rounded-[28px] border-border/80 bg-surface-1/95 p-1 shadow-2xl shadow-black/25 backdrop-blur-xl"
            >
              <CardHeader className="space-y-3 px-5 pb-4 pt-6 sm:px-7 sm:pt-8">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  <GraduationCap className="h-4 w-4" />
                  Student access
                </div>
                <div className="space-y-1.5">
                  <h2
                    id="login-title"
                    className="display-title text-2xl font-bold tracking-tight sm:text-[2rem]"
                  >
                    Welcome back.
                  </h2>
                  <CardDescription className="text-sm">
                    Sign in with your university ERP credentials.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-6 sm:px-7 sm:pb-8">
                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 flex items-start gap-2.5 rounded-xl border border-error/35 bg-error/10 p-3 text-sm text-error"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="min-w-0 leading-relaxed">{error}</p>
                  </div>
                )}

                {status && !error && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mb-4 flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 p-3 text-xs leading-relaxed text-info"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="min-w-0">{status}</p>
                  </div>
                )}

                <form
                  onSubmit={(event) => void handleLogin(event)}
                  className="space-y-4"
                  aria-labelledby="login-title"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="student-id-field"
                      className="caption-label text-muted-foreground"
                    >
                      {t('studentId', 'Student ID / username')}
                    </label>
                    <Input
                      id="student-id-field"
                      name="username"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.currentTarget.value);
                        setCredentialsInvalid(false);
                      }}
                      placeholder="Enter your student ID"
                      leftIcon={<User className="h-4 w-4" />}
                      required
                      maxLength={128}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      error={credentialsInvalid}
                      aria-invalid={credentialsInvalid || undefined}
                      aria-describedby={credentialsInvalid ? 'login-error' : undefined}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password-field"
                      className="caption-label text-muted-foreground"
                    >
                      {t('password', 'Password')}
                    </label>
                    <Input
                      id="password-field"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.currentTarget.value);
                        setCredentialsInvalid(false);
                      }}
                      placeholder="Enter your ERP password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      required
                      maxLength={1024}
                      autoComplete="current-password"
                      error={credentialsInvalid}
                      aria-invalid={credentialsInvalid || undefined}
                      aria-describedby={credentialsInvalid ? 'login-error' : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="captcha-field"
                        className="caption-label text-muted-foreground"
                      >
                        {t('securityCode', 'Security code')}
                      </label>
                      <span className="text-[10px] font-semibold text-primary">
                        {CAPTCHA_MIN_LENGTH}–{CAPTCHA_MAX_LENGTH} lowercase letters
                      </span>
                    </div>

                    <Input
                      id="captcha-field"
                      name="captcha"
                      value={captcha}
                      onChange={handleCaptchaChange}
                      placeholder="Enter the letters shown"
                      required
                      minLength={CAPTCHA_MIN_LENGTH}
                      maxLength={CAPTCHA_MAX_LENGTH}
                      pattern="[a-z]{4,7}"
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="off"
                      className="font-mono tracking-[0.22em]"
                      error={captchaInvalid}
                      aria-invalid={captchaInvalid || undefined}
                      aria-describedby="captcha-instructions"
                    />

                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-2/50 p-2">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-[56px] w-[148px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-1">
                          {captchaLoading ? (
                            <Loader2
                              className="h-5 w-5 motion-safe:animate-spin text-muted-foreground"
                              aria-label="Loading security code"
                            />
                          ) : captchaImage ? (
                            <img
                              id="kl-sync-captcha-image"
                              src={captchaImage}
                              alt="University security-code image. Type the visible lowercase letters into the security code field."
                              className="h-full w-full object-contain"
                              onError={() => {
                                setCaptchaImage(null);
                                setCaptchaInvalid(true);
                                setStatus('The security-code image failed to display. Refresh it to continue.');
                              }}
                            />
                          ) : (
                            <span className="px-2 text-center text-[10px] text-muted-foreground">
                              Image unavailable
                            </span>
                          )}
                        </div>
                        <span className="min-w-0 text-[11px] leading-relaxed text-muted-foreground">
                          {captchaLoading
                            ? 'Fetching a fresh code…'
                            : captchaImage
                              ? 'Read the image and enter its letters above.'
                              : 'Refresh to request a new image.'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          triggerHaptic('light');
                          void fetchCaptcha();
                        }}
                        isLoading={captchaLoading}
                        disabled={captchaLoading || loading}
                        aria-label="Refresh university security-code image and browser verification"
                        title="Refresh security code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    <div
                      id="captcha-instructions"
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] leading-relaxed text-muted-foreground"
                    >
                      <span>
                        The university currently provides an image challenge, not an audio code.
                      </span>
                      <button
                        type="button"
                        onClick={speakCaptchaInstructions}
                        className="min-h-[36px] rounded-md px-1 font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Speak instructions
                      </button>
                    </div>
                    <p className="sr-only" aria-live="polite">
                      {captchaLoading
                        ? 'Loading a new security-code image.'
                        : captchaImage
                          ? 'Security-code image loaded. Enter four to seven lowercase letters.'
                          : 'Security-code image is unavailable. Use the refresh button.'}
                    </p>
                  </div>

                  <label
                    htmlFor="remember-me-checkbox"
                    className="flex min-h-[44px] cursor-pointer select-none items-center gap-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <input
                      id="remember-me-checkbox"
                      name="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-input bg-surface-2 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span>{t('rememberMe', 'Remember my student ID on this device')}</span>
                  </label>

                  <Captcha
                    key={captchaChallengeVersion}
                    onVerify={setCaptchaToken}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    isLoading={loading}
                    disabled={!canSignIn}
                    className="mt-1 w-full"
                  >
                    <LogIn className="h-4 w-4" />
                    {t('signIn', 'Sign in securely')}
                  </Button>

                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      or
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleDemoMode}
                    isLoading={loading && username === '2100030000'}
                    disabled={loading || captchaLoading || !captchaImage}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    Explore demo portal
                  </Button>
                </form>

                <div className="mt-5 space-y-3 border-t border-border/70 pt-4">
                  <p className="flex items-start justify-center gap-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    Your ERP session is protected by encrypted, HttpOnly cookies.
                  </p>
                  <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                    Optional on-device CAPTCHA assistance:{' '}
                    <Link
                      href="https://github.com/tejaswin-amara/klu-erp-autofill#installation"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      KLU ERP Auto-Fill
                    </Link>
                    . Review any suggested code before signing in; the extension never submits the form.
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="mx-auto mt-4 max-w-md px-2 text-center text-[10px] leading-relaxed text-muted-foreground/80">
              KL Sync is an independent student workspace. Your university ERP credentials are used only to establish your ERP session.
            </p>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-4 text-[10px] text-muted-foreground/70">
          <span>KL Sync · Student workspace</span>
          <span>Designed for desktop and mobile</span>
        </footer>
      </div>
    </main>
  );
}
