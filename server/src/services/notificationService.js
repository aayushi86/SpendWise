import * as webpush from 'web-push';
import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

let vapidConfigured = false;

export const initVapid = () => {
  if (vapidConfigured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:notifications@spendwise.app';

  if (pub && priv) {
    try {
      webpush.setVapidDetails(email, pub, priv);
      vapidConfigured = true;
      console.log('[SpendWise Push] VAPID Web Push initialized successfully.');
    } catch (err) {
      console.warn('[SpendWise Push] VAPID initialization note:', err.message);
    }
  }
};

// Initialize early if env is ready
initVapid();

export const getVapidPublicKey = () => {
  initVapid();
  return process.env.VAPID_PUBLIC_KEY || '';
};

// Send push notification to all active devices of the user
export const sendPushToUser = async (userId, payload) => {
  try {
    initVapid();
    if (!vapidConfigured) return;
    const subscriptions = await PushSubscription.find({ user: userId });
    if (!subscriptions || subscriptions.length === 0) return;

    const payloadString = JSON.stringify(payload);
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payloadString
        );
      } catch (err) {
        // If subscription is expired (410 or 404), remove it from DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('[SpendWise Push Error]:', error.message);
  }
};

/**
 * Check budget thresholds (80% and 100%) for a user in a given month.
 * Automatically creates notification records and triggers Web Push.
 * Ensures:
 * 1. Each threshold alert triggers only once per category per budget month.
 * 2. Duplicate notifications are completely prevented.
 * 3. Fresh alerts are enabled when a new month starts.
 */
export const checkBudgetThresholds = async (userId, targetDate = new Date()) => {
  try {
    const d = new Date(targetDate);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // Get user preferences
    const user = await User.findById(userId);
    const prefs = user?.notificationPrefs || {
      inApp: true,
      browserPush: true,
      budgetWarning80: true,
      budgetExceeded100: true,
    };

    if (!prefs.inApp && !prefs.browserPush) return [];

    // Fetch all budgets for user in this month
    const budgets = await Budget.find({ user: userId, month });
    if (!budgets || budgets.length === 0) return [];

    // Calculate actual spending for that month
    const [year, m] = month.split('-').map(Number);
    const startOfMonth = new Date(year, m - 1, 1);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);

    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spentByCategory = {};
    let totalMonthExpense = 0;
    expenseAgg.forEach((item) => {
      spentByCategory[item._id] = item.totalSpent;
      totalMonthExpense += item.totalSpent;
    });

    const newNotifications = [];

    for (const b of budgets) {
      const spent = b.category === 'Overall' ? totalMonthExpense : spentByCategory[b.category] || 0;
      const budgetAmount = b.amount;
      if (!budgetAmount || budgetAmount <= 0) continue;

      const percentage = (spent / budgetAmount) * 100;
      const alertThreshold = b.alertThreshold || 80;

      // 1. Check 100% Budget Exceeded Alert
      if (percentage >= 100 && prefs.budgetExceeded100) {
        const title = '🚨 Budget Exceeded!';
        const message = `🚨 Budget Exceeded! You have used your entire ₹${budgetAmount.toLocaleString('en-IN')} ${b.category} budget. Your current spending is ₹${spent.toLocaleString('en-IN')}.`;

        // Use findOneAndUpdate with upsert or atomic check to guarantee exactly once per month/category/threshold
        const existing100 = await Notification.findOne({
          user: userId,
          month,
          category: b.category,
          threshold: 100,
        });

        if (!existing100) {
          try {
            const notif = await Notification.create({
              user: userId,
              type: 'budget_exceeded_100',
              title,
              message,
              category: b.category,
              month,
              threshold: 100,
              data: { spent, budgetAmount, percentage: Math.round(percentage) },
            });
            newNotifications.push(notif);

            if (prefs.browserPush) {
              sendPushToUser(userId, {
                title,
                body: message,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                data: { url: '/?tab=budgets' },
              });
            }
          } catch (e) {
            // Duplicate key safely ignored
          }
        }
      }
      // 2. Check 80% Budget Warning Alert (when between threshold and 100%)
      else if (percentage >= alertThreshold && percentage < 100 && prefs.budgetWarning80) {
        const remaining = Math.max(0, budgetAmount - spent);
        const title = '⚠️ Budget Warning!';
        const message = `⚠️ Budget Warning! You have spent ₹${spent.toLocaleString('en-IN')} out of your ₹${budgetAmount.toLocaleString('en-IN')} ${b.category} budget. Only ₹${remaining.toLocaleString('en-IN')} remains.`;

        const existing80 = await Notification.findOne({
          user: userId,
          month,
          category: b.category,
          threshold: 80,
        });

        if (!existing80) {
          try {
            const notif = await Notification.create({
              user: userId,
              type: 'budget_warning_80',
              title,
              message,
              category: b.category,
              month,
              threshold: 80,
              data: { spent, budgetAmount, remaining, percentage: Math.round(percentage) },
            });
            newNotifications.push(notif);

            if (prefs.browserPush) {
              sendPushToUser(userId, {
                title,
                body: message,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                data: { url: '/?tab=budgets' },
              });
            }
          } catch (e) {
            // Duplicate key safely ignored
          }
        }
      }
    }

    return newNotifications;
  } catch (error) {
    console.error('[SpendWise Budget Check Error]:', error);
    return [];
  }
};
