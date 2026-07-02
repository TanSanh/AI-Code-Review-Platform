'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityPostCard, CommunityPost } from '@/components/community/community-post-card';
import { CommunityCreatePost } from '@/components/community/community-create-post';
import { CommunityEditPost } from '@/components/community/community-edit-post';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'popular'>('latest');

  // Create post dialog
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userReviews, setUserReviews] = useState<{ id: string; title: string; language: string }[]>([]);

  // Edit post dialog
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  const fetchPosts = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 10,
        sort: sortOrder,
      };
      if (languageFilter && languageFilter !== 'all') params.language = languageFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const result = await api.getCommunityPosts(params as Parameters<typeof api.getCommunityPosts>[0]);
      setPosts(result.data as CommunityPost[]);
      setTotalPages((result.meta as { totalPages: number }).totalPages);
      setTotal((result.meta as { total: number }).total);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, page, sortOrder, languageFilter, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch user's reviews for the create post dialog
  const fetchUserReviews = useCallback(async () => {
    try {
      const result = await api.getReviews({ limit: 50 });
      setUserReviews(
        (result.data as { id: string; title: string; language: string }[]).map((r) => ({
          id: r.id,
          title: r.title,
          language: r.language,
        }))
      );
    } catch {
      // Silently fail - reviews are optional
    }
  }, []);

  const handleOpenCreatePost = () => {
    fetchUserReviews();
    setShowCreatePost(true);
  };

  const handleCreatePost = async (data: {
    title: string;
    content: string;
    language?: string;
    tags?: string;
    reviewId?: string;
    imageUrl?: string;
  }) => {
    await api.createCommunityPost(data);
    setPage(1);
    await fetchPosts();
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await toggleLikeOptimistic(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: result.isLiked,
                likeCount: result.isLiked ? p.likeCount + 1 : p.likeCount - 1,
              }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const toggleLikeOptimistic = async (postId: string) => {
    return api.toggleCommunityLike(postId);
  };

  const handleDelete = async (postId: string) => {
    try {
      await api.deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotal((prev) => prev - 1);
      toast.success(t('community.postDeleted'));
    } catch {
      toast.error(t('community.deleteFailed'));
    }
  };

  const handleEdit = (post: CommunityPost) => {
    setEditingPost(post);
    fetchUserReviews();
    setShowEditPost(true);
  };

  const handleUpdatePost = async (id: string, data: {
    title: string;
    content: string;
    language?: string;
    tags?: string;
    imageUrl?: string;
  }) => {
    await api.updateCommunityPost(id, data);
    await fetchPosts();
    toast.success(t('community.postUpdated'));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#1a1b2e]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amethyst/30 border-t-amethyst dark:border-[#714cb6]/30 dark:border-t-[#714cb6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1b2e]">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-display-section font-bold text-charcoal dark:text-gray-100">
              {t('community.title')}
            </h1>
            <p className="text-body text-charcoal/50 dark:text-gray-400">
              {t('community.subtitle')}
            </p>
          </div>
          <Button
            onClick={handleOpenCreatePost}
            className="bg-amethyst text-white hover:bg-amethyst/90 dark:bg-[#714cb6] dark:hover:bg-[#714cb6]/90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('community.newPost')}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/30 dark:text-gray-600" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t('community.search')}
              className="pl-10 border-parchment bg-white text-charcoal placeholder:text-charcoal/30 dark:border-[#33355a] dark:bg-[#242640] dark:text-gray-100 dark:placeholder:text-gray-600"
            />
          </div>

          <Select
            value={languageFilter}
            onValueChange={(val) => {
              setLanguageFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44 border-parchment bg-white text-charcoal dark:border-[#33355a] dark:bg-[#242640] dark:text-gray-100">
              <SelectValue placeholder={t('community.allLanguages')} />
            </SelectTrigger>
            <SelectContent className="border-parchment bg-white dark:border-[#33355a] dark:bg-[#242640]">
              <SelectItem value="all">{t('community.allLanguages')}</SelectItem>
              <SelectItem value="TypeScript">TypeScript</SelectItem>
              <SelectItem value="JavaScript">JavaScript</SelectItem>
              <SelectItem value="Python">Python</SelectItem>
              <SelectItem value="Java">Java</SelectItem>
              <SelectItem value="Go">Go</SelectItem>
              <SelectItem value="Rust">Rust</SelectItem>
              <SelectItem value="C#">C#</SelectItem>
              <SelectItem value="PHP">PHP</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(val: 'latest' | 'popular') => {
              setSortOrder(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40 border-parchment bg-white text-charcoal dark:border-[#33355a] dark:bg-[#242640] dark:text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-parchment bg-white dark:border-[#33355a] dark:bg-[#242640]">
              <SelectItem value="latest">{t('community.sortLatest')}</SelectItem>
              <SelectItem value="popular">{t('community.sortPopular')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amethyst/30 border-t-amethyst dark:border-[#714cb6]/30 dark:border-t-[#714cb6]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-charcoal/15 dark:text-gray-700" />
            <h3 className="mb-1 text-heading-card font-semibold text-charcoal dark:text-gray-200">
              {t('community.noPosts')}
            </h3>
            <p className="text-body text-charcoal/40 dark:text-gray-500">
              {t('community.noPostsDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                currentUserId={user?.id || ''}
                onLike={handleLike}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-parchment text-charcoal dark:border-[#33355a] dark:text-gray-300"
            >
              {t('reviews.previous')}
            </Button>
            <span className="text-sm text-charcoal/50 dark:text-gray-400">
              {t('reviews.pageOf').replace('{page}', String(page)).replace('{total}', String(totalPages))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-parchment text-charcoal dark:border-[#33355a] dark:text-gray-300"
            >
              {t('reviews.next')}
            </Button>
          </div>
        )}
      </main>

      {/* Create Post Dialog */}
      <CommunityCreatePost
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        reviews={userReviews}
      />

      {/* Edit Post Dialog */}
      <CommunityEditPost
        open={showEditPost}
        post={editingPost ? {
          id: editingPost.id,
          title: editingPost.title,
          content: editingPost.content,
          language: editingPost.language,
          tags: editingPost.tags,
          imageUrl: editingPost.imageUrl,
          reviewId: editingPost.review?.id || null,
        } : null}
        reviews={userReviews}
        onClose={() => { setShowEditPost(false); setEditingPost(null); }}
        onSubmit={handleUpdatePost}
      />
    </div>
  );
}
