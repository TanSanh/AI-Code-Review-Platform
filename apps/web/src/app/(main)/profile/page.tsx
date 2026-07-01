'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Calendar,
  FileCode,
  MessageSquare,
  Shield,
  Loader2,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { formatDate } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  _count: {
    reviews: number;
    comments: number;
  };
}

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data as UserProfile);
        setName(data.name);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const updated = await api.updateProfile(name.trim());
      setProfile(updated as UserProfile);
      updateUser({ name: updated.name });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1b2e]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysteria dark:border-lavender" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1b2e]">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-section text-charcoal dark:text-gray-100">{t('profile.title')}</h1>
          <p className="text-body text-charcoal/60 dark:text-gray-100/60 mt-2">
            {t('profile.description')}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {success && (
                <div className="p-3 rounded-button bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-sm">
                  {success}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-button bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mysteria/10 dark:bg-lavender/15">
                  <span className="text-xl font-bold text-mysteria dark:text-lavender">
                    {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-body font-medium text-charcoal dark:text-gray-100">{profile?.name}</p>
                  <p className="text-caption text-charcoal/50 dark:text-gray-100/50">{profile?.email}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="dark:bg-[#242640] dark:border-[#33355a] dark:text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-gray-50 dark:bg-[#242640] dark:border-[#33355a] dark:text-gray-100/50"
                  />
                  <p className="text-caption text-charcoal/40 dark:text-gray-100/40">
                    {t('profile.emailCannotChange')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="cream" onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                {t('profile.activityStats')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lavender/20 mb-3">
                    <FileCode className="h-6 w-6 text-amethyst" />
                  </div>
                  <p className="text-2xl font-bold text-charcoal dark:text-gray-100">{profile?._count.reviews || 0}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('profile.reviews')}</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lavender/20 mb-3">
                    <MessageSquare className="h-6 w-6 text-amethyst" />
                  </div>
                  <p className="text-2xl font-bold text-charcoal dark:text-gray-100">{profile?._count.comments || 0}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('profile.comments')}</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lavender/20 mb-3">
                    <Shield className="h-6 w-6 text-amethyst" />
                  </div>
                  <p className="text-2xl font-bold text-charcoal dark:text-gray-100 capitalize">{profile?.role?.toLowerCase() || 'member'}</p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('profile.role')}</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lavender/20 mb-3">
                    <Calendar className="h-6 w-6 text-amethyst" />
                  </div>
                  <p className="text-body font-bold text-charcoal dark:text-gray-100">
                    {profile?.createdAt ? formatDate(profile.createdAt, language) : '-'}
                  </p>
                  <p className="text-caption text-charcoal/60 dark:text-gray-100/60">{t('profile.joined')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('profile.accountDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-parchment dark:border-[#33355a]">
                  <span className="text-body text-charcoal dark:text-gray-100">{t('profile.userId')}</span>
                  <span className="text-caption text-charcoal/60 dark:text-gray-100/60 font-mono">{profile?.id || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-parchment dark:border-[#33355a]">
                  <span className="text-body text-charcoal dark:text-gray-100">{t('profile.email')}</span>
                  <span className="text-caption text-charcoal/60 dark:text-gray-100/60">{profile?.email || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-parchment dark:border-[#33355a]">
                  <span className="text-body text-charcoal dark:text-gray-100">{t('profile.role')}</span>
                  <span className="text-caption text-charcoal/60 dark:text-gray-100/60">{profile?.role || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-body text-charcoal dark:text-gray-100">{t('profile.memberSince')}</span>
                  <span className="text-caption text-charcoal/60 dark:text-gray-100/60">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
