'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, LogIn, AlertCircle, Loader2, BookOpen, ChevronDown } from "lucide-react"
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function LoginPage() {
  const router = useRouter()
  // Login State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  
  // The ERP's signed device cookie
  const [deviceId, setDeviceId] = useState('')
  
  // App State
  const [loading, setLoading] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')
  
  // First-time ERP device registration status
  const [status, setStatus] = useState<string | null>(null)
  
  // Selection State
  const [step, setStep] = useState<'login' | 'select-sem'>('login')
  const [academicYears, setAcademicYears] = useState<{value: string, label: string}[]>([])
  const [semesters, setSemesters] = useState<{value: string, label: string}[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSem, setSelectedSem] = useState('')
  const [csrfToken, setCsrfToken] = useState('')

  const fetchCaptcha = async (preserveError = false): Promise<string> => {
    setCaptchaLoading(true)
    if (!preserveError) setError(null)
    setCaptcha('')

    try {
      const response = await fetch('/api/captcha')
      if (!response.ok) throw new Error('Failed to load captcha')

      const sid = response.headers.get('x-session-id')
      if (sid) setSessionId(sid)

      const data = await response.json()
      const originalBase64 = data.captchaImage
      setCaptchaImage(originalBase64)

      // Auto-solve logic
      try {
        const res = await fetch('/api/solve-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: originalBase64 }),
        })
        const data = await res.json()
        if (data.success && data.text) {
          setCaptcha(data.text)
          return data.text
        }
      } catch (e) {
        console.error('Captcha auto-solve failed', e)
      }
      return ''
    } catch (err) {
      console.error(err)
      setError('Failed to load CAPTCHA. Please try again.')
      return ''
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    fetchCaptcha()
    try {
      const savedDevice = localStorage.getItem('kl_erp_device_id')
      if (savedDevice) setDeviceId(savedDevice)
    } catch {}
    
    const savedUser = Cookies.get('remember_username')
    const savedPass = Cookies.get('remember_password')
    if (savedUser && savedPass) {
      setUsername(savedUser)
      setPassword(savedPass)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!username || !password || !captcha) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          username,
          password,
          captcha,
          deviceId: deviceId || (typeof localStorage !== 'undefined' ? localStorage.getItem('kl_erp_device_id') : '') || ''
        })
      })

      const data = await response.json()

      if (data.deviceId) {
        setDeviceId(data.deviceId)
        try { localStorage.setItem('kl_erp_device_id', data.deviceId) } catch {}
      }

      if (data.needsCaptchaRetry) {
        setError(null)
        setStatus('First-time setup on this device: please enter the captcha once more to finish signing in. This only happens once per device.')
        await fetchCaptcha(true)
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      if (rememberMe) {
        Cookies.set('remember_username', username, { expires: 30 })
        Cookies.set('remember_password', password, { expires: 30 })
      } else {
        Cookies.remove('remember_username')
        Cookies.remove('remember_password')
      }

      // Set Options
      if (data.sessionId) setSessionId(data.sessionId)
      setAcademicYears(data.academicYears || [])
      setSemesters(data.semesters || [])
      setCsrfToken(data.csrfToken || '')

      // Auto-select the correct academic year and semester
      let academicYear = '';
      if (data.academicYears && data.academicYears.length > 0) {
        const sortedYears = [...data.academicYears].sort((a: any, b: any) => b.label.localeCompare(a.label));
        academicYear = sortedYears[0].value;
      }
      
      let semesterId = '';
      if (data.semesters && data.semesters.length > 0) {
        const evenSem = data.semesters.find((s: any) => s.label.toLowerCase().includes('even'));
        if (evenSem) {
          semesterId = evenSem.value;
        } else {
          semesterId = data.semesters[0].value; // fallback to the first one (usually latest if descending)
        }
      }

      if (academicYear) setSelectedYear(academicYear)
      if (semesterId) setSelectedSem(semesterId)

      setStep('select-sem')
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      await fetchCaptcha(true)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setStatus('Fetching attendance data...')
    
    try {
      const fetchResponse = await fetch('/api/fetch-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          csrfToken,
          academicYear: selectedYear,
          semesterId: selectedSem
        })
      })

      const fetchResult = await fetchResponse.json()
      
      if (!fetchResponse.ok || !fetchResult.success) {
         throw new Error(fetchResult.message || 'Failed to fetch attendance data')
      }
      
      if (!fetchResult.attendanceData || fetchResult.attendanceData.length === 0) {
         throw new Error('No results found for this Academic Year/Semester.')
      }

      // Save the fetched data and route to dashboard
      localStorage.setItem('attendanceData', JSON.stringify(fetchResult))
      localStorage.setItem('studentId', username)
      
      router.push('/')
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      await fetchCaptcha(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-stretch bg-background relative overflow-hidden">

      {/* AMBIENT MESH */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] bg-indigo-600 ambient-blob blob-1" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-violet-600 ambient-blob blob-2" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-700 ambient-blob blob-3" />
      </div>

      {/* BRANDING PANEL (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Glow behind the card */}
        <div className="absolute top-[30%] left-[30%] w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[30%] right-[30%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Minimalist Glass Card */}
        <div className="w-full max-w-[420px] backdrop-blur-xl bg-white/[0.02] border border-white/[0.07] p-8 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] space-y-8 relative z-10">
          
          {/* Logo / Badge */}
          <div className="flex justify-between items-center">
            <div className="bg-white rounded-xl p-2 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="KLH" className="h-7 object-contain" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Live Link</span>
            </div>
          </div>

          {/* Announcements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/60">
                Announcements
              </h3>
              <span className="text-[9px] text-foreground/30 font-mono">2 Active</span>
            </div>

            {/* List */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-1.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">System Info</span>
                  <span className="text-[9px] text-foreground/30 font-mono">Today</span>
                </div>
                <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                  AY 2025-2026 Even Semester registration data is live. Real-time LTPS simulator is fully synced.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-1.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-violet-400 font-semibold uppercase tracking-wider">Security</span>
                  <span className="text-[9px] text-foreground/30 font-mono">Yesterday</span>
                </div>
                <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                  All credentials and session data are stored locally in your browser storage. No data is stored on remote servers.
                </p>
              </div>
            </div>
          </div>
          
        </div>

      </div>

      {/* LOGIN PANEL */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:max-w-[480px] w-full">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <div className="bg-white rounded-xl p-2.5 shadow-md inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="KLH" className="h-8 object-contain" />
          </div>
        </div>

        <div className="w-full max-w-[400px] up">

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">Welcome back</h2>
            <p className="text-sm" style={{ color: 'rgba(241,241,243,0.45)' }}>Sign in to view your attendance report</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm up"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#FCA5A5' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {status && !error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm up"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#A5B4FC' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{status}</p>
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Student ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(241,241,243,0.45)' }}>Student ID</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="210003xxxx"
                  className="w-full rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-foreground/20 focus:outline-none transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(241,241,243,0.45)' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-indigo-500"
                  style={{ accentColor: '#6366F1' }}
                />
                <label htmlFor="remember" className="text-xs cursor-pointer select-none" style={{ color: 'rgba(241,241,243,0.45)' }}>
                  Remember my credentials
                </label>
              </div>

              {/* Captcha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(241,241,243,0.45)' }}>Verification</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={captcha}
                    onChange={e => setCaptcha(e.target.value)}
                    placeholder="Auto-solving..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-foreground/20 focus:outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-[46px] w-[100px] rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {captchaLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(241,241,243,0.3)' }} />
                        : captchaImage
                          ? <img src={captchaImage} alt="Captcha" className="h-full w-full object-contain mix-blend-screen opacity-90 scale-95" />  // eslint-disable-line @next/next/no-img-element
                          : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchCaptcha()}
                      disabled={captchaLoading}
                      className="p-3 rounded-xl transition-all duration-200 hover:scale-95 active:scale-90 cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <RefreshCw className={`w-4 h-4 ${captchaLoading ? 'animate-spin' : ''}`} style={{ color: 'rgba(241,241,243,0.5)' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[0.99] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Continue</>}
              </button>

              <p className="text-center text-[11px] pt-3 border-t" style={{ color: 'rgba(241,241,243,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}>
                Connects directly to the KL University ERP system
              </p>
            </form>
          ) : (
            <form onSubmit={handleFetchAttendance} className="space-y-4">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-foreground mb-1">Select Period</h3>
                <p className="text-xs" style={{ color: 'rgba(241,241,243,0.4)' }}>Choose the academic year and semester to load.</p>
              </div>

              {/* Year select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(241,241,243,0.45)' }}>Academic Year</label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none transition-all duration-200 appearance-none cursor-pointer pr-10"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {academicYears.map(o => <option key={o.value} value={o.value} className="bg-[#0c0c0e]">{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(241,241,243,0.3)' }} />
                </div>
              </div>

              {/* Semester select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(241,241,243,0.45)' }}>Semester</label>
                <div className="relative">
                  <select
                    value={selectedSem}
                    onChange={e => setSelectedSem(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none transition-all duration-200 appearance-none cursor-pointer pr-10"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {semesters.map(o => <option key={o.value} value={o.value} className="bg-[#0c0c0e]">{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(241,241,243,0.3)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[0.99] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Attendance'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('login'); setStatus(null); setError(null) }}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[0.99] active:scale-[0.97] cursor-pointer"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(241,241,243,0.5)' }}
              >
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
