'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = t('auth.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('auth.otpInvalid');
    if (!password) e.password = t('auth.passwordRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : t('auth.loginFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#1a1b2e]">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <img src="/logo.svg" alt="AI Code Review" className="h-12 w-12" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.signInDesc')}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-[#33355a] dark:bg-[#242640]">
        <div className="p-6">
          {errors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Email
              </Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900/10 dark:border-[#33355a] dark:bg-[#1e2038] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-100 dark:focus:ring-gray-100/10 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('auth.password')}
              </Label>
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900/10 dark:border-[#33355a] dark:bg-[#1e2038] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-100 dark:focus:ring-gray-100/10 ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="font-semibold text-gray-900 hover:underline dark:text-gray-100">
              {t('auth.signUp')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
