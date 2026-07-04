'use client';

import { useRouter } from 'next/navigation';
import { CheckCheck, Bell, Loader2 } from 'lucide-react';
import NotificationItem from './notification-item';

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

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function NotificationDropdown({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200 dark:border-[#1e2d44] overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#1e2d44]">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Thông báo</h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-[#4b5563] hover:text-[#374151] dark:text-[#9ca3af] dark:hover:text-[#a994d9] transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#4b5563] dark:text-[#9ca3af] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <Bell className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onDelete={() => onDelete(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
