'use client';

import React, { useState } from 'react';
import { Trash2, Reply } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { type TranslationKey } from '@/lib/i18n';

interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CommunityComment {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  replies?: CommunityComment[];
}

interface CommunityCommentSectionProps {
  postId: string;
  comments: CommunityComment[];
  onAdd: (content: string, parentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  currentUserId: string;
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

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  depth = 0,
}: {
  comment: CommunityComment;
  currentUserId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  depth?: number;
}) {
  const { t } = useLanguage();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isOwner = comment.author.id === currentUserId;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-8' : ''}>
      <div className="group rounded-button bg-gray-50/50 p-3 dark:bg-[#1e2038]/50">
        {/* Header */}
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amethyst/10 text-xs font-semibold text-amethyst dark:bg-[#714cb6]/20 dark:text-[#cbb7fb]">
            {getInitial(comment.author.name)}
          </div>
          <span className="text-sm font-medium text-charcoal dark:text-gray-200">
            {comment.author.name}
          </span>
          <span className="text-xs text-charcoal/30 dark:text-gray-600">
            {formatTimeAgo(comment.createdAt, t)}
          </span>
        </div>

        {/* Content */}
        <p className="mb-2 pl-9 text-body text-charcoal/70 dark:text-gray-300">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pl-9">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-xs text-charcoal/30 transition-colors hover:text-amethyst dark:text-gray-600 dark:hover:text-[#cbb7fb]"
          >
            <Reply className="h-3.5 w-3.5" />
            {t('community.reply')}
          </button>
          {isOwner && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-charcoal/30 transition-colors hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3 pl-9">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                placeholder={t('community.writeComment')}
                className="flex-1 rounded-button border border-parchment bg-white px-3 py-1.5 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-amethyst focus:outline-none focus:ring-1 focus:ring-amethyst/30 dark:border-[#33355a] dark:bg-[#242640] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-[#714cb6]"
              />
              <button
                onClick={handleReply}
                disabled={submitting || !replyContent.trim()}
                className="rounded-button bg-amethyst px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amethyst/90 disabled:opacity-50 dark:bg-[#714cb6] dark:hover:bg-[#714cb6]/90"
              >
                {t('community.send')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommunityCommentSection({
  comments,
  onAdd,
  onDelete,
  currentUserId,
}: CommunityCommentSectionProps) {
  const { t } = useLanguage();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(newComment.trim());
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    await onAdd(content, parentId);
  };

  return (
    <div>
      {/* Comment form */}
      <div className="mb-6 flex gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amethyst/10 text-sm font-semibold text-amethyst dark:bg-[#714cb6]/20 dark:text-[#cbb7fb]">
          {getInitial(currentUserId)}
        </div>
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t('community.writeComment')}
              className="flex-1 rounded-button border border-parchment bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-amethyst focus:outline-none focus:ring-1 focus:ring-amethyst/30 dark:border-[#33355a] dark:bg-[#1e2038] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-[#714cb6]"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="rounded-button bg-amethyst px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amethyst/90 disabled:opacity-50 dark:bg-[#714cb6] dark:hover:bg-[#714cb6]/90"
            >
              {t('community.send')}
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-charcoal/30 dark:text-gray-600">
          {t('community.noComments')}
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={handleReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
