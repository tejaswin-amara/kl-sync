'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
} from '@/components/ui/icons';

import { Badge } from '@/components/ui/badge';
import { AICopilot } from '@/components/ai/AICopilot';
import { triggerHaptic } from '@/lib/fluid-motion';
import { prefetchAllUserData } from '@/lib/data-prefetcher';
import { useI18n } from '@/lib/i18n';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ComplianceModal } from '@/components/compliance/ComplianceModal';

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
  const computedPhotoSrc = useMemo(() => {
    if (!user.photoUrl) {
      return `/api/fetch-photo?id=${encodeURIComponent(user.id)}`;
    }
    if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(user.photoUrl)) {
      return user.photoUrl;
    }
    const cleanPath = user.photoUrl.startsWith('/') ? user.photoUrl : '/' + user.photoUrl;
    return `/api/fetch-photo?path=${encodeURIComponent(cleanPath)}`;
  }, [user.photoUrl, user.id]);

  return (
    <div
      className={`${dims} rounded-full bg-surface-2 flex items-center justify-center font-bold shadow-xs overflow-hidden border border-white/10 relative ${className}`}
    >
      {user.id !== 'Student ID' && user.id !== 'Loading...' && (
        <img
          src={computedPhotoSrc}
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

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const pathname = usePathname();

  const [user, setUser] = useState({
    name: 'Student',
    initials: 'ST',
    id: 'Loading...',
    photoUrl: '',
  });

  const allNavItems = useMemo(
    () => [
      { href: '/dashboard', label: t('dashboard', 'Dashboard'), icon: LayoutDashboard },
      { href: '/dashboard/attendance', label: t('attendance', 'Attendance'), icon: CheckSquare },
      { href: '/dashboard/timetable', label: t('timetable', 'Timetable'), icon: Calendar },
      { href: '/dashboard/marks', label: t('marks', 'Marks'), icon: Star },
      { href: '/dashboard/profile', label: t('profile', 'Profile'), icon: User },
      { href: '/dashboard/fee', label: t('fee', 'Fee Details'), icon: CreditCard },
      { href: '/dashboard/circulars', label: t('circulars', 'Circulars'), icon: Megaphone },
      { href: '/dashboard/hostels', label: t('hostels', 'Hostel Info'), icon: Building2 },
      { href: '/dashboard/library', label: t('library', 'Library'), icon: BookOpen },
      { href: '/dashboard/tools', label: t('tools', 'Tools'), icon: CheckSquare },
    ],
    [t]
  );

  const bottomBarItems = allNavItems.slice(0, 4);
  const overflowItems = allNavItems.slice(4);

  useEffect(() => {
    // 1. Kick off instant background prefetch for zero-loading navigation
    void prefetchAllUserData();

    // 2. Load user profile metadata
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
    triggerHaptic('warning');
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
    triggerHaptic('selection');
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
      ? t('dashboard', 'Overview')
      : allNavItems.find((i) => pathname.startsWith(i.href) && i.href !== '/dashboard')?.label ||
        allNavItems.find((i) => i.href === pathname)?.label ||
        'Dashboard';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex overflow-hidden">
      {/* ═══ MOBILE: Top Navigation Header ═══ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-[--header-height] border-b border-white/8 apple-chrome z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSidebarOpen(true);
            }}
            className="p-2 rounded-full hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation active:scale-90"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar-drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="KL" className="h-6 w-auto object-contain" />
            <span className="font-bold text-sm tracking-tight font-heading">
              KL Sync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setComplianceOpen(true);
            }}
            className="p-2 rounded-full hover:bg-white/8 text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation active:scale-90"
            aria-label="Compliance and Privacy"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <LanguageSelector />
          <Link
            href="/dashboard/profile"
            aria-label="Student profile"
            onClick={() => triggerHaptic('selection')}
            className="touch-manipulation active:scale-90 transition-transform p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ProfileAvatar user={user} size="sm" />
          </Link>
        </div>
      </header>

      {/* ═══ MOBILE: Drawer Backdrop & Panel ═══ */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            id="mobile-sidebar-drawer"
            className="lg:hidden fixed top-0 left-0 bottom-0 w-72 apple-chrome border-r border-white/10 z-50 flex flex-col p-4 animate-drawer-enter"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="KL" className="h-7 w-auto object-contain" />
                <span className="font-bold text-base tracking-tight font-heading">
                  KL Sync
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation active:scale-90"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile snapshot */}
            <div className="flex items-center gap-3 py-3 border-b border-white/8">
              <ProfileAvatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{user.id}</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 py-3 overflow-y-auto space-y-1 custom-scrollbar">
              {allNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[--radius-md] text-sm font-medium transition-all min-h-[44px] touch-manipulation active:scale-95 ${
                      active
                        ? 'bg-primary/20 text-primary border border-primary/30 font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/6'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSidebarOpen(false);
                  setComplianceOpen(true);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[--radius-md] text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all min-h-[44px] w-full text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="truncate">{t('compliance', 'Privacy & Compliance')}</span>
              </button>
            </nav>

            {/* Drawer Footer: Sign Out */}
            <div className="pt-3 border-t border-white/8">
              <button
                onClick={handleSignOut}
                aria-label="Sign Out"
                className="flex items-center gap-3 px-3 py-2.5 rounded-[--radius-md] text-sm font-medium text-destructive hover:bg-destructive/15 transition-colors w-full cursor-pointer touch-manipulation active:scale-95 min-h-[44px]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{t('logout', 'Sign Out')}</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ═══ DESKTOP: Sidebar ═══ */}
      <aside
        className={`hidden lg:flex flex-col border-r border-white/8 apple-chrome transition-all duration-[--duration-normal] ease-[--ease-spring-default] shrink-0 z-30 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-[--header-height] flex items-center justify-between px-4 border-b border-white/8">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5 touch-manipulation active:scale-95 transition-transform" onClick={() => triggerHaptic('selection')}>
              <img src="/logo.png" alt="KL" className="h-7 w-auto object-contain" />
              <span className="font-bold text-base text-foreground tracking-tight font-heading">
                KL Sync
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" onClick={() => triggerHaptic('selection')}>
              <img src="/logo.png" alt="KL" className="h-7 w-auto object-contain" />
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-2 rounded-full hover:bg-white/8 text-muted-foreground hover:text-foreground transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation active:scale-90 ${collapsed ? 'hidden' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar">
          {!collapsed && (
            <div className="caption-label text-muted-foreground/80 px-3 mb-2">
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
                onClick={() => triggerHaptic('selection')}
                className={`flex items-center gap-3 rounded-[--radius-md] text-sm font-medium transition-all mb-1 min-h-[44px] touch-manipulation active:scale-[0.98] ${
                  collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-primary/20 text-primary border border-primary/30 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/6'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setComplianceOpen(true);
            }}
            title={collapsed ? 'Privacy & Compliance' : undefined}
            className={`flex items-center gap-3 rounded-[--radius-md] text-sm font-medium transition-all mb-1 min-h-[44px] w-full text-emerald-400 hover:bg-emerald-500/10 cursor-pointer ${
              collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            {!collapsed && <span className="truncate text-xs font-semibold">{t('compliance', 'Privacy & Compliance')}</span>}
          </button>
        </nav>

        <div className="p-3 border-t border-white/8 space-y-2">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-1.5 mb-1">
              <ProfileAvatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{user.id}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-1">
              <ProfileAvatar user={user} size="sm" />
            </div>
          )}
          <button
            onClick={handleSignOut}
            aria-label="Sign Out"
            className={`flex items-center gap-3 w-full rounded-[--radius-md] text-sm font-medium text-destructive hover:bg-destructive/15 transition-colors cursor-pointer touch-manipulation active:scale-95 ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>{t('logout', 'Sign Out')}</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE: Bottom Tab Bar ═══ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 apple-chrome-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-[--bottom-bar-height]">
          {bottomBarItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => triggerHaptic('selection')}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all touch-manipulation active:scale-90 ${
                  active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-[--duration-fast] ${active ? 'scale-110' : ''}`} />
                <span className="text-[10px] tracking-tight">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setMoreOpen(!moreOpen);
            }}
            aria-expanded={moreOpen}
            aria-label="More navigation options"
            aria-controls="more-overflow-menu"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all touch-manipulation active:scale-90 cursor-pointer ${
              moreOpen || overflowItems.some((i) => isActive(i.href))
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>

        {/* More overflow sheet */}
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
            <div
              id="more-overflow-menu"
              className="absolute bottom-full left-0 right-0 z-40 apple-sheet p-4 animate-sheet-enter"
            >
              <div className="drag-handle" aria-hidden="true" />
              <div className="grid grid-cols-3 gap-2 pt-1">
                {overflowItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        triggerHaptic('selection');
                        setMoreOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-[--radius-lg] transition-all min-h-[44px] touch-manipulation active:scale-95 ${
                        active
                          ? 'bg-primary/20 text-primary border border-primary/30 font-semibold shadow-xs'
                          : 'bg-white/4 hover:bg-white/8 text-muted-foreground hover:text-foreground border border-white/6'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-medium text-center truncate w-full">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* ═══ MAIN CONTENT REGION ═══ */}
      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
        style={{
          paddingTop: 'var(--header-height)',
          paddingBottom: 'calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 border-b border-white/8 apple-chrome z-20 shrink-0">
          <div className="flex items-center gap-3">
            {collapsed && (
              <button
                onClick={toggleCollapse}
                aria-label="Expand sidebar"
                aria-expanded={false}
                className="p-2 rounded-full hover:bg-white/8 text-muted-foreground hover:text-foreground mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation active:scale-90"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-[-0.015em] font-heading">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono tabular-numbers">
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
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setComplianceOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Compliance</span>
            </button>

            <LanguageSelector />

            <Badge variant="info" className="py-1 px-3 apple-pill">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="text-[11px] font-medium">Current Sem</span>
            </Badge>

            <Link
              href="/dashboard/circulars"
              onClick={() => triggerHaptic('selection')}
              className="relative p-2.5 rounded-full hover:bg-white/8 transition-colors text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(48,209,88,0.8)]" />
            </Link>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button
              type="button"
              aria-label="User profile and account options"
              onClick={() => {
                triggerHaptic('selection');
                window.location.href = '/dashboard/profile';
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-white/8 p-1.5 pr-3 rounded-full transition-colors min-h-[44px] touch-manipulation active:scale-95"
            >
              <ProfileAvatar user={user} />
              <span className="text-sm font-medium text-foreground hidden xl:block tracking-tight">{user.name}</span>
            </button>
          </div>
        </header>

        {/* Target div for Skip to Content */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto relative z-10 focus:outline-hidden custom-scrollbar"
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

      {/* Global Compliance Center Modal */}
      <ComplianceModal isOpen={complianceOpen} onClose={() => setComplianceOpen(false)} />
    </div>
  );
}
