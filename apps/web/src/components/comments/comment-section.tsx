'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CommentList } from './comment-list';
import { CommentForm } from './comment-form';
import { useReviewSocket } from '@/hooks/use-socket';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

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

interface CommentSectionProps {
  reviewId: string;
}

export function CommentSection({ reviewId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const handleCommentCreated = useCallback((comment: unknown) => {
    const newComment = comment as Comment;
    setComments((prev) => {
      // Check if comment already exists
      if (prev.some((c) => c.id === newComment.id)) {
        return prev;
      }
      // Add new comment at the beginning (newest first)
      return [newComment, ...prev];
    });
  }, []);

  const handleUserTyping = useCallback((data: { userId: string; isTyping: boolean }) => {
    setTypingUsers((prev) => {
      const next = new Set(prev);
      if (data.isTyping) {
        next.add(data.userId);
      } else {
        next.delete(data.userId);
      }
      return next;
    });
  }, []);

  const { isConnected, startTyping, stopTyping } = useReviewSocket({
    reviewId,
    onCommentCreated: handleCommentCreated,
    onUserTyping: handleUserTyping,
  });

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await api.getComments(reviewId) as Comment[];
        setComments(data || []);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [reviewId]);

  const handleSubmitComment = async (content: string) => {
    await api.createComment(reviewId, { content });
    // Comment will be added via WebSocket event
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mysteria" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-caption">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-charcoal/60">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Typing indicators */}
      {typingUsers.size > 0 && (
        <div className="text-caption text-charcoal/60 italic">
          {typingUsers.size === 1
            ? 'Someone is typing...'
            : `${typingUsers.size} people are typing...`}
        </div>
      )}

      {/* Comments list */}
      <CommentList comments={comments} currentUserId={user?.id} />

      {/* Comment form */}
      <div className="pt-4 border-t border-parchment">
        <CommentForm
          onSubmit={handleSubmitComment}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}
