import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    inApp: true,
    browserPush: true,
    budgetWarning80: true,
    budgetExceeded100: true,
    billReminders: true,
    dailyLimitAlerts: true,
  });

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications({ limit: 40 });
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [isAuthenticated]);

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotificationPreferences();
      if (res.success) {
        setPreferences(res.preferences);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchPreferences();
      // Poll every 45s for fresh alerts
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications, fetchPreferences]);

  const markAsRead = async (id) => {
    try {
      const res = await api.markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await api.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const res = await api.updateNotificationPreferences(newPrefs);
      if (res.success) {
        setPreferences(res.preferences);
      }
      return res;
    } catch (err) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  };

  // Browser Push Permission Request and VAPID Registration
  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Notification permission was denied or dismissed.');
      return false;
    }

    // Register Web Push if service worker supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const vapidRes = await api.getVapidKey();
        if (vapidRes.success && vapidRes.publicKey) {
          const registration = await navigator.serviceWorker.ready;
          const convertedKey = urlBase64ToUint8Array(vapidRes.publicKey);

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });

          await api.subscribePush(subscription);
          alert('✅ Push notifications registered successfully!');
          return true;
        }
      } catch (err) {
        console.warn('Push manager subscription note:', err);
      }
    }

    alert('In-browser notification permission enabled!');
    return true;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

// Utility function to convert VAPID base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
