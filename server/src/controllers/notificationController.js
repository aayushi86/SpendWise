import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';
import { getVapidPublicKey, checkBudgetThresholds } from '../services/notificationService.js';

// @desc    Get user notifications with unread count
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ user: req.user._id }),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      total,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications',
    });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating notification',
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating notifications',
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Notification.findOneAndDelete({ _id: id, user: req.user._id });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting notification',
    });
  }
};

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-key
export const getVapidKey = (req, res) => {
  return res.status(200).json({
    success: true,
    publicKey: getVapidPublicKey(),
  });
};

// @desc    Save browser push subscription
// @route   POST /api/notifications/subscribe
export const subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: req.user._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Push subscription registered successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error saving push subscription',
    });
  }
};

// @desc    Get user notification preferences
// @route   GET /api/notifications/preferences
export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      preferences: user?.notificationPrefs || {
        inApp: true,
        browserPush: true,
        budgetWarning80: true,
        budgetExceeded100: true,
        billReminders: true,
        dailyLimitAlerts: true,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching preferences',
    });
  }
};

// @desc    Update user notification preferences
// @route   PUT /api/notifications/preferences
export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.notificationPrefs = {
      ...user.notificationPrefs,
      ...preferences,
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationPrefs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating preferences',
    });
  }
};
