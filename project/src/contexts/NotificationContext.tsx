import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mock initial notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: 'current-user',
        title: 'Welcome to HackVerse!',
        message: 'Your account has been created successfully.',
        type: 'success',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      {
        id: '2',
        userId: 'current-user',
        title: 'New Event Available',
        message: 'AI Innovation Challenge is now open for registration.',
        type: 'info',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        actionUrl: '/events/ai-innovation-challenge',
      },
      {
        id: '3',
        userId: 'current-user',
        title: 'Team Invitation',
        message: 'You have been invited to join Team Alpha.',
        type: 'info',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};