'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { LogOut, GraduationCap, TrendingUp, TrendingDown, Minus, BookOpen, Search, X, Calculator, Plus, RotateCcw } from 'lucide-react'


const AttendanceDataSchema = z.object({
  attendanceData: z.array(z.record(z.string(), z.any())).min(1)
}).passthrough()

// ── types ──────────────────────────────────────────────
type Component = { weight: number; attended: number; conducted: number }
type Course = {
  code: string
  description: string
  components: Record<string, Component>
  pct: number
}

// ── helpers ─────────────────────────────────────────────
const STATUS = (p: number) =>
  p >= 85
    ? { label: 'Eligible',     color: '#34D399', bg: 'rgba(52,211,153,.09)',  border: 'rgba(52,211,153,.28)',  Icon: TrendingUp   }
  : p >= 75
    ? { label: 'Condonation',  color: '#FBBF24', bg: 'rgba(251,191,36,.09)', border: 'rgba(251,191,36,.28)',  Icon: Minus        }
    : { label: 'Not Eligible', color: '#F87171', bg: 'rgba(248,113,113,.09)',border: 'rgba(248,113,113,.28)', Icon: TrendingDown  }

function parse(raw: any[]): Course[] {
  const r0 = raw[0], keys = Object.keys(r0)
  const codeKey     = keys.find(k => /code/i.test(k))
  const descKey     = keys.find(k => /description|title|name|subject|course/i.test(k) && !/code/i.test(k) && k !== codeKey)
                   ?? keys.find(k => k !== codeKey && !/ltps|total|present/i.test(k))
  const ltpsKey     = keys.find(k => /ltps|structure|periods/i.test(k))
  const attendedKey = keys.find(k => /attended|present/i.test(k))
  const conductedKey= keys.find(k => /conducted|total|held/i.test(k))

  const groups: Record<string, any[]> = {}
  raw.forEach(row => {
    const key = row[codeKey ?? ''] || row[descKey ?? ''] || 'Unknown'
    ;(groups[key] ??= []).push(row)
  })

  return Object.entries(groups).map(([code, rows]) => {
    const components: Record<string, Component> = {
      Lecture:   { weight: 1.0,  attended: 0, conducted: 0 },
      Tutorial:  { weight: 0.25, attended: 0, conducted: 0 },
      Practical: { weight: 0.5,  attended: 0, conducted: 0 },
      Skilling:  { weight: 0.25, attended: 0, conducted: 0 },
    }
    rows.forEach(row => {
      const t = (row[ltpsKey ?? ''] || '').toLowerCase()
      const type = t.includes('lecture')||t.startsWith('l') ? 'Lecture'
        : t.includes('tutorial')||t.startsWith('t') ? 'Tutorial'
        : t.includes('practical')||t.startsWith('p') ? 'Practical'
        : 'Skilling'
      components[type].attended  += parseFloat(row[attendedKey  ?? '']) || 0
      components[type].conducted += parseFloat(row[conductedKey ?? '']) || 0
    })
    let ws = 0, wt = 0
    Object.values(components).forEach(c => {
      if (c.conducted > 0) { ws += (c.attended / c.conducted) * c.weight; wt += c.weight }
    })
    return { code, description: rows[0][descKey ?? ''] || code, components, pct: wt > 0 ? (ws / wt) * 100 : 0 }
  })
}

