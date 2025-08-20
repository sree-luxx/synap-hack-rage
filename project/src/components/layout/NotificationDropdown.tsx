import React from 'react';
import { motion } from 'framer-motion';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeColor = (type: string) => {
    const colorMap = {
      success: 'text-neon-green',
      error: 'text-neon-pink',
      warning: 'text-yellow-400',
      info: 'text-neon-blue',
    };
    return colorMap[type as keyof typeof colorMap] || 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-80 neon-card rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-neon-purple" />
            Notifications
          </h3>
          <div className="flex items-center space-x-2">
            {notifications.some(n => !n.read) && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto scrollbar-neon">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-900/50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-gray-900/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-medium ${getTypeColor(notification.type)}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-neon-purple rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.actionUrl && (
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="text-gray-500 hover:text-gray-400 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};