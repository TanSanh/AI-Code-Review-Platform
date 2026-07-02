'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { type TranslationKey } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PostAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface PostReview {
  id: string;
  title: string;
  language: string;
  score: number | null;
}

export interface CommunityPost {
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
  createdAt: string;
}

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onEdit: (post: CommunityPost) => void;
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

export function CommunityPostCard({ post, currentUserId, onLike, onDelete, onEdit }: CommunityPostCardProps) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = post.author.id === currentUserId;
  const tags = parseTags(post.tags);
  const contentPreview = post.content.length > 200
    ? post.content.slice(0, 200) + '...'
    : post.content;

  return (
    <div className="group rounded-card border border-parchment bg-white p-5 transition-all duration-200 hover:border-amethyst/30 hover:shadow-md dark:border-[#33355a] dark:bg-[#242640] dark:hover:border-[#714cb6]/30 dark:hover:shadow-lg dark:hover:shadow-[#714cb6]/5">
      {/* Header: Author + Time + Language */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amethyst/10 text-sm font-semibold text-amethyst dark:bg-[#714cb6]/20 dark:text-[#cbb7fb]">
            {getInitial(post.author.name)}
          </div>
          <div>
            <span className="text-sm font-medium text-charcoal dark:text-gray-100">
              {post.author.name}
            </span>
            <span className="ml-2 text-xs text-charcoal/40 dark:text-gray-500">
              {formatTimeAgo(post.createdAt, t)}
            </span>
          </div>
        </div>

        {/* Language badge */}
        {post.language && (
          <span className="rounded-badge bg-cream px-2 py-0.5 text-xs font-medium text-charcoal/70 dark:bg-[#33355a] dark:text-gray-300">
            {post.language}
          </span>
        )}
      </div>

      {/* Title + Content */}
      <Link href={`/community/${post.id}`} className="block">
        <h3 className="mb-1.5 text-heading-card font-semibold text-charcoal transition-colors group-hover:text-amethyst dark:text-gray-100 dark:group-hover:text-[#cbb7fb]">
          {post.title}
        </h3>
        <p className="mb-3 text-body text-charcoal/60 dark:text-gray-400">
          {contentPreview}
        </p>
      </Link>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-3">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full max-h-[500px] object-contain rounded-button border border-parchment dark:border-[#33355a]"
          />
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-badge bg-amethyst/8 px-2 py-0.5 text-xs font-medium text-amethyst dark:bg-[#714cb6]/15 dark:text-[#cbb7fb]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Attached Review */}
      {post.review && (
        <Link
          href={`/review/${post.review.id}`}
          className="mb-3 flex items-center gap-2 rounded-button border border-parchment/50 bg-cream/50 px-3 py-2 text-xs text-charcoal/60 transition-colors hover:border-amethyst/30 hover:text-amethyst dark:border-[#33355a]/50 dark:bg-[#1e2038] dark:text-gray-400 dark:hover:border-[#714cb6]/30 dark:hover:text-[#cbb7fb]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="font-medium">{t('community.viewReview')}: {post.review.title}</span>
          {post.review.score !== null && (
            <span className="ml-auto font-semibold text-amethyst dark:text-[#cbb7fb]">
              {post.review.score}/100
            </span>
          )}
        </Link>
      )}

      {/* Footer: Like + Comment + Edit + Delete */}
      <div className="flex items-center gap-4 border-t border-parchment/50 pt-3 dark:border-[#33355a]/50">
        {/* Like button */}
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.isLiked
              ? 'text-red-500 dark:text-red-400'
              : 'text-charcoal/40 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
          }`}
        >
          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likeCount}</span>
        </button>

        {/* Comment count */}
        <Link
          href={`/community/${post.id}`}
          className="flex items-center gap-1.5 text-sm text-charcoal/40 transition-colors hover:text-amethyst dark:text-gray-500 dark:hover:text-[#cbb7fb]"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentCount}</span>
        </Link>

        {/* Owner actions */}
        {isOwner && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => onEdit(post)}
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

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('community.deletePostTitle')}
        message={t('community.deletePostMessage')}
        confirmLabel={t('community.delete')}
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(post.id); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
