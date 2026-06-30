'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';

interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  lineRef: number | null;
  createdAt: string;
  author: CommentAuthor;
  replies?: Comment[];
}

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string;
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-charcoal/40">
        <p>No comments yet. Start the discussion!</p>
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
  const isOwner = comment.author.id === currentUserId;

  return (
    <div className={`${isReply ? 'ml-8 pl-4 border-l-2 border-parchment' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-lavender/30 flex items-center justify-center">
              <span className="text-sm font-medium text-amethyst">
                {comment.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body font-medium text-charcoal">
              {comment.author.name}
            </span>
            {isOwner && (
              <span className="text-micro text-amethyst bg-lavender/20 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
            <span className="text-caption text-charcoal/40">
              {formatDate(comment.createdAt)}
            </span>
            {comment.lineRef && (
              <span className="text-micro text-charcoal/40 bg-parchment/50 px-1.5 py-0.5 rounded">
                Line {comment.lineRef}
              </span>
            )}
          </div>
          <p className="text-body text-charcoal whitespace-pre-wrap">{comment.content}</p>
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
