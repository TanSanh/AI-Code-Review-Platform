import React from 'react';
import Link from 'next/link';
import { Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-parchment dark:border-[#33355a] bg-white dark:bg-[#242640]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Code2 className="h-6 w-6 text-mysteria dark:text-lavender" />
              <span className="text-lg font-semibold text-charcoal dark:text-gray-100">AI Code Review</span>
            </Link>
            <p className="text-sm text-charcoal/60 dark:text-gray-400">
              Intelligent code analysis for modern development teams.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-gray-200 mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Features</Link></li>
              <li><Link href="/#pricing" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Dashboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-gray-200 mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">About</Link></li>
              <li><Link href="/blog" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Blog</Link></li>
              <li><Link href="/careers" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Careers</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-gray-200 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-charcoal/60 hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-parchment dark:border-[#33355a]">
          <p className="text-sm text-charcoal/40 dark:text-gray-500 text-center">
            © 2026 AI Code Review. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
