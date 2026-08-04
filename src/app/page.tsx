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
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // The ERP's signed device cookie
  const [deviceId, setDeviceId] = useState('');

  // App State
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');

  // First-time ERP device registration status
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
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          username,
          password,
          captcha,
          captchaToken,
          deviceId:
            deviceId ||
            (typeof localStorage !== 'undefined'
              ? localStorage.getItem('kl_erp_device_id')
              : '') ||
            '',
        }),
      });

      const data = await response.json();

      if (data.deviceId) {
        setDeviceId(data.deviceId);
        try {
          localStorage.setItem('kl_erp_device_id', data.deviceId);
        } catch {}
      }

      if (data.needsCaptchaRetry) {
        setError(null);
        setStatus(
          'First-time setup on this device: please enter the captcha once more to finish signing in. This only happens once per device.'
        );
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
        localStorage.setItem(
          'kl_erp_academic_years',
          JSON.stringify(data.academicYears || [])
        );
        localStorage.setItem(
          'kl_erp_semesters',
          JSON.stringify(data.semesters || [])
        );
      } catch {}

      let academicYear = '';
      if (data.academicYears && data.academicYears.length > 0) {
        const sortedYears = [...data.academicYears].sort(
          (
            a: { label: string; value: string },
            b: { label: string; value: string }
          ) => b.label.localeCompare(a.label)
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

      if (academicYear) {
        try {
          localStorage.setItem('kl_erp_year', academicYear);
        } catch {}
      }
      if (semesterId) {
        try {
          localStorage.setItem('kl_erp_sem', semesterId);
        } catch {}
      }
      if (username) {
        try {
          localStorage.setItem('studentId', username);
        } catch {}
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'An unexpected error occurred'
      );
      await fetchCaptcha(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex bg-zinc-950 text-zinc-50 relative overflow-hidden font-sans">
      {/* Background ambient blobs */}
      <div className="blob blob-a w-[500px] h-[500px] bg-indigo-600 top-[-100px] left-[-100px]" />
      <div className="blob blob-b w-[400px] h-[400px] bg-emerald-600 bottom-[-100px] right-[-100px]" />

      {/* LEFT: BRANDING PANEL (Taste-Skill asymmetric split) */}
      <div className="hidden lg:flex w-[45%] relative border-r border-zinc-900 overflow-hidden bg-zinc-900/60 backdrop-blur-2xl flex-col">
        <div className="relative z-10 flex-1 flex flex-col p-16 justify-between">
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-xl inline-block mb-12 border border-white/20">
              <img src="/logo.png" alt="KLH" className="h-10 object-contain" />
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white leading-[1.1] mb-6 font-heading">
              Academic sync,
              <br />
              precision engineered.
            </h1>
            <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
              Secure, real-time access to your timetable, profile, and attendance metrics directly from the core ERP.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="emerald" dot className="px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase">
              System Live & Secure
            </Badge>

            <Dialog>
              <DialogTrigger className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <HelpCircle className="w-4 h-4" />
                <span>Security Info</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>KL Sync Security & Single Sign-On</DialogTitle>
                  <DialogDescription>
                    KL Sync uses encrypted session tokens and proof-of-work bot protection to communicate directly with KL University ERP servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-xs text-zinc-300 space-y-2 py-2">
                  <p>• <strong>First-Time Device Setup</strong>: When signing in from a new device, a registered device token is issued. Enter the captcha code once more when prompted.</p>
                  <p>• <strong>Credential Encryption</strong>: Your student password is used strictly to establish an ERP session and is never logged.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* RIGHT: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-zinc-950/80 backdrop-blur-lg">
        <Card variant="glass" className="w-full max-w-[420px] p-6 sm:p-8 border border-white/10 shadow-2xl">
          <CardHeader className="p-0 mb-8">
            <div className="lg:hidden mb-6">
              <div className="bg-white rounded-xl p-3 shadow-md inline-block">
                <img src="/logo.png" alt="KLH" className="h-8 object-contain" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight text-white mb-2 font-heading">
              Sign in
            </CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Enter your student credentials to continue.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in-0 duration-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <p className="leading-tight">{error}</p>
              </div>
            )}

            {status && !error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm animate-in fade-in-0 duration-200">
                <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
                <p className="leading-tight">{status}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5" aria-label="Student ERP Authentication Form">
              <div className="space-y-1.5">
                <label htmlFor="student-id-field" className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                  Student ID
                </label>
                <Input
                  id="student-id-field"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="210003xxxx"
                  leftIcon={<User className="w-4 h-4 text-zinc-400" />}
                  aria-required="true"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password-field" className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                  Password
                </label>
                <Input
                  id="password-field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-zinc-400" />}
                  aria-required="true"
                />
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded bg-zinc-900 border-zinc-700 text-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-950 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm font-medium text-zinc-300 cursor-pointer select-none">
                  Remember my credentials securely
                </label>
              </div>

              <div className="space-y-2 pt-1">
                <label htmlFor="captcha-field" className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                  Visual Security Code
                </label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="captcha-field"
                    type="text"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    placeholder="Enter code"
                    aria-required="true"
                    className="flex-1 font-mono"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-[44px] w-[110px] rounded-xl overflow-hidden flex items-center justify-center bg-white border border-white/20 shadow-md">
                      {captchaLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-600" aria-label="Loading new captcha image" />
                      ) : captchaImage ? (
                        <img
                          src={captchaImage}
                          alt="Security code"
                          className="h-full w-full object-contain mix-blend-multiply opacity-100 scale-105 filter contrast-150"
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
                      aria-label="Refresh security verification code"
                      className="h-[44px] w-[44px] shrink-0 border-white/10 hover:bg-white/10 text-zinc-300"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <Captcha onVerify={setCaptchaToken} />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                disabled={loading || !captchaToken}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Continue to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

