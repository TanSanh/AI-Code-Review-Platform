'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Code2, Menu, X, LogOut, User, Settings, FileCode } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

/* ─── Navbar Component ───────────────────────────────────────────── */

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Glassmorphism intensity ──
  const [glassIntensity, setGlassIntensity] = useState(0);

  // ── Show / hide on scroll ──
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Track scroll direction + glass intensity
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY > 80) {
          setHidden(delta > 0);
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
      if (href.startsWith('/#')) return false; // anchor links never "active"
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname],
  );

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
          className="navbar-glass relative flex h-14 items-center justify-between rounded-2xl border px-5 transition-all duration-500"
          style={{
            borderColor: `rgba(255, 255, 255, ${0.35 - glassIntensity * 0.15})`,
            backgroundColor: `rgba(255, 255, 255, ${0.3 + glassIntensity * 0.25})`,
            boxShadow:
              glassIntensity > 0.1
                ? `0 8px 32px rgba(88, 80, 168, ${0.06 + glassIntensity * 0.08}), 0 1px 3px rgba(0,0,0,${glassIntensity * 0.04})`
                : '0 2px 8px rgba(88, 80, 168, 0.03)',
          }}
        >
          {/* ── Glass highlight overlay ── */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl transition-opacity duration-500"
            style={{ opacity: 0.25 + glassIntensity * 0.35 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
          </div>

          {/* ── Noise texture ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="navbar-glass-noise absolute inset-0 opacity-[0.025]" />
          </div>

          {/* ── Inner glow line ── */}
          <div className="pointer-events-none absolute top-0 left-[10%] right-[10%] h-px rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />

          {/* ── Logo ── */}
          <Link href="/" className="group relative z-10 flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-mysteria/8 transition-colors duration-300 group-hover:bg-mysteria/15">
              <Code2 className="h-4.5 w-4.5 text-mysteria transition-transform duration-300 group-hover:scale-110" />
            </span>
            <span className="text-base font-semibold tracking-tight text-charcoal">
              AI Code Review
            </span>
          </Link>

          {/* ── Desktop Navigation ── */}
          {isAuthenticated ? (
            <>
              <div className="relative z-10 hidden items-center gap-1 md:flex">
                <NavPill href="/dashboard" active={isActive('/dashboard')}>Dashboard</NavPill>
                <NavPill href="/reviews" active={isActive('/reviews')}>Reviews</NavPill>
                <NavPill href="/review/new" active={isActive('/review/new')}>New Review</NavPill>
              </div>

              <div className="relative z-10 hidden items-center gap-2 md:flex">
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-mysteria/10 text-charcoal font-medium'
                      : 'text-charcoal/60 hover:bg-white/40 hover:text-charcoal'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user?.name || user?.email}</span>
                </Link>
                <Link href="/settings">
                  <button
                    className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-sm transition-all duration-200 ${
                      isActive('/settings')
                        ? 'bg-mysteria/10 text-charcoal'
                        : 'text-charcoal/40 hover:bg-white/40 hover:text-charcoal'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </Link>
                <button
                  onClick={logout}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/40 backdrop-blur-sm transition-all duration-200 hover:bg-red-50/60 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative z-10 hidden items-center gap-1 md:flex">
                <NavPill href="/#features" active={false}>Features</NavPill>
                <NavPill href="/#how-it-works" active={false}>How it Works</NavPill>
                <NavPill href="/#pricing" active={false}>Pricing</NavPill>
              </div>

              <div className="relative z-10 hidden items-center gap-2 md:flex">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl backdrop-blur-sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="cream" size="sm" className="rounded-xl backdrop-blur-sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* ── Mobile Menu Button ── */}
          <button
            className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl text-charcoal transition-colors duration-200 hover:bg-white/40 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileMenuOpen && (
          <div
            className="navbar-glass relative z-50 mt-2 overflow-hidden rounded-2xl border border-white/25 p-4 shadow-xl shadow-mysteria/5 md:hidden"
            style={{
              backgroundColor: `rgba(255, 255, 255, ${0.65 + glassIntensity * 0.15})`,
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
            </div>

            <div className="relative z-10 space-y-1">
              {isAuthenticated ? (
                <>
                  <MobileNavLink href="/dashboard" icon={<FileCode className="h-4 w-4" />} active={isActive('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink href="/reviews" icon={<FileCode className="h-4 w-4" />} active={isActive('/reviews')} onClick={() => setMobileMenuOpen(false)}>
                    All Reviews
                  </MobileNavLink>
                  <MobileNavLink href="/review/new" icon={<FileCode className="h-4 w-4" />} active={isActive('/review/new')} onClick={() => setMobileMenuOpen(false)}>
                    New Review
                  </MobileNavLink>
                  <div className="my-2 border-t border-mysteria/10" />
                  <MobileNavLink href="/profile" icon={<User className="h-4 w-4" />} active={isActive('/profile')} onClick={() => setMobileMenuOpen(false)}>
                    {user?.name || user?.email}
                  </MobileNavLink>
                  <MobileNavLink href="/settings" icon={<Settings className="h-4 w-4" />} active={isActive('/settings')} onClick={() => setMobileMenuOpen(false)}>
                    Settings
                  </MobileNavLink>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50/60"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileNavLink>
                  <MobileNavLink href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</MobileNavLink>
                  <MobileNavLink href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
                  <div className="my-2 border-t border-mysteria/10" />
                  <div className="flex gap-2 pt-1">
                    <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full rounded-xl backdrop-blur-sm">Log in</Button>
                    </Link>
                    <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="cream" className="w-full rounded-xl backdrop-blur-sm">Get Started</Button>
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
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group relative rounded-xl px-3.5 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 ${
        active
          ? 'bg-white/60 text-charcoal shadow-sm shadow-mysteria/5 border border-white/50'
          : 'text-charcoal/55 hover:text-charcoal hover:bg-white/30 border border-transparent'
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
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-mysteria/10 text-charcoal border border-mysteria/15'
          : 'text-charcoal/65 hover:bg-white/40 hover:text-charcoal border border-transparent'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
