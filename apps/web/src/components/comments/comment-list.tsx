'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  lineRef: number | null;
  isBot?: boolean;
  createdAt: string;
  author: CommentAuthor;
  replies?: Comment[];
}

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string;
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  const { t } = useLanguage();

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-charcoal/40 dark:text-gray-500">
        <p>{t('comments.noComments')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          isReply={false}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  isReply,
}: {
  comment: Comment;
  currentUserId?: string;
  isReply: boolean;
}) {
  const { t } = useLanguage();
  const isOwner = comment.author.id === currentUserId;
  const isBot = comment.isBot;

  return (
    <div className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200 dark:border-[#1e2d44]' : ''} ${isBot ? 'rounded-lg bg-lavender/10 dark:bg-[#1e2d44]/50 p-3 -mx-3' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isBot ? (
            <div className="w-8 h-8 rounded-full bg-amethyst/20 dark:bg-gray-400/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-amethyst dark:text-gray-300" />
            </div>
          ) : comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2e4060] flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {comment.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body font-medium text-gray-900 dark:text-gray-100">
              {comment.author.name}
            </span>
            {isBot && (
              <span className="text-micro text-amethyst dark:text-gray-300 bg-lavender/20 dark:bg-[#2e4060]/50 px-1.5 py-0.5 rounded">
                {t('reviewDetail.aiBadge')}
              </span>
            )}
            {isOwner && !isBot && (
              <span className="text-micro text-amethyst dark:text-gray-300 bg-lavender/20 dark:bg-[#2e4060]/50 px-1.5 py-0.5 rounded">
                {t('comments.you')}
              </span>
            )}
            <span className="text-caption text-gray-400 dark:text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
            {comment.lineRef && (
              <span className="text-micro text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#1e2d44] px-1.5 py-0.5 rounded">
                {t('comments.line').replace('{line}', String(comment.lineRef))}
              </span>
            )}
          </div>
          <p className="text-body text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
