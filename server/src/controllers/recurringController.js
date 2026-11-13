import RecurringExpense from '../models/RecurringExpense.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { checkBudgetThresholds, sendPushToUser } from '../services/notificationService.js';
import User from '../models/User.js';

// Helper to calculate next due date based on frequency
const calculateNextDueDate = (currentDate, frequency) => {
  const d = new Date(currentDate);
  switch (frequency) {
    case 'Daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'Weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'Monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'Yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
};

// @desc    Get all recurring expenses with days remaining & upcoming reminders
// @route   GET /api/recurring
export const getRecurringExpenses = async (req, res) => {
  try {
    const list = await RecurringExpense.find({ user: req.user._id }).sort({ nextDueDate: 1 });
    const now = new Date();
    const user = await User.findById(req.user._id);
    const prefs = user?.notificationPrefs || { billReminders: true };

    const enrichedList = [];

    for (const item of list) {
      const nextDue = new Date(item.nextDueDate);
      // Calculate diff in days
      const diffTime = nextDue.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'upcoming';
      let statusLabel = `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;

      if (diffDays < 0) {
        status = 'overdue';
        statusLabel = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
      } else if (diffDays === 0) {
        status = 'due_today';
        statusLabel = 'Due today!';
      }

      // If due within 3 days and billReminders enabled, create notification if not already done today
      if (diffDays <= 3 && item.isActive && prefs.billReminders) {
        const todayStr = now.toISOString().split('T')[0];
        const existingReminder = await Notification.findOne({
          user: req.user._id,
          type: 'bill_reminder',
          'data.recurringId': item._id.toString(),
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        });

        if (!existingReminder) {
          const title = diffDays <= 0 ? `🚨 Bill Overdue: ${item.title}` : `📅 Bill Reminder: ${item.title}`;
          const message = `Payment of ₹${item.amount.toLocaleString('en-IN')} for ${item.title} (${item.category}) is ${statusLabel.toLowerCase()}.`;

          await Notification.create({
            user: req.user._id,
            type: 'bill_reminder',
            title,
            message,
            category: item.category,
            data: { recurringId: item._id.toString(), amount: item.amount, dueDate: item.nextDueDate },
          });

          if (prefs.browserPush) {
            sendPushToUser(req.user._id, {
              title,
              body: message,
              icon: '/favicon.svg',
              data: { url: '/?tab=recurring' },
            });
          }
        }
      }

      enrichedList.push({
        ...item.toObject(),
        diffDays,
        status,
        statusLabel,
      });
    }

    return res.status(200).json({
      success: true,
      data: enrichedList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching recurring expenses',
    });
  }
};

// @desc    Create recurring expense
// @route   POST /api/recurring
export const createRecurringExpense = async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, frequency, startDate } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, and category',
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const nextDueDate = calculateNextDueDate(start, frequency || 'Monthly');

    const recurring = await RecurringExpense.create({
      user: req.user._id,
      title: title.trim(),
      amount: parsedAmount,
      category,
      paymentMethod: paymentMethod || 'UPI',
      frequency: frequency || 'Monthly',
      startDate: start,
      nextDueDate,
    });

    return res.status(201).json({
      success: true,
      message: 'Recurring expense created successfully',
      data: recurring,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating recurring expense',
    });
  }
};

// @desc    Toggle or update recurring expense
// @route   PUT /api/recurring/:id
export const updateRecurringExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, paymentMethod, frequency, isActive, nextDueDate } = req.body;

    const recurring = await RecurringExpense.findOne({ _id: id, user: req.user._id });
    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring expense not found or unauthorized',
      });
    }

    if (title) recurring.title = title.trim();
    if (amount) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }
      recurring.amount = parsed;
    }
    if (category) recurring.category = category;
    if (paymentMethod) recurring.paymentMethod = paymentMethod;
    if (frequency) recurring.frequency = frequency;
    if (typeof isActive === 'boolean') recurring.isActive = isActive;
    if (nextDueDate) recurring.nextDueDate = new Date(nextDueDate);

    await recurring.save();

    return res.status(200).json({
      success: true,
      message: 'Recurring expense updated',
      data: recurring,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating recurring expense',
    });
  }
};

// @desc    Delete recurring expense
// @route   DELETE /api/recurring/:id
export const deleteRecurringExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const recurring = await RecurringExpense.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring expense not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Recurring expense deleted',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting recurring expense',
    });
  }
};

// @desc    Process a recurring expense (log transaction now and bump nextDueDate)
// @route   POST /api/recurring/:id/log
export const processRecurringExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const recurring = await RecurringExpense.findOne({ _id: id, user: req.user._id });
    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring expense not found',
      });
    }

    // Prevent duplicate processing on the same day
    const now = new Date();
    if (recurring.lastProcessedDate) {
      const last = new Date(recurring.lastProcessedDate);
      const isSameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

      if (isSameDay) {
        return res.status(400).json({
          success: false,
          message: `This recurring expense has already been processed today (${last.toLocaleDateString('en-IN')})`,
        });
      }
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'expense',
      amount: recurring.amount,
      category: recurring.category,
      paymentMethod: recurring.paymentMethod,
      description: `Recurring: ${recurring.title} (${recurring.frequency})`,
      date: new Date(),
      isRecurring: true,
      recurringId: recurring._id,
    });

    // Advance nextDueDate
    recurring.lastProcessedDate = new Date();
    recurring.nextDueDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);
    await recurring.save();

    // Check budget thresholds after recurring transaction is recorded
    checkBudgetThresholds(req.user._id, transaction.date).catch((err) =>
      console.error('Error checking budget on recurring log:', err)
    );

    return res.status(200).json({
      success: true,
      message: `Transaction recorded for ${recurring.title}. Next due date updated.`,
      data: {
        transaction,
        recurring,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing recurring expense',
    });
  }
};
