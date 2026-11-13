import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { checkBudgetThresholds } from '../services/notificationService.js';

// @desc    Get all budgets for a given month with spent calculation & warning flags
// @route   GET /api/budgets
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || currentMonthStr;

    // Fetch user budgets for the month
    const budgets = await Budget.find({ user: userId, month }).sort({ createdAt: -1 });

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

    const enrichedBudgets = budgets.map((b) => {
      const spent = b.category === 'Overall' ? totalMonthExpense : spentByCategory[b.category] || 0;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const remaining = Math.max(0, b.amount - spent);
      const isExceeded = spent > b.amount;
      const isNearLimit = percentage >= (b.alertThreshold || 80) && !isExceeded;

      return {
        _id: b._id,
        category: b.category,
        month: b.month,
        amount: b.amount,
        spent,
        remaining,
        percentage,
        alertThreshold: b.alertThreshold || 80,
        isNearLimit,
        isExceeded,
      };
    });

    return res.status(200).json({
      success: true,
      month,
      totalMonthExpense,
      data: enrichedBudgets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching budgets',
    });
  }
};

// @desc    Create or update a budget
// @route   POST /api/budgets
export const createOrUpdateBudget = async (req, res) => {
  try {
    const { category, amount, month, alertThreshold } = req.body;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category and budget amount',
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget amount must be a positive number',
      });
    }

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetMonth = month || currentMonthStr;

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        month: budgetMonth,
        category,
      },
      {
        user: req.user._id,
        month: budgetMonth,
        category,
        amount: parsedAmount,
        alertThreshold: alertThreshold ? Number(alertThreshold) : 80,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Evaluate budget thresholds immediately after saving budget
    const targetDate = new Date(`${budgetMonth}-01`);
    checkBudgetThresholds(req.user._id, targetDate).catch((err) =>
      console.error('Error evaluating budget alerts on budget save:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data: budget,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error saving budget',
    });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Budget removed successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting budget',
    });
  }
};
