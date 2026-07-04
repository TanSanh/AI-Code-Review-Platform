'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, ExternalLink, MoreVertical, Pencil, Trash2, Bookmark } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { type TranslationKey } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
    <div className="group rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-gray-300 hover:shadow-lg dark:border-[#1e2d44] dark:bg-[#1a2332] dark:hover:border-gray-500 dark:hover:shadow-xl">
      {/* Header: Author + Time + Menu */}
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/users/${post.author.id}`} className="flex items-center gap-3">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#1e2d44]" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
              {getInitial(post.author.name)}
            </div>
          )}
          <div>
            <span className="text-sm font-semibold text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300">
              {post.author.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatTimeAgo(post.createdAt, t)}
              </span>
              {post.language && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-[#1e2d44] dark:text-gray-300">
                    {post.language}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* 3-dot menu for owner */}
        {isOwner && (
          <DropdownMenu
            trigger={
              <button className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-[#1e2d44] dark:hover:text-gray-300">
                <MoreVertical className="h-4 w-4" />
              </button>
            }
          >
            <DropdownMenuItem
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit(post)}
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

      {/* Title + Content */}
      <Link href={`/community/${post.id}`} className="block">
        <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
          {post.title}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {contentPreview}
        </p>
      </Link>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-4">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full max-h-[500px] rounded-xl object-contain border border-gray-100 dark:border-[#1e2d44]"
          />
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-[#1e2d44] dark:text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Attached Review */}
      {post.review && (
        <Link
          href={`/review/${post.review.id}`}
          className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-[#1e2d44] dark:bg-[#111827] dark:hover:border-gray-500"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-[#1e2d44]">
            <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-700 truncate block dark:text-gray-300">{post.review.title}</span>
          </div>
          {post.review.score !== null && (
            <span className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-bold text-gray-700 dark:bg-[#1e2d44] dark:text-gray-300">
              {post.review.score}
            </span>
          )}
        </Link>
      )}

      {/* Footer: Like + Comment */}
      <div className="flex items-center gap-1 border-t border-gray-100 pt-4 dark:border-[#1e2d44]">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            post.isLiked
              ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
              : 'text-gray-500 hover:bg-gray-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400'
          }`}
        >
          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likeCount}</span>
        </button>

        <Link
          href={`/community/${post.id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#1e2d44] dark:hover:text-gray-300"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentCount}</span>
        </Link>
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
