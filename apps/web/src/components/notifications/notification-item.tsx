'use client';

import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

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

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
}

export default function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  // Get notification icon based on type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post_comment':
      case 'review_comment':
        return '💬';
      case 'comment_reply':
        return '↩️';
      case 'post_like':
        return '❤️';
      case 'review_completed':
        return '✅';
      case 'review_issue':
        return '⚠️';
      case 'system':
        return '🔔';
      default:
        return '🔔';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
        !notification.isRead ? 'bg-purple-50/50 dark:bg-[#714cb6]/10' : ''
      }`}
    >
      {/* Actor Avatar or Type Icon */}
      <div className="relative shrink-0">
        {notification.actor?.avatarUrl ? (
          <img
            src={notification.actor.avatarUrl}
            alt={notification.actor.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#714cb6] to-[#9b7fd4] flex items-center justify-center text-white text-sm font-medium">
            {notification.actor?.name?.charAt(0).toUpperCase() || 'H'}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-sm">{getTypeIcon(notification.type)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-semibold">{notification.actor?.name || 'Hệ thống'}</span>{' '}
          <span className="text-gray-600 dark:text-gray-300">{notification.message}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{timeAgo}</p>
      </div>

      {/* Unread indicator + Delete */}
      <div className="flex items-center gap-2 shrink-0">
        {!notification.isRead && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#714cb6] dark:bg-[#cbb7fb]" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          style={{ opacity: 1 }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
