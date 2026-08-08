'use client';
/* eslint-disable @next/next/no-img-element */

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
  Megaphone,
  Building2,
  BookOpen,
  LogOut,
  Menu,
  Bell,
  MoreHorizontal,
  X,
  ChevronLeft,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { AICopilot } from '@/components/ai/AICopilot';

/* ── Profile Avatar ── */
function ProfileAvatar({
  user,
  className = '',
  size = 'md',
}: {
  user: { id: string; initials: string; photoUrl: string };
  className?: string;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div
      className={`${dims} rounded-full bg-surface-2 flex items-center justify-center font-bold shadow-xs overflow-hidden border border-border relative ${className}`}
    >
      {user.id !== 'Student ID' && user.id !== 'Loading...' && (
        <img
          src={
            user.photoUrl
              ? user.photoUrl.startsWith('data:image/')
                ? user.photoUrl
                : `/api/fetch-photo?path=${encodeURIComponent(user.photoUrl)}`
              : `/api/fetch-photo?id=${user.id}`
          }
          alt="Profile"
          className="w-full h-full object-cover absolute inset-0 z-10"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span className="text-muted-foreground z-0 relative">{user.initials}</span>
    </div>
  );
}

/* ── Nav Items ── */
const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/dashboard/timetable', label: 'Timetable', icon: Calendar },
  { href: '/dashboard/marks', label: 'Marks', icon: Star },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/fee', label: 'Fee Details', icon: CreditCard },
  { href: '/dashboard/circulars', label: 'Circulars', icon: Megaphone },
  { href: '/dashboard/hostels', label: 'Hostel Info', icon: Building2 },
  { href: '/dashboard/library', label: 'Library', icon: BookOpen },
  { href: '/dashboard/tools', label: 'Tools', icon: CheckSquare },
];

// Bottom bar shows first 4 + More
const bottomBarItems = allNavItems.slice(0, 4);
const overflowItems = allNavItems.slice(4);

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const [user, setUser] = useState({
    name: 'Student',
    initials: 'ST',
    id: 'Loading...',
    photoUrl: '',
  });

  useEffect(() => {
    let cachedName: string | null = null;
    queueMicrotask(() => {
      cachedName = localStorage.getItem('kl_student_name');
      const cachedPhoto = localStorage.getItem('kl_student_photo') || '';
      const name = cachedName || 'Student';
      const id = localStorage.getItem('studentId') || 'Student ID';
      const initials =
        name !== 'Student'
          ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
          : 'ST';
      setUser({ name, initials, id, photoUrl: cachedPhoto });

      if (!cachedName) {
        fetch('/api/erp-proxy/profile')
          .then((res) => res.json())
          .then((data) => {
            const profileData = data.profile || data.data;
            if (data.success && profileData && profileData.name) {
              localStorage.setItem('kl_student_name', profileData.name);
              localStorage.setItem('kl_student_profile', JSON.stringify(profileData));
              if (profileData.photoUrl) {
                localStorage.setItem('kl_student_photo', profileData.photoUrl);
              }
              setUser((prev) => ({
                ...prev,
                name: profileData.name,
                initials: profileData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                photoUrl: profileData.photoUrl || '',
              }));
            }
          })
          .catch(console.warn);
      }

      // Restore sidebar collapsed state
      const savedCollapsed = localStorage.getItem('kl_sidebar_collapsed');
      if (savedCollapsed === 'true') setCollapsed(true);
    });
  }, []);

  const handleSignOut = () => {
    sessionStorage.clear();
    localStorage.removeItem('studentId');
    localStorage.removeItem('kl_student_name');
    localStorage.removeItem('kl_student_photo');
    localStorage.removeItem('kl_student_profile');
    localStorage.removeItem('kl_erp_academic_years');
    localStorage.removeItem('kl_erp_semesters');
    document.cookie = 'kl_erp_session=; Max-Age=-99999999; path=/;';
    window.location.href = '/';
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kl_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const pageTitle =
    pathname === '/dashboard'
      ? 'Overview'
      : allNavItems.find((i) => pathname.startsWith(i.href) && i.href !== '/dashboard')?.label ||
        allNavItems.find((i) => i.href === pathname)?.label ||
        'Dashboard';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex overflow-hidden">
      {/* Ambient background */}
      <div className="ambient-bg" />

      {/* ═══ MOBILE: Top Header ═══ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-[--header-height] border-b border-border glass">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-[--radius-md] hover:bg-white/8 text-muted-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="KL" className="h-6 object-contain" />
            <span className="font-bold text-sm text-foreground font-heading">KL Sync</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/circulars"
            className="relative p-2 rounded-full hover:bg-white/8 transition-colors text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </Link>
          <ProfileAvatar user={user} size="sm" />
        </div>
      </header>

      {/* ═══ MOBILE: Slide-over Drawer ═══ */}
      {sidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Close navigation overlay"
            className="fixed inset-0 bg-black/60 z-40 lg:hidden cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                setSidebarOpen(false);
              }
            }}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden flex flex-col bg-surface-0 border-r border-border animate-up">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <img src="/logo.png" alt="KL" className="h-7 object-contain" />
                <span className="font-bold text-lg text-foreground font-heading">KL Sync</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-[--radius-sm] hover:bg-white/8 text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-3 px-2 overflow-y-auto">
              <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase px-3 mb-2">
                Menu
              </div>
              {allNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[--radius-md] text-sm font-medium transition-all mb-0.5 min-h-[44px] ${
                      active
                        ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-border">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[--radius-md] text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ═══ DESKTOP: Fixed Sidebar ═══ */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full shrink-0 flex-col border-r border-border glass z-30 transition-all duration-[--duration-slow] ease-out ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        <div className={`p-4 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="KL" className="h-7 w-auto object-contain" />
              <span className="font-bold text-base text-foreground tracking-tight font-heading">
                KL Sync
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard">
              <img src="/logo.png" alt="KL" className="h-7 w-auto object-contain" />
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-1.5 rounded-[--radius-sm] hover:bg-white/8 text-muted-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${collapsed ? 'hidden' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {!collapsed && (
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase px-3 mb-2">
              Menu
            </div>
          )}
          {allNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-[--radius-md] text-sm font-medium transition-all mb-0.5 min-h-[44px] ${
                  collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
              <ProfileAvatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.id}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <ProfileAvatar user={user} size="sm" />
            </div>
          )}
          <button
            onClick={handleSignOut}
            aria-label="Sign Out"
            className={`flex items-center gap-3 w-full rounded-[--radius-md] text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE: Bottom Tab Bar ═══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-[--bottom-bar-height]">
          {bottomBarItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            aria-label="More navigation options"
            aria-controls="more-overflow-menu"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              moreOpen || overflowItems.some(i => isActive(i.href)) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>

        {/* More overflow sheet */}
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
            <div id="more-overflow-menu" className="absolute bottom-full left-0 right-0 z-40 glass border-t border-border rounded-t-[--radius-xl] p-3 animate-up">
              <div className="grid grid-cols-3 gap-1">
                {overflowItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-[--radius-md] transition-colors min-h-[44px] ${
                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium text-center">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* ═══ Main Content Area ═══ */}
      <main
        className={`flex-1 flex flex-col min-h-[100dvh] overflow-hidden relative z-10 w-full transition-all duration-[--duration-slow] ease-out ${
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-[260px]'
        }`}
        style={{
          paddingTop: 'var(--header-height)',
          paddingBottom: 'calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3 border-b border-border/50 glass-subtle z-20 shrink-0">
          <div className="flex items-center gap-3">
            {collapsed && (
              <button
                onClick={toggleCollapse}
                aria-label="Expand sidebar"
                aria-expanded={false}
                className="p-1.5 rounded-[--radius-sm] hover:bg-white/8 text-muted-foreground mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight font-heading">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="info" className="py-1 px-2.5">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="text-[10px]">Current Sem</span>
            </Badge>

            <Link
              href="/dashboard/circulars"
              className="relative p-2 rounded-full hover:bg-white/8 transition-colors text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            </Link>

            <div className="h-6 w-px bg-border mx-1" />

            <button
              type="button"
              aria-label="User profile and account options"
              onClick={() => { window.location.href = '/dashboard/profile'; }}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors min-h-[44px]"
            >
              <ProfileAvatar user={user} />
              <span className="text-sm font-medium text-foreground hidden xl:block">{user.name}</span>
            </button>
          </div>
        </header>

        {/* Target div for Skip to Content */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto relative z-10 focus:outline-hidden"
        >
          <div className="p-4 sm:p-6 lg:p-8 max-w-[--content-max-width] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Reset desktop padding (lg has no bottom bar) */}
      <style>{`
        @media (min-width: 1024px) {
          main { padding-top: 0 !important; padding-bottom: 0 !important; }
        }
      `}</style>

      {/* AI Copilot Widget */}
      <AICopilot />
    </div>
  );
}
