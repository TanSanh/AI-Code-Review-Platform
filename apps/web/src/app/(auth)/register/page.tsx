'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { OtpInput } from '@/components/auth/otp-input';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { api } from '@/lib/api';

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
    general?: string;
  }>({});

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) e.name = t('auth.nameRequired');
    if (!email.trim()) e.email = t('auth.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('auth.otpInvalid');
    if (!password) e.password = t('auth.passwordRequired');
    else if (password.length < 8) e.password = t('auth.passwordHint');
    if (!confirmPassword) e.confirmPassword = t('auth.passwordRequired');
    else if (password !== confirmPassword) e.confirmPassword = t('auth.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateStep1()) return;
    setSendingCode(true);
    setErrors({});
    try {
      await api.sendOtp(email);
      setStep(2);
      setResendCountdown(60);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : t('auth.registerFailed') });
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setSendingCode(true);
    setErrors((p) => ({ ...p, otp: undefined }));
    try {
      await api.sendOtp(email);
      setResendCountdown(60);
      setOtp('');
    } catch (err) {
      setErrors({ otp: err instanceof Error ? err.message : t('auth.registerFailed') });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length < 6) {
      setErrors({ otp: t('auth.otpRequired') });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const result = await api.verifyOtp(email, otp);
      await register(email, name, password, result.otpToken);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.registerFailed');
      if (msg.includes('expired')) setErrors({ otp: t('auth.otpExpired') });
      else if (msg.includes('Invalid') || msg.includes('invalid')) setErrors({ otp: t('auth.otpInvalid') });
      else setErrors({ general: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#1a1b2e]">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <img src="/logo.svg" alt="AI Code Review" className="h-12 w-12" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.registerDesc')}
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

          {step === 1 ? (
            /* Step 1: Account Info */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t('auth.name')}
                </Label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900/10 dark:border-[#33355a] dark:bg-[#1e2038] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-100 dark:focus:ring-gray-100/10 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

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
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('auth.passwordHint')}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t('auth.confirmPassword')}
                </Label>
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900/10 dark:border-[#33355a] dark:bg-[#1e2038] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-100 dark:focus:ring-gray-100/10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={sendingCode}
                className="h-11 w-full rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                {sendingCode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t('auth.next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Step 2: OTP */
            <div className="space-y-5">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#33355a]">
                  <Shield className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {t('auth.step2Desc')} <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
              </p>

              {errors.otp && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {errors.otp}
                </div>
              )}

              <OtpInput
                value={otp}
                onChange={(val) => { setOtp(val); setErrors((p) => ({ ...p, otp: undefined })); }}
                disabled={busy}
              />

              <Button
                onClick={handleVerifyAndRegister}
                disabled={busy || otp.length < 6}
                className="h-11 w-full rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('auth.verifyAndRegister')}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep(1); setOtp(''); setErrors({}); }}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.back')}
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || sendingCode}
                  className="text-gray-900 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed dark:text-gray-100 dark:hover:text-gray-300 dark:disabled:text-gray-500"
                >
                  {resendCountdown > 0
                    ? t('auth.resendIn').replace('{seconds}', String(resendCountdown))
                    : t('auth.resendCode')
                  }
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="font-semibold text-gray-900 hover:underline dark:text-gray-100">
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
