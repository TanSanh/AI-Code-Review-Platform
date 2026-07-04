'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ExternalLink, MoreVertical, Pencil, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useCommunitySocket } from '@/hooks/use-community-socket';
import { type TranslationKey } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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

/** Recursively insert a reply into the comment tree. Returns true if parent was found. */
function insertReply(
  comments: CommunityComment[],
  parentId: string,
  reply: CommunityComment,
): boolean {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === parentId) {
      comments[i] = {
        ...comments[i],
        replies: [...(comments[i].replies || []), reply],
      };
      return true;
    }
    if (comments[i].replies?.length) {
      const cloned = { ...comments[i], replies: [...(comments[i].replies || [])] };
      if (insertReply(cloned.replies, parentId, reply)) {
        comments[i] = cloned;
        return true;
      }
    }
  }
  return false;
}

/** Recursively remove a comment by ID from the tree at any depth. */
function removeComment(comments: CommunityComment[], id: string): CommunityComment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({
      ...c,
      replies: removeComment(c.replies || [], id),
    }));
}

export default function CommunityPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const postId = params.id as string;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

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

  // Realtime: handle new comment from another user
  const handleRemoteCommentCreated = useCallback((raw: unknown) => {
    const comment = raw as CommunityComment;
    setPost((prev) => {
      if (!prev) return prev;
      // Skip if this is our own comment (we already refetch)
      if (comment.author.id === user?.id) return prev;

      const newComments = [...(prev.comments || [])];
      if (comment.parentId) {
        // Recursively find parent at any depth and add reply
        const added = insertReply(newComments, comment.parentId, comment);
        if (!added) {
          // Parent not found (deleted?), refetch
          fetchPost();
          return prev;
        }
      } else {
        // Top-level comment
        newComments.unshift(comment);
      }
      return { ...prev, comments: newComments, commentCount: prev.commentCount + 1 };
    });
  }, [user?.id, fetchPost]);

  // Realtime: handle deleted comment
  const handleRemoteCommentDeleted = useCallback((data: { postId: string; commentId: string }) => {
    setPost((prev) => {
      if (!prev || prev.id !== data.postId) return prev;
      const newComments = removeComment(prev.comments, data.commentId);
      return { ...prev, comments: newComments, commentCount: Math.max(0, prev.commentCount - 1) };
    });
  }, []);

  // Connect to community socket
  const { isConnected: isSocketConnected } = useCommunitySocket({
    postId: post?.id,
    onCommentCreated: handleRemoteCommentCreated,
    onCommentDeleted: handleRemoteCommentDeleted,
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0b1120]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-[#1e2d44] dark:border-t-gray-100" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0b1120]">
        <div className="text-center">
          <div className="mb-4 text-6xl">📝</div>
          <p className="mb-4 text-lg text-gray-500 dark:text-gray-400">
            {error || t('reviewDetail.notFound')}
          </p>
          <Button
            onClick={() => router.push('/community')}
            className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1120]">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/community')}
          className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#1a2332] dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('reviewDetail.back')}
        </button>

        {/* Post card */}
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#1e2d44] dark:bg-[#1a2332]">
          {/* Header */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <a href={`/users/${post.author.id}`}>
                  {post.author.avatarUrl ? (
                    <img src={post.author.avatarUrl} alt={post.author.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md dark:ring-[#1a2332]" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                      {getInitial(post.author.name)}
                    </div>
                  )}
                </a>
                <div>
                  <a href={`/users/${post.author.id}`} className="text-base font-semibold text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300">
                    {post.author.name}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {formatTimeAgo(post.createdAt, t)}
                    </span>
                    {post.language && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-[#1e2d44] dark:text-gray-300">
                          {post.language}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3-dot menu for owner */}
              {isOwner && (
                <DropdownMenu
                  trigger={
                    <button className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-[#1e2d44] dark:hover:text-gray-300">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  }
                >
                  <DropdownMenuItem
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={handleOpenEdit}
                  >
                    {t('community.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {t('community.delete')}
                  </DropdownMenuItem>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Title */}
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {post.title}
            </h1>

            {/* Content */}
            <div className="prose prose-gray max-w-none whitespace-pre-wrap text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {post.content}
            </div>

            {/* Image */}
            {post.imageUrl && (
              <div className="mt-5">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full max-h-[500px] rounded-xl object-contain border border-gray-100 dark:border-[#2a3a52]"
                />
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 dark:bg-[#1e2d44] dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Attached Review */}
            {post.review && (
              <a
                href={`/review/${post.review.id}`}
                className="mt-5 flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 transition-all hover:border-gray-300 hover:shadow-lg dark:border-[#1e2d44] dark:bg-[#111827] dark:hover:border-gray-500"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 dark:bg-[#1e2d44]">
                  <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('community.viewReview')}</span>
                  <p className="font-semibold text-gray-900 truncate dark:text-gray-100">{post.review.title}</p>
                </div>
                {post.review.score !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.review.score}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">/100</span>
                  </div>
                )}
              </a>
            )}
          </div>

          {/* Footer: Like + Comment count */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-[#1e2d44] dark:bg-[#111827]/50">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  post.isLiked
                    ? 'bg-red-50 text-red-500 shadow-sm dark:bg-red-500/10 dark:text-red-400'
                    : 'text-gray-500 hover:bg-white hover:text-red-500 dark:text-gray-400 dark:hover:bg-[#1a2332] dark:hover:text-red-400'
                }`}
              >
                <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likeCount} {t('community.likes')}</span>
              </button>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {post.commentCount} {t('community.comments')}
              </span>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#1e2d44] dark:bg-[#1a2332]">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-[#1e2d44]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('community.comments')} ({post.commentCount})
            </h2>
          </div>
          <div className="p-6">
            <CommunityCommentSection
              postId={post.id}
              comments={post.comments || []}
              onAdd={handleAddComment}
              onDelete={handleDeleteComment}
              currentUserId={user?.id || ''}
            />
          </div>
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
