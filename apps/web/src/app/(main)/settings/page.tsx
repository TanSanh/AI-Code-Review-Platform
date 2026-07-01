'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Bell,
  Lock,
  Trash2,
  LogOut,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

/* ─── Toggle Switch Component ───────────────────────────────────── */

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        enabled ? 'bg-mysteria' : 'bg-charcoal/20'
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

/* ─── Settings Page ─────────────────────────────────────────────── */

export default function SettingsPage() {
  const { logout } = useAuth();

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
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
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
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-section text-charcoal">Settings</h1>
          <p className="text-body text-charcoal/60 mt-2">
            Manage your account preferences and security settings
          </p>
        </div>

        {/* Password success message */}
        {pwdSuccess && (
          <div className="mb-6 p-3 rounded-button bg-green-50 text-green-600 text-sm">
            {pwdSuccess}
          </div>
        )}

        <div className="grid gap-6">
          {/* ── Notifications ── */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Email Notifications</p>
                  <p className="text-caption text-charcoal/60">Receive email updates about your reviews</p>
                </div>
                <Toggle
                  enabled={emailNotif}
                  onToggle={() => saveNotifs(!emailNotif, reviewNotif)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-parchment">
                <div>
                  <p className="text-body font-medium text-charcoal">Review Completion</p>
                  <p className="text-caption text-charcoal/60">Get notified when AI review is complete</p>
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
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Password */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Change Password</p>
                  <p className="text-caption text-charcoal/60">Update your account password</p>
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
                  {showPasswordForm ? 'Cancel' : 'Change'}
                </Button>
              </div>

              {showPasswordForm && (
                <div className="p-4 bg-charcoal/[0.02] rounded-card border border-parchment space-y-4">
                  {pwdError && (
                    <div className="p-3 rounded-button bg-red-50 text-red-600 text-sm">
                      {pwdError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="current-pwd">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-pwd"
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      >
                        {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-pwd">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-pwd"
                        type={showNewPwd ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                      >
                        {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                    <Input
                      id="confirm-pwd"
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Confirm new password"
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
                      Update Password
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Danger Zone ── */}
          <Card className="card-super border-red-200">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Sign Out</p>
                  <p className="text-caption text-charcoal/60">Sign out from your account</p>
                </div>
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-red-100">
                <div>
                  <p className="text-body font-medium text-red-600">Delete Account</p>
                  <p className="text-caption text-charcoal/60">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  Delete
                </Button>
              </div>

              {showDeleteConfirm && (
                <div className="p-4 bg-red-50 rounded-card border border-red-200">
                  <p className="text-body text-red-600 mb-2">
                    Are you sure? This action cannot be undone.
                  </p>
                  <p className="text-caption text-red-500/70 mb-4">
                    All your reviews, comments, and data will be permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        // TODO: Implement delete account API when backend endpoint is available
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Yes, Delete Account
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
