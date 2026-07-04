'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import {
  User,
  Mail,
  Calendar,
  FileCode,
  MessageSquare,
  Shield,
  Loader2,
  Save,
  LogOut,
  Settings,
  Lock,
  Info,
  CheckCircle,
  Heart,
  Users,
  FileText,
  Camera,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  _count: {
    reviews: number;
    comments: number;
  };
}

interface UserPost {
  id: string;
  title: string;
  content: string;
  language: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

type Tab = 'general' | 'security' | 'posts';

const sidebarItems: { key: Tab; icon: React.ElementType; labelKey: string }[] = [
  { key: 'general', icon: Settings, labelKey: 'profile.general' },
  { key: 'security', icon: Shield, labelKey: 'profile.security' },
  { key: 'posts', icon: FileText, labelKey: 'community.title' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data as UserProfile);
        setName(data.name);
        setBio(data.bio || '');
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch user's community posts
  useEffect(() => {
    if (activeTab !== 'posts' || !user?.id) return;

    const fetchUserPosts = async () => {
      setPostsLoading(true);
      try {
        const result = await api.getCommunityPosts({ authorId: user.id, limit: 50 });
        setUserPosts(result.data as UserPost[]);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [activeTab, user?.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const updated = await api.updateProfile(name.trim(), bio.trim() || undefined);
      setProfile(updated as UserProfile);
      updateUser({ name: updated.name });
      setSuccess(t('profile.updatedSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError(t('profile.passwordHint'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(t('profile.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.avatarTooLarge'));
      return;
    }

    setAvatarUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const updated = await api.updateProfile(name.trim() || profile?.name || '', bio.trim() || undefined, base64);
      setProfile(updated as UserProfile);
      updateUser({ avatarUrl: updated.avatarUrl });
      toast.success(t('profile.avatarUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.avatarFailed'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      const updated = await api.updateProfile(name.trim() || profile?.name || '', bio.trim() || undefined, '');
      setProfile(updated as UserProfile);
      updateUser({ avatarUrl: null });
      toast.success(t('profile.avatarRemoved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.avatarFailed'));
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#1a1b2e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysteria dark:border-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  const username = profile?.email?.split('@')[0] || '';
  const userInitial = profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#1a1b2e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left Sidebar ── */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden">
              {/* User info */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal dark:bg-gray-400">
                      <span className="text-lg font-bold text-white">{userInitial}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal dark:text-gray-100 truncate">
                      {profile?.email}
                    </p>
                    <p className="text-xs text-charcoal/40 dark:text-gray-400">
                      @{username}
                    </p>
                    <p className="text-[10px] text-charcoal/30 dark:text-gray-500 font-mono">
                      #{profile?.id?.slice(0, 4)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-[#33355a]" />

              {/* Navigation tabs */}
              <nav className="p-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-charcoal text-white dark:bg-gray-400 dark:text-white'
                          : 'text-charcoal/60 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t(item.labelKey as any)}
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-gray-100 dark:border-[#33355a]" />

              {/* Logout */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">
            {/* Top tabs (mobile & desktop) */}
            <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] mb-6 px-2 py-1.5 flex gap-1 overflow-x-auto">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-charcoal text-white dark:bg-gray-400 dark:text-white shadow-sm'
                        : 'text-charcoal/50 hover:text-charcoal hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5'
                    }`}
                  >
                    {t(item.labelKey as any)}
                  </button>
                );
              })}
            </div>

            {/* ── General Tab ── */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* User info card */}
                <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] p-6">
                  <div className="flex items-center gap-5">
                    <div className="relative group flex-shrink-0">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-charcoal dark:bg-gray-400">
                          <span className="text-2xl font-bold text-white">{userInitial}</span>
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        {avatarUploading ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </button>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-charcoal dark:text-gray-100">
                        {profile?.email}
                      </p>
                      <p className="text-sm text-charcoal/50 dark:text-gray-400">
                        @{username}
                      </p>
                      <p className="text-xs text-charcoal/30 dark:text-gray-500">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Info Form */}
                <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-[#33355a]">
                    <h3 className="text-base font-semibold text-charcoal dark:text-gray-100 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('profile.personalInfo')}
                    </h3>
                  </div>
                  <div className="p-6 space-y-5">
                    {success && (
                      <div className="p-3 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-sm">
                        {success}
                      </div>
                    )}
                    {error && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 dark:text-gray-400">
                        {t('profile.displayName')}
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl border-gray-200 dark:bg-[#1a1b2e] dark:border-[#33355a] dark:text-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 dark:text-gray-400">
                        {t('profile.emailAddress')}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/30 dark:text-gray-500" />
                        <Input
                          value={profile?.email || ''}
                          disabled
                          className="h-11 rounded-xl border-gray-200 bg-gray-50 dark:bg-[#1a1b2e] dark:border-[#33355a] dark:text-gray-100/50 pl-10"
                        />
                      </div>
                      <p className="text-xs text-charcoal/40 dark:text-gray-500">
                        {t('profile.emailCannotChange')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 dark:text-gray-400">
                        {t('profile.bio')}
                      </Label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 500))}
                        placeholder={t('profile.bioPlaceholder')}
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-charcoal resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent dark:bg-[#1a1b2e] dark:border-[#33355a] dark:text-gray-100 dark:placeholder:text-gray-500"
                      />
                      <p className="text-xs text-charcoal/30 dark:text-gray-500 text-right">
                        {bio.length} / 500
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="cream"
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="rounded-xl px-6 h-11 font-medium"
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {t('profile.saveChanges')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-[#33355a]">
                    <h3 className="text-base font-semibold text-charcoal dark:text-gray-100 flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      {t('profile.activityStats')}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-xl bg-[#f8f9fc] dark:bg-[#1a1b2e]">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-[#33355a] mb-2">
                          <FileCode className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <p className="text-2xl font-bold text-charcoal dark:text-gray-100">{profile?._count.reviews || 0}</p>
                        <p className="text-xs text-charcoal/50 dark:text-gray-400">{t('profile.reviews')}</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-[#f8f9fc] dark:bg-[#1a1b2e]">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-[#33355a] mb-2">
                          <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <p className="text-2xl font-bold text-charcoal dark:text-gray-100">{profile?._count.comments || 0}</p>
                        <p className="text-xs text-charcoal/50 dark:text-gray-400">{t('profile.comments')}</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-[#f8f9fc] dark:bg-[#1a1b2e]">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-[#33355a] mb-2">
                          <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <p className="text-2xl font-bold text-charcoal dark:text-gray-100 capitalize">{profile?.role?.toLowerCase() || 'member'}</p>
                        <p className="text-xs text-charcoal/50 dark:text-gray-400">{t('profile.role')}</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-[#f8f9fc] dark:bg-[#1a1b2e]">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-[#33355a] mb-2">
                          <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-charcoal dark:text-gray-100">
                          {profile?.createdAt ? formatDate(profile.createdAt, language) : '-'}
                        </p>
                        <p className="text-xs text-charcoal/50 dark:text-gray-400">{t('profile.joined')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-[#33355a]">
                    <h3 className="text-base font-semibold text-charcoal dark:text-gray-100 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t('profile.accountDetails')}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-0">
                      <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-[#33355a]">
                        <span className="text-sm text-charcoal/60 dark:text-gray-400">{t('profile.userId')}</span>
                        <span className="text-sm text-charcoal dark:text-gray-100 font-mono">{profile?.id || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-[#33355a]">
                        <span className="text-sm text-charcoal/60 dark:text-gray-400">{t('profile.email')}</span>
                        <span className="text-sm text-charcoal dark:text-gray-100">{profile?.email || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-[#33355a]">
                        <span className="text-sm text-charcoal/60 dark:text-gray-400">{t('profile.role')}</span>
                        <span className="text-sm text-charcoal dark:text-gray-100">{profile?.role || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3.5">
                        <span className="text-sm text-charcoal/60 dark:text-gray-400">{t('profile.memberSince')}</span>
                        <span className="text-sm text-charcoal dark:text-gray-100">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-[#33355a]">
                    <h3 className="text-base font-semibold text-charcoal dark:text-gray-100 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('profile.changePassword')}
                    </h3>
                  </div>
                  <div className="p-6 space-y-5">
                    <p className="text-sm text-charcoal/60 dark:text-gray-400">
                      {t('profile.changePasswordDesc')}
                    </p>

                    {passwordSuccess && (
                      <div className="p-3 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {passwordSuccess}
                      </div>
                    )}
                    {passwordError && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm">
                        {passwordError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 dark:text-gray-400">
                        {t('profile.currentPassword')}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/30 dark:text-gray-500" />
                        <PasswordInput
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={t('profile.currentPassword')}
                          className="h-11 rounded-xl border-gray-200 dark:bg-[#1a1b2e] dark:border-[#33355a] dark:text-gray-100 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 dark:text-gray-400">
                        {t('profile.newPassword')}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/30 dark:text-gray-500" />
                        <PasswordInput
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('profile.newPassword')}
                          className="h-11 rounded-xl border-gray-200 dark:bg-[#1a1b2e] dark:border-[#33355a] dark:text-gray-100 pl-10"
                        />
                      </div>
                      <p className="text-xs text-charcoal/40 dark:text-gray-500">
                        {t('profile.passwordHint')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 dark:text-gray-400">
                        {t('profile.confirmNewPassword')}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/30 dark:text-gray-500" />
                        <PasswordInput
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('profile.confirmNewPassword')}
                          className="h-11 rounded-xl border-gray-200 dark:bg-[#1a1b2e] dark:border-[#33355a] dark:text-gray-100 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Tip */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-6">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        {t('profile.securityTip')}
                      </p>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/70">
                        {t('profile.securityTipDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Update Button */}
                <div className="flex justify-end">
                  <Button
                    variant="cream"
                    onClick={handleChangePassword}
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="rounded-xl px-6 h-11 font-medium"
                  >
                    {passwordLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {t('profile.updatePassword')}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Posts Tab ── */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-[#33355a]">
                    <h3 className="text-base font-semibold text-charcoal dark:text-gray-100 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('community.title')} ({userPosts.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    {postsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400 dark:text-[#4b5563]" />
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="mx-auto mb-3 h-10 w-10 text-charcoal/15 dark:text-gray-700" />
                        <p className="text-sm text-charcoal/50 dark:text-gray-400">
                          {t('community.noPosts')}
                        </p>
                        <a
                          href="/community"
                          className="mt-3 inline-block text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:text-gray-400/80 dark:text-[#9ca3af] dark:hover:text-[#9ca3af]/80"
                        >
                          {t('community.newPost')} →
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userPosts.map((post) => (
                          <a
                            key={post.id}
                            href={`/community/${post.id}`}
                            className="block rounded-xl border border-gray-100 dark:border-[#33355a] p-4 transition-all hover:border-gray-400/30 hover:shadow-sm dark:hover:border-[#4b5563]/30"
                          >
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-charcoal dark:text-gray-100 line-clamp-1">
                                {post.title}
                              </h4>
                              {post.language && (
                                <span className="shrink-0 rounded-badge bg-cream px-2 py-0.5 text-[10px] font-medium text-charcoal/70 dark:bg-[#33355a] dark:text-gray-300">
                                  {post.language}
                                </span>
                              )}
                            </div>
                            <p className="mb-2 text-xs text-charcoal/50 dark:text-gray-400 line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-charcoal/40 dark:text-gray-500">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.likeCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {post.commentCount}
                              </span>
                              <span className="ml-auto">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Hidden avatar file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
    </div>
  );
}
