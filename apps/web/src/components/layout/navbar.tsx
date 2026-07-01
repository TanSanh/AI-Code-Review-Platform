'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code2, Menu, X, LogOut, User, Settings, FileCode } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

/* ─── Bubble / Water‑drop animation helpers ───────────────────────── */

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

function createBubble(id: number): Bubble {
  return {
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 4,
  };
}

/* ─── Navbar Component ───────────────────────────────────────────── */

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [scrolled, setScrolled] = useState(false);

  // Generate bubbles once on mount
  useEffect(() => {
    setBubbles(Array.from({ length: 12 }, (_, i) => createBubble(i)));
  }, []);

  // Track scroll for subtle shadow
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'pt-3 pb-1'
          : 'pt-3 pb-1'
      }`}
    >
      {/* ── Floating centered pill ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className={`relative flex h-14 items-center justify-between rounded-2xl border px-5 transition-all duration-500 ${
            scrolled
              ? 'border-mysteria/15 bg-white/80 shadow-lg shadow-mysteria/5 backdrop-blur-xl'
              : 'border-white/40 bg-white/60 shadow-md backdrop-blur-lg'
          }`}
        >
          {/* ── Animated bubbles background ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            {bubbles.map((b) => (
              <span
                key={b.id}
                className="navbar-bubble"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.size,
                  height: b.size,
                  animationDelay: `${b.delay}s`,
                  animationDuration: `${b.duration}s`,
                }}
              />
            ))}
          </div>

          {/* ── Water‑drop shimmer on hover ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <span className="navbar-water-drop" />
          </div>

          {/* ── Logo ── */}
          <Link href="/" className="group relative z-10 flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-mysteria/10 transition-colors duration-300 group-hover:bg-mysteria/20">
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
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/reviews">Reviews</NavLink>
                <NavLink href="/review/new">New Review</NavLink>
              </div>

              {/* Authenticated user menu */}
              <div className="relative z-10 hidden items-center gap-2 md:flex">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-charcoal/70 transition-all duration-200 hover:bg-mysteria/5 hover:text-charcoal"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user?.name || user?.email}</span>
                </Link>
                <Link href="/settings">
                  <button className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/50 transition-all duration-200 hover:bg-mysteria/5 hover:text-charcoal">
                    <Settings className="h-4 w-4" />
                  </button>
                </Link>
                <button
                  onClick={logout}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/50 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative z-10 hidden items-center gap-1 md:flex">
                <NavLink href="/#features">Features</NavLink>
                <NavLink href="/#how-it-works">How it Works</NavLink>
                <NavLink href="/#pricing">Pricing</NavLink>
              </div>

              {/* Guest CTA */}
              <div className="relative z-10 hidden items-center gap-2 md:flex">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="cream" size="sm" className="rounded-xl">
                    Get Started
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* ── Mobile Menu Button ── */}
          <button
            className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl text-charcoal transition-colors duration-200 hover:bg-mysteria/5 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileMenuOpen && (
          <div className="relative z-50 mt-2 overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-4 shadow-xl shadow-mysteria/5 backdrop-blur-xl md:hidden">
            {/* Mobile bubbles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              {bubbles.slice(0, 6).map((b) => (
                <span
                  key={`m-${b.id}`}
                  className="navbar-bubble"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: b.size * 1.5,
                    height: b.size * 1.5,
                    animationDelay: `${b.delay}s`,
                    animationDuration: `${b.duration}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 space-y-1">
              {isAuthenticated ? (
                <>
                  <MobileNavLink href="/dashboard" icon={<FileCode className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink href="/reviews" icon={<FileCode className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>
                    All Reviews
                  </MobileNavLink>
                  <MobileNavLink href="/review/new" icon={<FileCode className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>
                    New Review
                  </MobileNavLink>
                  <div className="my-2 border-t border-mysteria/10" />
                  <MobileNavLink href="/profile" icon={<User className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>
                    {user?.name || user?.email}
                  </MobileNavLink>
                  <MobileNavLink href="/settings" icon={<Settings className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>
                    Settings
                  </MobileNavLink>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/#features" onClick={() => setMobileMenuOpen(false)}>
                    Features
                  </MobileNavLink>
                  <MobileNavLink href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                    How it Works
                  </MobileNavLink>
                  <MobileNavLink href="/#pricing" onClick={() => setMobileMenuOpen(false)}>
                    Pricing
                  </MobileNavLink>
                  <div className="my-2 border-t border-mysteria/10" />
                  <div className="flex gap-2 pt-1">
                    <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full rounded-xl">Log in</Button>
                    </Link>
                    <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="cream" className="w-full rounded-xl">Get Started</Button>
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative rounded-xl px-3.5 py-2 text-sm font-medium text-charcoal/60 transition-all duration-200 hover:text-charcoal"
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 scale-90 rounded-xl bg-mysteria/0 transition-all duration-300 group-hover:scale-100 group-hover:bg-mysteria/5" />
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  icon,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal/70 transition-all duration-200 hover:bg-mysteria/5 hover:text-charcoal"
    >
      {icon}
      {children}
    </Link>
  );
}
