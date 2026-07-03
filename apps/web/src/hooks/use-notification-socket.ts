'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
  createdAt: string;
}

export function useNotificationSocket() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);

  // Load initial notifications
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadNotifications = async () => {
      try {
        const [notiData, countData] = await Promise.all([
          api.getNotifications({ limit: 20 }),
          api.getUnreadNotificationCount(),
        ]);
        setNotifications(notiData.notifications);
        setUnreadCount(countData.count);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Listen for realtime notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationCreated = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    const handleNotificationCount = (count: number) => {
      setUnreadCount(count);
    };

    socket.on('notification:created', handleNotificationCreated);
    socket.on('notification:count', handleNotificationCount);

    return () => {
      socket.off('notification:created', handleNotificationCreated);
      socket.off('notification:count', handleNotificationCount);
    };
  }, [socket, isConnected]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
