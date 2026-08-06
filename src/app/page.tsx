'use client';

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { RefreshCw, LogIn, AlertCircle, ShieldCheck, User, Lock, HelpCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Captcha } from '@/components/Captcha';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const fetchCaptcha = async (preserveError = false): Promise<string> => {
    setCaptchaLoading(true);
    if (!preserveError) setError(null);
    try {
      const response = await fetch('/api/captcha');
      if (!response.ok) throw new Error('Failed to load captcha');
      const sid = response.headers.get('x-session-id');
      if (sid) setSessionId(sid);
      const data = await response.json();
      setCaptchaImage(data.captchaImage);
      if (data.solvedCaptcha) {
        setCaptcha(data.solvedCaptcha);
      } else {
        setCaptcha('');
      }
      return data.solvedCaptcha || '';
    } catch (err) {
      console.error(err);
      setError('Failed to load CAPTCHA. Please try again.');
      setCaptcha('');
      return '';
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedSession = sessionStorage.getItem('kl_erp_session_id');
        if (storedSession) {
          setSessionId(storedSession);
          router.push('/dashboard');
          return;
        } else {
          fetchCaptcha();
        }
        const savedDevice = localStorage.getItem('kl_erp_device_id');
        if (savedDevice) setDeviceId(savedDevice);
      } catch {}

      const savedUser = localStorage.getItem('remember_username');
      const savedPass = localStorage.getItem('remember_password');
      if (savedUser && savedPass) {
        setUsername(savedUser);
        setPassword(savedPass);
        setRememberMe(true);
      }
    });
  }, [router]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password || !captcha) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
        body: JSON.stringify({
          username,
          password,
          captcha,
          captchaToken,
          deviceId: deviceId || (typeof localStorage !== 'undefined' ? localStorage.getItem('kl_erp_device_id') : '') || '',
        }),
      });

      const data = await response.json();

      if (data.deviceId) {
        setDeviceId(data.deviceId);
        try { localStorage.setItem('kl_erp_device_id', data.deviceId); } catch {}
      }

      if (data.needsCaptchaRetry) {
        setError(null);
        setStatus('First-time device setup — please enter the captcha once more.');
        await fetchCaptcha(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      if (rememberMe) {
        localStorage.setItem('remember_username', username);
        localStorage.setItem('remember_password', password);
      } else {
        localStorage.removeItem('remember_username');
        localStorage.removeItem('remember_password');
      }

      if (data.sessionId) setSessionId(data.sessionId);

      try {
        document.cookie = `kl_erp_session=${data.sessionId || ''}; max-age=86400; path=/;`;
        sessionStorage.setItem('kl_erp_session_id', data.sessionId || '');
        sessionStorage.setItem('kl_erp_csrf_token', data.csrfToken || '');
        localStorage.setItem('kl_erp_csrf_token', data.csrfToken || '');
        localStorage.setItem('kl_erp_academic_years', JSON.stringify(data.academicYears || []));
        localStorage.setItem('kl_erp_semesters', JSON.stringify(data.semesters || []));
      } catch {}

      let academicYear = '';
      if (data.academicYears && data.academicYears.length > 0) {
        const sortedYears = [...data.academicYears].sort(
          (a: { label: string; value: string }, b: { label: string; value: string }) =>
            b.label.localeCompare(a.label)
        );
        academicYear = sortedYears[0].value;
      }

      let semesterId = '';
      if (data.semesters && data.semesters.length > 0) {
        const oddSem = data.semesters.find((s: { label: string; value: string }) =>
          s.label.toLowerCase().includes('odd')
        );
        semesterId = oddSem ? oddSem.value : data.semesters[0].value;
      }

      if (academicYear) { try { localStorage.setItem('kl_erp_year', academicYear); } catch {} }
      if (semesterId) { try { localStorage.setItem('kl_erp_sem', semesterId); } catch {} }
      if (username) { try { localStorage.setItem('studentId', username); } catch {} }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'An unexpected error occurred');
      await fetchCaptcha(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex bg-background text-foreground relative overflow-hidden font-sans">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute w-[60vw] h-[60vw] rounded-full bg-primary/8 blur-[120px] -top-[20%] -left-[10%]" />
        <div className="absolute w-[50vw] h-[50vw] rounded-full bg-purple-600/6 blur-[120px] -bottom-[15%] -right-[5%]" />
      </div>

      {/* ── LEFT: BRANDING PANEL (desktop only) ── */}
      <div className="hidden lg:flex w-[45%] h-full relative border-r border-border overflow-hidden glass-subtle flex-col">
        <div className="relative z-10 flex-1 flex flex-col p-8 xl:p-12 justify-between h-full">
          <div>
            <div className="bg-white rounded-2xl p-3 shadow-lg inline-block mb-6 border border-white/20">
              <img src="/logo.png" alt="KLH" className="h-8 object-contain" />
            </div>
            <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-foreground leading-[1.15] mb-4 font-heading">
              Academic sync,
              <br />
              <span className="text-gradient">precision engineered.</span>
            </h1>
            <p className="text-sm xl:text-base text-muted-foreground max-w-md leading-relaxed">
              Secure, real-time access to your timetable, profile, and attendance metrics directly from the core ERP.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="success" dot className="px-3 py-1.5 text-[10px] tracking-widest uppercase">
              System Live
            </Badge>

            <Dialog>
              <DialogTrigger className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Security Info</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>KL Sync Security</DialogTitle>
                  <DialogDescription>
                    KL Sync uses encrypted session tokens and proof-of-work bot protection.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-xs text-muted-foreground space-y-2 py-2">
                  <p>• <strong>First-Time Device Setup</strong>: A registered device token is issued on first sign-in.</p>
                  <p>• <strong>Credential Encryption</strong>: Your password is used strictly for ERP session establishment.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ── RIGHT: LOGIN FORM ── */}
      <div className="flex-1 h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto lg:overflow-hidden relative z-10">
        <Card variant="glass" className="w-full max-w-[420px] p-5 sm:p-7 shadow-xl">
          <CardHeader className="p-0 mb-5">
            <div className="lg:hidden mb-4">
              <div className="bg-white rounded-xl p-2.5 shadow-md inline-block">
                <img src="/logo.png" alt="KLH" className="h-7 object-contain" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-1 font-heading">
              Sign in
            </CardTitle>
            <CardDescription>
              Enter your student credentials to continue.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {error && (
              <div className="mb-4 flex items-start gap-3 p-3 rounded-[--radius-md] bg-destructive/8 border border-destructive/15 text-destructive text-sm animate-up">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {status && !error && (
              <div className="mb-4 flex items-start gap-3 p-3 rounded-[--radius-md] bg-info/8 border border-info/15 text-info text-sm animate-up">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{status}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3" aria-label="Student ERP Authentication Form">
              <div className="space-y-1">
                <label htmlFor="student-id-field" className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Student ID
                </label>
                <Input
                  id="student-id-field"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="210003xxxx"
                  leftIcon={<User className="w-4 h-4" />}
                  aria-required="true"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password-field" className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Password
                </label>
                <Input
                  id="password-field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  aria-required="true"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-0.5">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-2 border-border text-primary focus:ring-2 focus:ring-ring cursor-pointer accent-[--primary]"
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Remember credentials
                </label>
              </div>

              <div className="space-y-1">
                <label htmlFor="captcha-field" className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Security Code
                </label>
                <div className="flex gap-2.5 items-center">
                  <Input
                    id="captcha-field"
                    type="text"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    placeholder="Enter code"
                    aria-required="true"
                    className="flex-1 font-mono"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-[44px] w-[100px] rounded-[--radius-md] overflow-hidden flex items-center justify-center bg-white border border-border shadow-xs">
                      {captchaLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" aria-label="Loading captcha" />
                      ) : captchaImage ? (
                        <img
                          src={captchaImage}
                          alt="Security code"
                          className="h-full w-full object-contain mix-blend-multiply scale-105 contrast-150"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMCwyMCBRMzAsNSA2MCwyMCBUMTIwLDIwIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAsMTAgUTQwLDMwIDgwLDEwIFQxMjAsMzAiIHN0cm9rZT0iI2Q1ZDVkNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSI5MCUiIHk9IjU1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxMTExMTEiIGxldHRlci1zcGFjaW5nPSIzIj44ODg4PC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fetchCaptcha()}
                      isLoading={captchaLoading}
                      disabled={captchaLoading}
                      aria-label="Refresh captcha"
                      className="h-[44px] w-[44px] shrink-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-0.5">
                <Captcha onVerify={setCaptchaToken} />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                disabled={loading || !captchaToken}
                className="w-full mt-3"
              >
                <LogIn className="w-4 h-4" />
                Continue to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground/50 mt-4 text-center shrink-0">
          KL Sync is an independent project • Not affiliated with KL University
        </p>
      </div>
    </div>
  );
}
