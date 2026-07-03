'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';

interface UseCommunitySocketOptions {
  postId?: string;
  onCommentCreated?: (comment: unknown) => void;
  onCommentDeleted?: (data: { postId: string; commentId: string }) => void;
}

export function useCommunitySocket({
  postId,
  onCommentCreated,
  onCommentDeleted,
}: UseCommunitySocketOptions) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !postId) return;

    // Join the community post room
    socket.emit('join:community', { postId });

    // Listen for events
    if (onCommentCreated) {
      socket.on('community:comment:created', onCommentCreated);
    }
    if (onCommentDeleted) {
      socket.on('community:comment:deleted', onCommentDeleted);
    }

    return () => {
      socket.emit('leave:community', { postId });
      socket.off('community:comment:created');
      socket.off('community:comment:deleted');
    };
  }, [socket, isConnected, postId, onCommentCreated, onCommentDeleted]);

  return { isConnected };
}
