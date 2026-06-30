'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';

interface UseSocketOptions {
  reviewId?: string;
  onCommentCreated?: (comment: unknown) => void;
  onReviewCompleted?: (review: unknown) => void;
  onIssueUpdated?: (issue: unknown) => void;
  onUserTyping?: (data: { userId: string; isTyping: boolean }) => void;
}

export function useReviewSocket({
  reviewId,
  onCommentCreated,
  onReviewCompleted,
  onIssueUpdated,
  onUserTyping,
}: UseSocketOptions) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !reviewId) return;

    // Join the review room
    socket.emit('join:review', { reviewId });

    // Listen for events
    if (onCommentCreated) {
      socket.on('comment:created', onCommentCreated);
    }
    if (onReviewCompleted) {
      socket.on('review:completed', onReviewCompleted);
    }
    if (onIssueUpdated) {
      socket.on('issue:updated', onIssueUpdated);
    }
    if (onUserTyping) {
      socket.on('user:typing', onUserTyping);
    }

    return () => {
      socket.emit('leave:review', { reviewId });
      socket.off('comment:created');
      socket.off('review:completed');
      socket.off('issue:updated');
      socket.off('user:typing');
    };
  }, [socket, isConnected, reviewId, onCommentCreated, onReviewCompleted, onIssueUpdated, onUserTyping]);

  const startTyping = useCallback(() => {
    if (socket && isConnected && reviewId) {
      socket.emit('typing:start', { reviewId });
    }
  }, [socket, isConnected, reviewId]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected && reviewId) {
      socket.emit('typing:stop', { reviewId });
    }
  }, [socket, isConnected, reviewId]);

  return { isConnected, startTyping, stopTyping };
}
