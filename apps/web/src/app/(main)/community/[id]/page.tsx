'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { type TranslationKey } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  CommunityCommentSection,
  CommunityComment,
} from '@/components/community/community-comment-section';
import { CommunityEditPost } from '@/components/community/community-edit-post';

interface PostAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
}

interface PostReview {
  id: string;
  title: string;
  language: string;
  score: number | null;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  language: string | null;
  tags: string | null;
  imageUrl: string | null;
  author: PostAuthor;
  review: PostReview | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments: CommunityComment[];
  createdAt: string;
}

function formatTimeAgo(dateString: string, t: (key: TranslationKey) => string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('community.justNow');
  if (diffMin < 60) return `${diffMin} ${t('community.minutesAgo')}`;
  if (diffHours < 24) return `${diffHours} ${t('community.hoursAgo')}`;
  return `${diffDays} ${t('community.daysAgo')}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map((t) => t.trim()).filter(Boolean);
}

export default function CommunityPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditPost, setShowEditPost] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userReviews, setUserReviews] = useState<{ id: string; title: string; language: string }[]>([]);

  const fetchPost = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const data = (await api.getCommunityPost(postId)) as unknown as PostDetail;
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [authLoading, postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await api.toggleCommunityLike(post.id);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: result.isLiked,
              likeCount: result.isLiked ? prev.likeCount + 1 : prev.likeCount - 1,
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await api.deleteCommunityPost(post.id);
      toast.success(t('community.postDeleted'));
      router.push('/community');
    } catch {
      toast.error(t('community.deleteFailed'));
    }
  };

  const handleUpdatePost = async (id: string, data: {
    title: string;
    content: string;
    language?: string;
    tags?: string;
    imageUrl?: string;
    reviewId?: string;
  }) => {
    await api.updateCommunityPost(id, data);
    await fetchPost();
    toast.success(t('community.postUpdated'));
  };

  const handleOpenEdit = async () => {
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
      // Silently fail
    }
    setShowEditPost(true);
  };

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!post) return;
    await api.createCommunityComment(post.id, { content, parentId });
    // Refetch post to get updated comments
    await fetchPost();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    await api.deleteCommunityComment(post.id, commentId);
    await fetchPost();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#1a1b2e]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amethyst/30 border-t-amethyst dark:border-[#714cb6]/30 dark:border-t-[#714cb6]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#1a1b2e]">
        <div className="text-center">
          <p className="mb-4 text-body text-charcoal/50 dark:text-gray-400">
            {error || t('reviewDetail.notFound')}
          </p>
          <Button
            onClick={() => router.push('/community')}
            variant="outline"
            className="border-parchment text-charcoal dark:border-[#33355a] dark:text-gray-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('community.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = post.author.id === user?.id;
  const tags = parseTags(post.tags);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1b2e]">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push('/community')}
          className="mb-6 flex items-center gap-2 text-sm text-charcoal/50 transition-colors hover:text-amethyst dark:text-gray-400 dark:hover:text-[#cbb7fb]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('reviewDetail.back')}
        </button>

        {/* Post card */}
        <article className="rounded-card border border-parchment bg-white p-6 dark:border-[#33355a] dark:bg-[#242640]">
          {/* Author header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amethyst/10 text-sm font-semibold text-amethyst dark:bg-[#714cb6]/20 dark:text-[#cbb7fb]">
                {getInitial(post.author.name)}
              </div>
              <div>
                <span className="text-sm font-medium text-charcoal dark:text-gray-100">
                  {post.author.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-charcoal/40 dark:text-gray-500">
                    {formatTimeAgo(post.createdAt, t)}
                  </span>
                  {post.language && (
                    <>
                      <span className="text-charcoal/20 dark:text-gray-600">·</span>
                      <span className="rounded-badge bg-cream px-2 py-0.5 text-xs font-medium text-charcoal/70 dark:bg-[#33355a] dark:text-gray-300">
                        {post.language}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenEdit}
                  className="text-charcoal/30 transition-colors hover:text-amethyst dark:text-gray-600 dark:hover:text-[#cbb7fb]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-charcoal/30 transition-colors hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-heading-large font-bold text-charcoal dark:text-gray-100">
            {post.title}
          </h1>

          {/* Content */}
          <div className="mb-4 whitespace-pre-wrap text-body leading-relaxed text-charcoal/70 dark:text-gray-300">
            {post.content}
          </div>

          {/* Image */}
          {post.imageUrl && (
            <div className="mb-4">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-h-96 object-contain rounded-button border border-parchment dark:border-[#33355a]"
              />
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-badge bg-amethyst/8 px-2.5 py-1 text-xs font-medium text-amethyst dark:bg-[#714cb6]/15 dark:text-[#cbb7fb]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Attached Review */}
          {post.review && (
            <a
              href={`/review/${post.review.id}`}
              className="mb-4 flex items-center gap-2 rounded-button border border-parchment/50 bg-cream/50 px-4 py-3 text-sm text-charcoal/60 transition-colors hover:border-amethyst/30 hover:text-amethyst dark:border-[#33355a]/50 dark:bg-[#1e2038] dark:text-gray-400 dark:hover:border-[#714cb6]/30 dark:hover:text-[#cbb7fb]"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="font-medium">{t('community.viewReview')}: {post.review.title}</span>
              {post.review.score !== null && (
                <span className="ml-auto font-semibold text-amethyst dark:text-[#cbb7fb]">
                  {post.review.score}/100
                </span>
              )}
            </a>
          )}

          {/* Like + Comment count */}
          <div className="flex items-center gap-4 border-t border-parchment/50 pt-4 dark:border-[#33355a]/50">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                post.isLiked
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-charcoal/40 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
              }`}
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likeCount} {t('community.likes')}</span>
            </button>
            <span className="text-sm text-charcoal/40 dark:text-gray-500">
              {post.commentCount} {t('community.comments')}
            </span>
          </div>
        </article>

        {/* Comments Section */}
        <section className="mt-6 rounded-card border border-parchment bg-white p-6 dark:border-[#33355a] dark:bg-[#242640]">
          <h2 className="mb-4 text-heading-card font-semibold text-charcoal dark:text-gray-100">
            {t('community.comments')} ({post.commentCount})
          </h2>
          <CommunityCommentSection
            postId={post.id}
            comments={post.comments || []}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
            currentUserId={user?.id || ''}
          />
        </section>
      </main>

      {/* Edit Post Dialog */}
      <CommunityEditPost
        open={showEditPost}
        post={post ? {
          id: post.id,
          title: post.title,
          content: post.content,
          language: post.language,
          tags: post.tags,
          imageUrl: post.imageUrl,
          reviewId: post.review?.id,
        } : null}
        reviews={userReviews}
        onClose={() => setShowEditPost(false)}
        onSubmit={handleUpdatePost}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('community.deletePostTitle')}
        message={t('community.deletePostMessage')}
        confirmLabel={t('community.delete')}
        onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
