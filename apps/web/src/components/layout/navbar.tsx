'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Code2, Menu, X, LogOut, User, Settings, FileCode, Globe, Sun, Moon, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import NotificationBell from '@/components/notifications/notification-bell';

/* ─── Navbar Component ───────────────────────────────────────────── */

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Glassmorphism intensity ──
  const [glassIntensity, setGlassIntensity] = useState(0);

  // ── Show / hide on scroll ──
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const pauseHideUntil = useRef(0);

  // Track scroll direction + glass intensity
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        const now = Date.now();

        if (currentY > 80) {
          // Don't hide if within 5s pause window after nav click
          if (now < pauseHideUntil.current) {
            setHidden(false);
          } else {
            setHidden(delta > 0);
          }
        } else {
          setHidden(false);
        }

        setGlassIntensity(Math.min(currentY / 200, 1));
        lastScrollY.current = currentY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Helper: check if a nav link is active
  const isActive = useCallback(
    (href: string) => {
      if (href.startsWith('/#')) return false;
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname],
  );

  // Pause navbar auto-hide for 3 seconds after clicking a nav link
  const pauseHide = useCallback(() => {
    pauseHideUntil.current = Date.now() + 3000;
    setHidden(false);
  }, []);

  const isDark = theme === 'dark';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
      style={{
        transform: hidden ? 'translateY(-120%)' : 'translateY(0)',
      }}
    >
      {/* ── Floating centered pill ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-3">
        <div
          className="navbar-glass relative flex h-14 items-center justify-between rounded-2xl border px-5 transition-all duration-500 dark:border-[#33355a]/50 dark:bg-[#242640]/90"
          style={{
            borderColor: isDark
              ? undefined
              : `rgba(255, 255, 255, ${0.35 - glassIntensity * 0.15})`,
            backgroundColor: isDark
              ? undefined
              : `rgba(255, 255, 255, ${0.3 + glassIntensity * 0.25})`,
            boxShadow: glassIntensity > 0.1
              ? `0 8px 32px rgba(0,0,0,${isDark ? 0.3 : 0.06 + glassIntensity * 0.08}), 0 1px 3px rgba(0,0,0,${glassIntensity * 0.04})`
              : `0 2px 8px rgba(0,0,0,${isDark ? 0.2 : 0.03})`,
          }}
        >
          {/* ── Glass highlight overlay ── */}
          {!isDark && (
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl transition-opacity duration-500"
              style={{ opacity: 0.25 + glassIntensity * 0.35 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
            </div>
          )}

          {/* ── Noise texture ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="navbar-glass-noise absolute inset-0 opacity-[0.025]" />
          </div>

          {/* ── Inner glow line ── */}
          {!isDark && (
            <div className="pointer-events-none absolute top-0 left-[10%] right-[10%] h-px rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          )}

          {/* ── Logo ── */}
          <Link href="/" className="group relative z-10 flex items-center gap-2.5">
            <img src="/logo.svg" alt="AI Code Review" className="h-8 w-8" />
            <span className="text-base font-semibold tracking-tight text-charcoal dark:text-gray-100">
              AI Code Review
            </span>
          </Link>

          {/* ── Desktop Navigation ── */}
          {isAuthenticated ? (
            <>
              <div className="relative z-10 hidden items-center gap-1 md:flex">
                <NavPill href="/dashboard" active={isActive('/dashboard')} isDark={isDark} onClick={pauseHide}>{t('nav.dashboard')}</NavPill>
                <NavPill href="/reviews" active={isActive('/reviews')} isDark={isDark} onClick={pauseHide}>{t('nav.reviews')}</NavPill>
                <NavPill href="/community" active={isActive('/community')} isDark={isDark} onClick={pauseHide}>{t('nav.community')}</NavPill>
              </div>

              <div className="relative z-10 hidden items-center gap-1.5 md:flex">
                {/* Language toggle */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                  className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-charcoal/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/40 hover:text-charcoal dark:text-gray-100/50 dark:hover:bg-charcoal-700/50 dark:hover:text-cream-50"
                  title={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang English'}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{language === 'en' ? 'EN' : 'VI'}</span>
                </button>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/40 hover:text-charcoal dark:text-gray-100/50 dark:hover:bg-charcoal-700/50 dark:hover:text-cream-50"
                  title={isDark ? 'Switch to light mode' : 'Chế độ sáng'}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Notification Bell */}
                <NotificationBell />

                <Link
                  href="/profile"
                  onClick={pauseHide}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-mysteria/10 text-charcoal font-medium dark:bg-lavender/15 dark:text-gray-100'
                      : 'text-charcoal/60 hover:bg-white/40 hover:text-charcoal dark:text-gray-100/60 dark:hover:bg-charcoal-700/50 dark:hover:text-cream-50'
                  }`}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || ''} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="max-w-[100px] truncate">{user?.name || user?.email}</span>
                </Link>
                <Link href="/settings" onClick={pauseHide}>
                  <button
                    className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-sm transition-all duration-200 ${
                      isActive('/settings')
                        ? 'bg-mysteria/10 text-charcoal dark:bg-lavender/15 dark:text-gray-100'
                        : 'text-charcoal/40 hover:bg-white/40 hover:text-charcoal dark:text-gray-100/40 dark:hover:bg-charcoal-700/50 dark:hover:text-cream-50'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </Link>
                <button
                  onClick={logout}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/40 backdrop-blur-sm transition-all duration-200 hover:bg-red-50/60 hover:text-red-600 dark:text-gray-100/40 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative z-10 hidden items-center gap-1 md:flex">
                <NavPill href="/#features" active={false} isDark={isDark} onClick={pauseHide}>{t('nav.features')}</NavPill>
                <NavPill href="/#how-it-works" active={false} isDark={isDark} onClick={pauseHide}>{t('nav.howItWorks')}</NavPill>
                <NavPill href="/#pricing" active={false} isDark={isDark} onClick={pauseHide}>{t('nav.pricing')}</NavPill>
              </div>

              <div className="relative z-10 hidden items-center gap-1.5 md:flex">
                {/* Language toggle */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                  className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-charcoal/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/40 hover:text-charcoal dark:text-gray-100/50 dark:hover:bg-charcoal-700/50 dark:hover:text-cream-50"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{language === 'en' ? 'EN' : 'VI'}</span>
                </button>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/40 hover:text-charcoal dark:text-gray-100/50 dark:hover:bg-charcoal-700/50 dark:hover:text-cream-50"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <Link href="/login" onClick={pauseHide}>
                  <Button variant="ghost" size="sm" className="rounded-xl backdrop-blur-sm dark:text-gray-100/70 dark:hover:text-cream-50">
                    {t('nav.login')}
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* ── Mobile Menu Button ── */}
          <button
            className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl text-charcoal transition-colors duration-200 hover:bg-white/40 dark:text-gray-100 dark:hover:bg-charcoal-700/50 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileMenuOpen && (
          <div className="navbar-glass relative z-50 mt-2 overflow-hidden rounded-2xl border border-white/25 p-4 shadow-xl shadow-mysteria/5 dark:border-[#33355a]/50 dark:bg-[#242640]/95 md:hidden"
            style={!isDark ? {
              backgroundColor: `rgba(255, 255, 255, ${0.65 + glassIntensity * 0.15})`,
            } : undefined}
          >
            {!isDark && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
              </div>
            )}

            {/* Mobile toggles */}
            <div className="relative z-10 mb-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-charcoal/50 hover:bg-white/40 dark:text-gray-100/50 dark:hover:bg-charcoal-700/50"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{language === 'en' ? 'EN' : 'VI'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/50 hover:bg-white/40 dark:text-gray-100/50 dark:hover:bg-charcoal-700/50"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative z-10 space-y-1">
              {isAuthenticated ? (
                <>
                  <MobileNavLink href="/dashboard" icon={<FileCode className="h-4 w-4" />} active={isActive('/dashboard')} isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>
                    {t('nav.dashboard')}
                  </MobileNavLink>
                  <MobileNavLink href="/reviews" icon={<FileCode className="h-4 w-4" />} active={isActive('/reviews')} isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>
                    {t('nav.allReviews')}
                  </MobileNavLink>
                  <MobileNavLink href="/community" icon={<Users className="h-4 w-4" />} active={isActive('/community')} isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>
                    {t('nav.community')}
                  </MobileNavLink>
                  <div className="my-2 border-t border-mysteria/10 dark:border-[#33355a]" />
                  <MobileNavLink
                    href="/profile"
                    icon={user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || ''} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    active={isActive('/profile')}
                    isDark={isDark}
                    onClick={() => { pauseHide(); setMobileMenuOpen(false); }}
                  >
                    {user?.name || user?.email}
                  </MobileNavLink>
                  <MobileNavLink href="/settings" icon={<Settings className="h-4 w-4" />} active={isActive('/settings')} isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>
                    {t('nav.settings')}
                  </MobileNavLink>
                  <div className="px-3 py-2">
                    <NotificationBell />
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50/60 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/#features" isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>{t('nav.features')}</MobileNavLink>
                  <MobileNavLink href="/#how-it-works" isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>{t('nav.howItWorks')}</MobileNavLink>
                  <MobileNavLink href="/#pricing" isDark={isDark} onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>{t('nav.pricing')}</MobileNavLink>
                  <div className="my-2 border-t border-mysteria/10 dark:border-[#33355a]" />
                  <div className="flex gap-2 pt-1">
                    <Link href="/login" className="flex-1" onClick={() => { pauseHide(); setMobileMenuOpen(false); }}>
                      <Button variant="ghost" className="w-full rounded-xl backdrop-blur-sm dark:text-gray-100/70">{t('nav.login')}</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─── Sub‑components ─────────────────────────────────────────────── */

function NavPill({
  href,
  active,
  isDark,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  isDark: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative rounded-xl px-3.5 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 border ${
        active
          ? isDark
            ? 'bg-charcoal-700/60 text-cream-50 shadow-sm border-charcoal-600/50'
            : 'bg-white/60 text-charcoal shadow-sm shadow-mysteria/5 border-white/50'
          : isDark
            ? 'text-cream-50/55 hover:text-cream-50 hover:bg-charcoal-700/40 border-transparent'
            : 'text-charcoal/55 hover:text-charcoal hover:bg-white/30 border-transparent'
      }`}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  icon,
  active,
  isDark,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  isDark: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
        active
          ? isDark
            ? 'bg-lavender/15 text-cream-50 border-lavender/20'
            : 'bg-mysteria/10 text-charcoal border-mysteria/15'
          : isDark
            ? 'text-cream-50/65 hover:bg-charcoal-700/40 hover:text-cream-50 border-transparent'
            : 'text-charcoal/65 hover:bg-white/40 hover:text-charcoal border-transparent'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
