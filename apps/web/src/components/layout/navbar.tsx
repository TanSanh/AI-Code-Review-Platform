'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code2, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-parchment bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-mysteria" />
          <span className="text-lg font-semibold text-charcoal">AI Code Review</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated ? (
          <>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-nav text-charcoal/70 hover:text-charcoal transition-colors">
                Dashboard
              </Link>
              <Link href="/review/new" className="text-nav text-charcoal/70 hover:text-charcoal transition-colors">
                New Review
              </Link>
            </div>

            {/* Authenticated User Menu */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-body text-charcoal">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.email}</span>
              </div>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-nav text-charcoal/70 hover:text-charcoal transition-colors">
                Features
              </Link>
              <Link href="/#how-it-works" className="text-nav text-charcoal/70 hover:text-charcoal transition-colors">
                How it Works
              </Link>
              <Link href="/#pricing" className="text-nav text-charcoal/70 hover:text-charcoal transition-colors">
                Pricing
              </Link>
            </div>

            {/* Guest CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button variant="cream">Get Started</Button>
              </Link>
            </div>
          </>
        )}

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-charcoal"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-parchment bg-white">
          <div className="px-4 py-4 space-y-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block text-nav text-charcoal/70 hover:text-charcoal">
                  Dashboard
                </Link>
                <Link href="/review/new" className="block text-nav text-charcoal/70 hover:text-charcoal">
                  New Review
                </Link>
                <div className="pt-4 border-t border-parchment">
                  <div className="flex items-center gap-2 text-body text-charcoal mb-4">
                    <User className="h-4 w-4" />
                    <span>{user?.name || user?.email}</span>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/#features" className="block text-nav text-charcoal/70 hover:text-charcoal">
                  Features
                </Link>
                <Link href="/#how-it-works" className="block text-nav text-charcoal/70 hover:text-charcoal">
                  How it Works
                </Link>
                <Link href="/#pricing" className="block text-nav text-charcoal/70 hover:text-charcoal">
                  Pricing
                </Link>
                <div className="pt-4 border-t border-parchment space-y-2">
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button variant="cream" className="w-full">Get Started</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
