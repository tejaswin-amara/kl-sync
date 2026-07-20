'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  LogIn,
  AlertCircle,
  Loader2,
  ChevronDown,
  Wand2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RetroGrid } from '@/components/ui/retro-grid';


export default function LoginPage() {
  const router = useRouter();
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
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

  // Selection State
  const [academicYears, setAcademicYears] = useState<
    { value: string; label: string }[]
  >([]);
  const [semesters, setSemesters] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  const academicYearOptions = useMemo(() => {
    return academicYears.map((o) => (
      <option key={o.value} value={o.value} className="bg-[#0c0c0e]">
        {o.label}
      </option>
    ));
  }, [academicYears]);

  const semesterOptions = useMemo(() => {
    return semesters.map((o) => (
      <option key={o.value} value={o.value} className="bg-[#0c0c0e]">
        {o.label}
      </option>
    ));
  }, [semesters]);

  const [autoSolving, setAutoSolving] = useState(false);

  const fetchCaptcha = async (preserveError = false): Promise<string> => {
    setCaptchaLoading(true);
    if (!preserveError) setError(null);
    setCaptcha('');

    try {
      const response = await fetch('/api/captcha');
      if (!response.ok) throw new Error('Failed to load captcha');

      const sid = response.headers.get('x-session-id');
      if (sid) setSessionId(sid);

      const data = await response.json();
      const originalBase64 = data.captchaImage;
      setCaptchaImage(originalBase64);
      return '';
    } catch (err) {
      console.error(err);
      setError('Failed to load CAPTCHA. Please try again.');
      return '';
    } finally {
      setCaptchaLoading(false);
    }
  };

  const handleAutoSolve = async () => {
    if (!captchaImage) return;
    setAutoSolving(true);
    setError(null);
    try {
      // 1. Process image entirely on the client using HTML5 Canvas
      // to bypass Vercel serverless image processing limitations
      const processedBase64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const scale = 3;
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale + 40; // add padding
          canvas.height = img.height * scale + 40;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');

          // Fill white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw scaled image in center
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 20, 20, img.width * scale, img.height * scale);

          // Binarize: if pixel is non-white (the pink text), make it black
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // If not pure white (which is our background), make it pitch black
            if (r < 250 || g < 250 || b < 250) {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject('Failed to load image for processing');
        img.src = captchaImage;
      });

      // 2. Send clean black-on-white image to API
      // Strip data URL prefix if present
      const rawBase64 = processedBase64.includes(',')
        ? processedBase64.split(',')[1]
        : processedBase64;
      const res = await fetch('/api/solve-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: rawBase64 }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setCaptcha(data.text);
      } else {
        setError('Auto-solve failed. Please enter manually.');
      }
    } catch (e) {
      console.error(e);
      setError('Auto-solve failed. Please enter manually.');
    } finally {
      setAutoSolving(false);
    }
  };

  useEffect(() => {
    try {
      const storedSession = sessionStorage.getItem('kl_erp_session_id');
      if (storedSession) {
        setSessionId(storedSession);
        setCsrfToken(sessionStorage.getItem('kl_erp_csrf_token') || '');
        setAcademicYears(
          JSON.parse(sessionStorage.getItem('kl_erp_academic_years') || '[]')
        );
        setSemesters(
          JSON.parse(sessionStorage.getItem('kl_erp_semesters') || '[]')
        );
        router.push('/dashboard');
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, []);

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
        throw new Error(data.message || 'Login failed');
      }

      if (rememberMe) {
        localStorage.setItem('remember_username', username);
        localStorage.setItem('remember_password', password);
      } else {
        localStorage.removeItem('remember_username');
        localStorage.removeItem('remember_password');
      }

      // Set Options
      if (data.sessionId) setSessionId(data.sessionId);
      setAcademicYears(data.academicYears || []);
      setSemesters(data.semesters || []);
      setCsrfToken(data.csrfToken || '');

      try {
        document.cookie = `kl_erp_session=${data.sessionId || ''}; max-age=86400; path=/;`;
        sessionStorage.setItem('kl_erp_session_id', data.sessionId || '');
        sessionStorage.setItem('kl_erp_csrf_token', data.csrfToken || '');
        sessionStorage.setItem(
          'kl_erp_academic_years',
          JSON.stringify(data.academicYears || [])
        );
        sessionStorage.setItem(
          'kl_erp_semesters',
          JSON.stringify(data.semesters || [])
        );
      } catch {}

      // Auto-select the correct academic year and semester
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
        const oddSem = data.semesters.find(
          (s: { label: string; value: string }) =>
            s.label.toLowerCase().includes('odd')
        );
        semesterId = oddSem ? oddSem.value : data.semesters[0].value;
      }

      if (academicYear) {
        setSelectedYear(academicYear);
        try {
          localStorage.setItem('kl_erp_year', academicYear);
        } catch {}
      }
      if (semesterId) {
        setSelectedSem(semesterId);
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
    <div className="min-h-screen flex bg-zinc-950 text-zinc-50 relative overflow-hidden font-sans">
      {/* LEFT: BRANDING PANEL (Taste-Skill asymmetric split) */}
      <div className="hidden lg:flex w-[45%] relative border-r border-zinc-900 overflow-hidden bg-zinc-900 flex-col">
        {/* Magic UI Retro Grid Background */}
        <RetroGrid className="opacity-60" />

        <div className="relative z-10 flex-1 flex flex-col p-16 justify-between">
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-xl inline-block mb-12">
              <img src="/logo.png" alt="KLH" className="h-10 object-contain" />
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl font-semibold tracking-tight text-white leading-[1.1] mb-6"
            >
              Academic sync,
              <br />
              precision engineered.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-lg text-zinc-400 max-w-md leading-relaxed"
            >
              Secure, real-time access to your timetable, profile, and
              attendance metrics directly from the core ERP.
            </motion.p>
          </div>

          {/* Material Status Chip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex items-center gap-3 px-4 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-max"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
              System Live & Secure
            </span>
          </motion.div>
        </div>
      </div>

      {/* RIGHT: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-zinc-950">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden mb-12">
            <div className="bg-white rounded-xl p-3 shadow-md inline-block">
              <img src="/logo.png" alt="KLH" className="h-8 object-contain" />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">
              Sign in
            </h2>
            <p className="text-zinc-400 text-sm">
              Enter your student credentials to continue.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="leading-tight">{error}</p>
            </motion.div>
          )}

          {status && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="leading-tight">{status}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Material-style input block */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-500">
                Student ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="210003xxxx"
                className="w-full rounded-xl px-4 py-3.5 bg-zinc-900 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3.5 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-zinc-950"
              />
              <label
                htmlFor="remember"
                className="text-sm text-zinc-400 cursor-pointer select-none"
              >
                Remember my credentials
              </label>
            </div>

            {/* Captcha Block */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-500">
                Verification
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Enter captcha"
                  className="flex-1 rounded-xl px-4 py-3.5 bg-zinc-900 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAutoSolve}
                    disabled={autoSolving || !captchaImage}
                    title="Auto-solve with OCR"
                    className="h-[52px] w-[52px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 hover:text-emerald-400 hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {autoSolving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className="h-[52px] w-[120px] rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                    {captchaLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    ) : captchaImage ? (
                      <img
                        src={captchaImage}
                        alt="Captcha"
                        className="h-full w-full object-contain mix-blend-multiply opacity-100 scale-105 filter contrast-125"
                      />
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchCaptcha()}
                    disabled={captchaLoading}
                    className="h-[52px] w-[52px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${captchaLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Material Button with Tactile Feedback */}
            <motion.button
              whileHover={{ scale: 0.995 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Continue
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
