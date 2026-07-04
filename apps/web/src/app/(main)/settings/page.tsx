'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Settings, Bell, Lock, Trash2, LogOut, AlertTriangle,
  Loader2, Sun, Moon, Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { api } from '@/lib/api';

/* ─── Toggle Switch ──────────────────────────────────────────────── */

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        enabled ? 'bg-mysteria dark:bg-lavender' : 'bg-charcoal/20 dark:bg-[#1e2d44]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ─── Settings Page ──────────────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter();
  const { logout, user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  // ── Notification preferences (localStorage) ──
  const [emailNotif, setEmailNotif] = useState(true);
  const [reviewNotif, setReviewNotif] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('settings_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setEmailNotif(parsed.emailNotif ?? true);
      setReviewNotif(parsed.reviewNotif ?? true);
    }
  }, []);

  const saveNotifs = (email: boolean, review: boolean) => {
    setEmailNotif(email);
    setReviewNotif(review);
    localStorage.setItem('settings_notifications', JSON.stringify({ emailNotif: email, reviewNotif: review }));
  };

  // ── Change Password ──
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleChangePassword = async () => {
    setPwdError('');
    setPwdSuccess('');

    if (!currentPwd || !newPwd) {
      setPwdError('Please fill in all fields');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('New password must be at least 8 characters');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('New passwords do not match');
      return;
    }
    if (currentPwd === newPwd) {
      setPwdError('New password must be different from current password');
      return;
    }

    setPwdLoading(true);
    try {
      await api.changePassword(currentPwd, newPwd);
      setPwdSuccess('Password changed successfully');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setShowPasswordForm(false);
      setTimeout(() => setPwdSuccess(''), 3000);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Delete Account ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120]">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-section text-charcoal dark:text-gray-100">{t('settings.title')}</h1>
          <p className="text-body text-charcoal/60 dark:text-gray-100/60 mt-2">
            {t('settings.description')}
          </p>
        </div>

        {/* Password success message */}
        {pwdSuccess && (
          <div className="mb-6 p-3 rounded-button bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-sm">
            {pwdSuccess}
          </div>
        )}

        <div className="grid gap-6">
          {/* ── Appearance ── */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('settings.appearance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal dark:text-gray-100">{t('settings.theme')}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('settings.themeDesc')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'cream' : 'ghost'}
                    size="sm"
                    onClick={() => theme !== 'light' && toggleTheme()}
                  >
                    <Sun className="mr-1.5 h-3.5 w-3.5" />
                    {t('settings.light')}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'cream' : 'ghost'}
                    size="sm"
                    onClick={() => theme !== 'dark' && toggleTheme()}
                  >
                    <Moon className="mr-1.5 h-3.5 w-3.5" />
                    {t('settings.dark')}
                  </Button>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between py-3 border-t border-parchment dark:border-[#1e2d44]">
                <div>
                  <p className="text-body font-medium text-charcoal dark:text-gray-100">{t('settings.language')}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('settings.languageDesc')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'en' ? 'cream' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    variant={language === 'vi' ? 'cream' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('vi')}
                  >
                    🇻🇳 Tiếng Việt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Notifications ── */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('settings.notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal dark:text-gray-100">{t('settings.emailNotif')}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('settings.emailNotifDesc')}</p>
                </div>
                <Toggle
                  enabled={emailNotif}
                  onToggle={() => saveNotifs(!emailNotif, reviewNotif)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-parchment dark:border-[#1e2d44]">
                <div>
                  <p className="text-body font-medium text-charcoal dark:text-gray-100">{t('settings.reviewNotif')}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('settings.reviewNotifDesc')}</p>
                </div>
                <Toggle
                  enabled={reviewNotif}
                  onToggle={() => saveNotifs(emailNotif, !reviewNotif)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Security ── */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('settings.security')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal dark:text-gray-100">{t('settings.changePassword')}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('settings.changePasswordDesc')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPasswordForm(!showPasswordForm);
                    setPwdError('');
                    setPwdSuccess('');
                  }}
                >
                  {showPasswordForm ? t('common.cancel') : t('settings.changePassword')}
                </Button>
              </div>

              {showPasswordForm && (
                <div className="p-4 bg-charcoal/[0.02] dark:bg-[#1a2332] rounded-card border border-parchment dark:border-[#1e2d44] space-y-4">
                  {pwdError && (
                    <div className="p-3 rounded-button bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm">
                      {pwdError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="current-pwd">{t('settings.currentPassword')}</Label>
                    <PasswordInput
                      id="current-pwd"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      className="dark:bg-[#1a2332] dark:border-[#1e2d44] dark:text-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-pwd">{t('settings.newPassword')}</Label>
                    <PasswordInput
                      id="new-pwd"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="dark:bg-[#1a2332] dark:border-[#1e2d44] dark:text-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-pwd">{t('settings.confirmPassword')}</Label>
                    <PasswordInput
                      id="confirm-pwd"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="dark:bg-[#1a2332] dark:border-[#1e2d44] dark:text-gray-100"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="cream"
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
                    >
                      {pwdLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="mr-2 h-4 w-4" />
                      )}
                      {t('settings.updatePassword')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
