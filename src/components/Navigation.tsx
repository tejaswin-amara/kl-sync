"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  CheckSquare, 
  Star, 
  Calendar, 
  CreditCard, 
  Armchair, 
  Megaphone, 
  Building2, 
  BookOpen, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState({ name: 'Student', initials: 'ST', id: 'Loading...' });

  useEffect(() => {
    const cachedName = localStorage.getItem('kl_student_name');
    const name = cachedName || 'Student';
    const id = localStorage.getItem('studentId') || 'Student ID';
    const initials = name !== 'Student' 
      ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
      : 'ST';
    setUser({ name, initials, id });

    if (!cachedName) {
      fetch('/api/fetch-profile').then(res => res.json()).then(data => {
        if (data.success && data.profile && data.profile.name) {
          localStorage.setItem('kl_student_name', data.profile.name);
          localStorage.setItem('kl_student_profile', JSON.stringify(data.profile));
          setUser(prev => ({ 
            ...prev, 
            name: data.profile.name,
            initials: data.profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
          }));
        }
      }).catch(() => {});
    }

    // Global interceptor for API session expiration
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = args[0] as string;
      if (url && url.startsWith && url.startsWith('/api/fetch-')) {
        const ct = response.headers.get('content-type') || '';
        if (response.status === 401 || (!ct.includes('application/json') && response.status !== 500)) {
           window.location.href = '/';
        }
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  const handleSignOut = () => {
    sessionStorage.clear();
    localStorage.removeItem('studentId');
    localStorage.removeItem('kl_student_name');
    localStorage.removeItem('kl_student_profile');
    document.cookie = "kl_erp_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/';
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/attendance', label: 'Attendance', icon: CheckSquare },
    { href: '/dashboard/marks', label: 'Marks', icon: Star },
    { href: '/dashboard/timetable', label: 'Timetable', icon: Calendar },
    { href: '/dashboard/fee', label: 'Fee Details', icon: CreditCard },
    { href: '/dashboard/exam-seating', label: 'Exams', icon: Armchair },
    { href: '/dashboard/circulars', label: 'Circulars', icon: Megaphone },
    { href: '/dashboard/hostels', label: 'Hostel Info', icon: Building2 },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard/tools', label: 'Tools & Calcs', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex overflow-hidden">
      
      {/* Ambient background matching kl-attendance-v2 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full blur-[100px] bg-indigo-500 top-[10%] left-[20%] w-[30vw] h-[30vw]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], translate: ['0%', '-10%', '0%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute rounded-full blur-[120px] bg-purple-500 top-[40%] right-[10%] w-[25vw] h-[25vw]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, -90, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute rounded-full blur-[100px] bg-emerald-500 bottom-[10%] left-[30%] w-[35vw] h-[35vw]" 
        />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="w-5 h-5 text-zinc-300" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="KL" className="h-6 object-contain" />
            <span className="font-bold text-sm text-zinc-100">KL Sync</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/dashboard/circulars" className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-300">
             <Bell className="w-4 h-4" />
             <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
           </Link>
           <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-white/10 relative">
             {user.id !== 'Student ID' && user.id !== 'Loading...' && (
               <img 
                 src={`/api/fetch-photo?id=${user.id}`} 
                 alt="Profile" 
                 className="w-full h-full object-cover absolute inset-0 z-10"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
             )}
             <span className="text-zinc-400 z-0 relative">{user.initials}</span>
           </div>
        </div>
      </header>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <AnimatePresence>
        {(drawerOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <>
            {/* Backdrop for mobile */}
            {drawerOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
            )}

            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed lg:static top-0 left-0 h-full w-[280px] shrink-0 flex flex-col border-r z-50 ${
                drawerOpen ? 'shadow-2xl' : ''
              }`}
              style={{ borderColor: 'rgba(255,255,255,.06)', background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(20px)' }}
            >
              
              <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                <div className="flex items-center justify-between mb-6">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <img src="/logo.png" alt="KL" className="h-8 w-auto object-contain" />
                    <span className="font-bold text-lg text-zinc-100 tracking-tight">KL Sync</span>
                  </Link>
                  <button className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-white/10 text-zinc-400" onClick={() => setDrawerOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden border border-white/10 relative shrink-0">
                    {user.id !== 'Student ID' && user.id !== 'Loading...' && (
                      <img 
                        src={`/api/fetch-photo?id=${user.id}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover absolute inset-0 z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-zinc-400 z-0 relative">{user.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-zinc-100 truncate">{user.name}</h2>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{user.id}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 py-2 px-3 flex flex-col justify-between [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 shrink-0">Menu</div>
                <div className="flex-1 flex flex-col gap-1 mt-2 mb-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`w-full text-left px-3 flex-1 flex items-center gap-3 transition-all cursor-pointer rounded-xl text-[14px] font-medium ${
                          isActive 
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]' 
                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-indigo-400' : 'text-zinc-500'} shrink-0`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-1 flex items-center gap-2.5 transition-all cursor-pointer rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-full pt-[60px] lg:pt-0">
        
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm z-20 shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              {pathname === '/dashboard' ? 'Overview' : navItems.find(i => pathname.startsWith(i.href) && i.href !== '/dashboard')?.label || navItems.find(i => i.href === pathname)?.label}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold transition-all hover:bg-indigo-500/20">
               <Calendar className="w-3.5 h-3.5" />
               Current Sem
            </button>
            <Link href="/dashboard/circulars" className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 bg-white/5 border border-white/5">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </Link>
            <div className="h-8 w-px bg-white/10 mx-1"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-white/10 relative shrink-0">
                {user.id !== 'Student ID' && user.id !== 'Loading...' && (
                  <img 
                    src={`/api/fetch-photo?id=${user.id}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <span className="text-zinc-400 z-0 relative">{user.initials}</span>
              </div>
              <span className="text-sm font-semibold text-zinc-100 hidden sm:block">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}