// ── component ────────────────────────────────────────────
export function ERPDashboard() {
  const router = useRouter()
  const [info, setInfo] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [studentId, setStudentId] = useState<string>('Student')

  useEffect(() => {
    const raw = localStorage.getItem('attendanceData')
    if (!raw) { router.push('/login'); return }

    try {
      const parsedRaw = JSON.parse(raw)
      const data = AttendanceDataSchema.parse(parsedRaw)
      setInfo(data)
      setCourses(parse(data.attendanceData))
    } catch (e) {
      console.error('Invalid attendance data:', e)
      localStorage.removeItem('attendanceData')
      router.push('/login')
      return
    }

    const storedId = localStorage.getItem('studentId')
    if (storedId) setStudentId(storedId)
  }, [router])

  const logout = () => {
    localStorage.removeItem('attendanceData')
    localStorage.removeItem('studentId')
    router.push('/login')
  }

  if (!info) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: 'rgba(239,239,239,.3)', fontFamily: 'monospace', fontSize: '.8rem' }}>
      Loading ERP data…
    </div>
  )

  const overall = courses.length ? courses.reduce((s, c) => s + c.pct, 0) / courses.length : 0
  const eligible = courses.filter(c => c.pct >= 85).length
  const atRisk   = courses.filter(c => c.pct < 75).length
  
  // Filter search
  const filteredCourses = courses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sel = active !== null ? courses[active] : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      {/* ── Ambient ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="blob blob-a" style={{ width: 650, height: 650, top: '-12%', left: '-8%',  background: '#4F46E5' }} />
        <div className="blob blob-b" style={{ width: 550, height: 550, bottom: '-8%', right: '-5%', background: '#7C3AED' }} />
        <div className="blob blob-c" style={{ width: 350, height: 350, top: '45%',   left: '38%', background: '#2563EB' }} />
      </div>

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,.07)', background: 'rgba(7,7,10,.8)', backdropFilter: 'blur(14px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)' }}>
            <GraduationCap size={15} style={{ color: '#818CF8' }} />
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: '#EFEFEF' }}>{studentId}</p>
            <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'rgba(239,239,239,.35)' }}>
              {info?.attendanceData?.[0]?.Year || '2025-2026'} · {info?.attendanceData?.[0]?.Semester || 'Even Sem'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm font-bold font-mono" style={{ color: STATUS(overall).color }}>{overall.toFixed(1)}% avg</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: '#F87171' }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden w-full">

        {/* Sidebar — course list (only shown when a course is selected) */}
        {sel && (
          <aside className="w-72 shrink-0 flex flex-col border-r overflow-hidden up" style={{ borderColor: 'rgba(255,255,255,.06)', background: 'rgba(255,255,255,.012)' }}>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
              {[
                { label: 'Courses', val: courses.length, color: '#818CF8' },
                { label: 'Eligible', val: eligible, color: '#34D399' },
                { label: 'At Risk', val: atRisk, color: '#F87171' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center py-3 px-2 border-r last:border-r-0" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                  <span className="text-xl font-bold font-mono leading-none" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-[9px] mt-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(239,239,239,.3)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Search bar */}
            <div className="p-3 border-b flex items-center relative" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
              <Search className="absolute left-6 w-3.5 h-3.5" style={{ color: 'rgba(239,239,239,.35)' }} />
              <input 
                type="text" 
                placeholder="Search courses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-indigo-500/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-6 p-1 rounded-full hover:bg-white/5 cursor-pointer">
                  <X size={10} style={{ color: 'rgba(239,239,239,.5)' }} />
                </button>
              )}
            </div>

            {/* Course list scrollable container */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              {filteredCourses.length === 0 ? (
                <div className="p-6 text-center text-xs" style={{ color: 'rgba(239,239,239,.3)' }}>No matching courses</div>
              ) : filteredCourses.map((c, idx) => {
                const originalIndex = courses.findIndex(orig => orig.code === c.code)
                const s = STATUS(c.pct)
                const isActive = active === originalIndex
                return (
                  <button key={c.code} onClick={() => setActive(isActive ? null : originalIndex)}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all cursor-pointer border-b"
                    style={{
                      background: isActive ? 'rgba(99,102,241,.09)' : 'transparent',
                      borderLeft: `3px solid ${isActive ? '#6366F1' : s.color}`,
                      borderColor: 'rgba(255,255,255,.02)'
                    }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono truncate" style={{ color: 'rgba(239,239,239,.4)' }}>{c.code}</p>
                      <p className="text-xs font-semibold leading-tight truncate mt-0.5" style={{ color: isActive ? '#FFFFFF' : '#EFEFEF' }}>{c.description || c.code}</p>
                    </div>
                    <span className="text-xs font-bold font-mono shrink-0" style={{ color: s.color }}>{c.pct.toFixed(0)}%</span>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        {/* Main Panel - Responsive Master-Detail */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar w-full">
          {sel ? (
            /* WIDESCREEN detail view next to sidebar */
            <div className="w-full max-w-4xl mx-auto">
              <DetailView course={sel} onClose={() => setActive(null)} />
            </div>
          ) : (
            /* Grid overview when no course is active */
            <div className="up w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(239,239,239,.4)' }}>Dashboard Overview</h2>
                <span className="text-xs font-mono" style={{ color: 'rgba(239,239,239,.3)' }}>Select a course to open live simulator</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map((c, i) => {
                  const s = STATUS(c.pct)
                  return (
                    <button key={c.code} onClick={() => setActive(i)}
                      className="card text-left p-4 flex flex-col gap-3 cursor-pointer relative overflow-hidden shine-on-hover up"
                      style={{ animationDelay: `${i * 0.04}s` }}>
                      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background: s.color, borderRadius:'4px 0 0 4px' }} />
                      <div className="pl-2 flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono uppercase tracking-widest truncate" style={{ color: 'rgba(239,239,239,.35)' }}>{c.code}</p>
                          <p className="text-sm font-semibold mt-0.5 leading-snug line-clamp-2" style={{ color: '#EFEFEF' }}>{c.description || c.code}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-2xl font-bold font-mono leading-none" style={{ color: s.color }}>{c.pct.toFixed(0)}%</p>
                          <span className="badge mt-1.5" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
                        </div>
                      </div>
                      <div className="pl-2">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${Math.min(c.pct, 100)}%`, background: `linear-gradient(90deg,${s.color}99,${s.color})`, boxShadow: `0 0 6px ${s.color}55` }} />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ── Detail panel with Live Simulator ─────────────────────────────────────────
function DetailView({ course, onClose }: { course: Course; onClose: () => void }) {
  const [simAttended, setSimAttended] = useState<Record<string, number>>({})
  const [simConducted, setSimConducted] = useState<Record<string, number>>({})
  const [isSimulating, setIsSimulating] = useState(false)

  const s = STATUS(course.pct)
  const active = Object.entries(course.components).filter(([, v]) => v.conducted > 0)

  // Reset simulator when course changes
  useEffect(() => {
    setSimAttended({})
    setSimConducted({})
    setIsSimulating(false)
  }, [course])

  const handleSimulate = (key: string, type: 'attended' | 'conducted', operation: 'add' | 'sub') => {
    setIsSimulating(true)
    const currentAttended = simAttended[key] ?? course.components[key].attended
    const currentConducted = simConducted[key] ?? course.components[key].conducted
    
    if (type === 'attended') {
      if (operation === 'add') {
        setSimAttended(prev => ({ ...prev, [key]: currentAttended + 1 }))
        // Attended cannot exceed conducted
        if (currentAttended + 1 > currentConducted) {
          setSimConducted(prev => ({ ...prev, [key]: currentAttended + 1 }))
        }
      } else {
        setSimAttended(prev => ({ ...prev, [key]: Math.max(0, currentAttended - 1) }))
      }
    } else {
      if (operation === 'add') {
        setSimConducted(prev => ({ ...prev, [key]: currentConducted + 1 }))
      } else {
        const nextConducted = Math.max(1, currentConducted - 1)
        setSimConducted(prev => ({ ...prev, [key]: nextConducted }))
        // Attended cannot exceed conducted
        if (currentAttended > nextConducted) {
          setSimAttended(prev => ({ ...prev, [key]: nextConducted }))
        }
      }
    }
  }

  const resetSimulation = () => {
    setSimAttended({})
    setSimConducted({})
    setIsSimulating(false)
  }

  // Calculate live values based on simulation
  let ws = 0, wt = 0
  active.forEach(([key, val]) => {
    const att = simAttended[key] ?? val.attended
    const cond = simConducted[key] ?? val.conducted
    if (cond > 0) {
      ws += (att / cond) * val.weight
      wt += val.weight
    }
  })
  const simulatedPct = wt > 0 ? (ws / wt) * 100 : 0
  const simStatus = STATUS(simulatedPct)


  return (
    <div className="up w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          style={{ color: 'rgba(239,239,239,.4)' }}>
          <span>&larr;</span> Back
        </button>
        {isSimulating && (
          <button onClick={resetSimulation} className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-indigo-400 hover:text-indigo-300">
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      {/* Header card with compare overlay */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', background: isSimulating ? simStatus.color : s.color, borderRadius:'4px 0 0 4px' }} />
        <div className="pl-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={13} style={{ color: 'rgba(239,239,239,.35)' }} />
              <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'rgba(239,239,239,.4)' }}>{course.code}</span>
            </div>
            <h2 className="text-base font-bold leading-snug" style={{ color: '#EFEFEF' }}>{course.description || course.code}</h2>
          </div>
          
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-baseline gap-2">
              {isSimulating && (
                <span className="text-xs font-mono line-through opacity-40">
                  {course.pct.toFixed(0)}%
                </span>
              )}
              <span className="text-3xl font-bold font-mono leading-none" style={{ color: isSimulating ? simStatus.color : s.color }}>
                {simulatedPct.toFixed(1)}%
              </span>
            </div>
            <span className="badge" style={{ 
              color: isSimulating ? simStatus.color : s.color, 
              background: isSimulating ? simStatus.bg : s.bg, 
              borderColor: isSimulating ? simStatus.border : s.border 
            }}>
              {isSimulating ? `${simStatus.label} (Sim)` : s.label}
            </span>
          </div>
        </div>
        
        <div className="pl-3 mt-4">
          <div className="progress-track" style={{ height: 6 }}>
            <div className="progress-fill" style={{ 
              width: `${Math.min(simulatedPct,100)}%`, 
              background: `linear-gradient(90deg,${isSimulating ? simStatus.color : s.color}88,${isSimulating ? simStatus.color : s.color})` 
            }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] font-mono" style={{ color: 'rgba(239,239,239,.2)' }}>0%</span>
            <span className="text-[9px] font-mono" style={{ color: 'rgba(239,239,239,.2)' }}>75%</span>
            <span className="text-[9px] font-mono" style={{ color: 'rgba(239,239,239,.2)' }}>85%</span>
            <span className="text-[9px] font-mono" style={{ color: 'rgba(239,239,239,.2)' }}>100%</span>
          </div>
        </div>
      </div>

      {/* Interactive Components List */}
      <div className="space-y-3 mb-4">
        {active.map(([key, val]) => {
          const att = simAttended[key] ?? val.attended
          const cond = simConducted[key] ?? val.conducted
          const cpct = cond > 0 ? (att / cond) * 100 : 0
          const cs = STATUS(cpct)
          
          return (
            <div key={key} className="card p-3.5 flex items-center justify-between gap-4 transition-all">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(239,239,239,.8)' }}>{key}</span>
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(239,239,239,.3)' }}>({Math.round(val.weight*100)}% weight)</span>
                </div>
                
                {/* Stats row */}
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold font-mono" style={{ color: '#EFEFEF' }}>{att}/{cond}</span>
                  <span className="text-xs font-semibold font-mono" style={{ color: cs.color }}>{cpct.toFixed(0)}%</span>
                </div>
              </div>

              {/* Simulation controls */}
              <div className="flex items-center gap-2">
                
                {/* Attended Control */}
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-mono uppercase opacity-30 mb-0.5">Attended</span>
                  <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
                    <button onClick={() => handleSimulate(key, 'attended', 'sub')} className="px-2 py-1 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer text-xs transition-colors">-</button>
                    <button onClick={() => handleSimulate(key, 'attended', 'add')} className="px-2 py-1 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer text-xs transition-colors border-l" style={{ borderColor: 'rgba(255,255,255,.08)' }}>+</button>
                  </div>
                </div>

                {/* Conducted Control */}
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-mono uppercase opacity-30 mb-0.5">Conducted</span>
                  <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
                    <button onClick={() => handleSimulate(key, 'conducted', 'sub')} className="px-2 py-1 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer text-xs transition-colors">-</button>
                    <button onClick={() => handleSimulate(key, 'conducted', 'add')} className="px-2 py-1 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer text-xs transition-colors border-l" style={{ borderColor: 'rgba(255,255,255,.08)' }}>+</button>
                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {/* Simulator indicator strip */}
      {isSimulating && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-medium"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
          <Calculator size={13} className="shrink-0" />
          <span>Live Simulation Active. Calculations show potential outcomes.</span>
        </div>
      )}

    </div>
  )
}
