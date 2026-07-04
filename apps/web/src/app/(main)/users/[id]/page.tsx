'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Calendar,
  FileCode,
  MessageSquare,
  Users,
  Heart,
  Loader2,
  ArrowLeft,
  BookOpen,
  Heart as HeartIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import { formatDate } from '@/lib/utils';

interface PublicProfile {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  totalLikes: number;
  _count: {
    reviews: number;
    comments: number;
    communityPosts: number;
    communityComments: number;
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
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

type Tab = 'overview' | 'posts';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsMeta, setPostsMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getUserProfile(userId);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'User not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch user posts
  useEffect(() => {
    if (activeTab !== 'posts') return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const result = await api.getUserPosts(userId, { page: 1, limit: 20 });
        setUserPosts(result.data as UserPost[]);
        setPostsMeta(result.meta);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#1a1b2e]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#4b5563] dark:text-[#9ca3af]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#1a1b2e]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <User className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('profile.notFound')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || t('profile.notFoundDesc')}
            </p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4b5563] text-white hover:bg-[#374151] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('profile.backToCommunity')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = profile.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#1a1b2e]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('profile.backToCommunity')}
        </Link>

        {/* Profile Header */}
        <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-[#33355a] shadow-lg"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#4b5563] to-[#6b7280] border-4 border-white dark:border-[#33355a] shadow-lg">
                  <span className="text-3xl font-bold text-white">{userInitial}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.name}
                </h1>
                {profile.bio && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-lg">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {t('profile.joinedOn')} {formatDate(profile.createdAt, 'vi')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-gray-100 dark:border-[#33355a] bg-gray-50 dark:bg-[#1a1b2e]/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 dark:divide-[#33355a]">
              <div className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#4b5563]/10 dark:bg-[#9ca3af]/10 mb-2">
                  <FileCode className="h-5 w-5 text-[#4b5563] dark:text-[#9ca3af]" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile._count.reviews}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.publicReviews')}</p>
              </div>
              <div className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#4b5563]/10 dark:bg-[#9ca3af]/10 mb-2">
                  <Heart className="h-5 w-5 text-[#4b5563] dark:text-[#9ca3af]" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.totalLikes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.totalLikes')}</p>
              </div>
              <div className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#4b5563]/10 dark:bg-[#9ca3af]/10 mb-2">
                  <BookOpen className="h-5 w-5 text-[#4b5563] dark:text-[#9ca3af]" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile._count.communityPosts}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.publicPosts')}</p>
              </div>
              <div className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#4b5563]/10 dark:bg-[#9ca3af]/10 mb-2">
                  <MessageSquare className="h-5 w-5 text-[#4b5563] dark:text-[#9ca3af]" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile._count.communityComments}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.replies')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] mb-6 px-2 py-1.5 flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-[#4b5563] text-white dark:bg-[#9ca3af] dark:text-[#1a1b2e] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5'
            }`}
          >
            <User className="h-4 w-4" />
            {t('profile.overview')}
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'posts'
                ? 'bg-[#4b5563] text-white dark:bg-[#9ca3af] dark:text-[#1a1b2e] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {t('profile.userPosts').replace('{count}', String(profile._count.communityPosts))}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('profile.about')}
            </h3>
            {profile.bio ? (
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">
                {t('profile.noBio')}
              </p>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#4b5563] dark:text-[#9ca3af]" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] p-12 text-center">
                <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('profile.noPosts')}
                </p>
              </div>
            ) : (
              userPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block bg-white dark:bg-[#242640] rounded-2xl border border-gray-100 dark:border-[#33355a] p-5 transition-all hover:border-[#4b5563]/30 hover:shadow-md dark:hover:border-[#9ca3af]/30"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {post.title}
                    </h4>
                    {post.language && (
                      <span className="shrink-0 rounded-full bg-[#4b5563]/10 dark:bg-[#9ca3af]/10 px-2.5 py-0.5 text-xs font-medium text-[#4b5563] dark:text-[#9ca3af]">
                        {post.language}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.commentCount}
                    </span>
                    <span className="ml-auto">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
