import mongoose from 'mongoose';
import Transaction, { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../models/Transaction.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Budget from '../models/Budget.js';
import { checkBudgetThresholds } from '../services/notificationService.js';

// @desc    Get all transactions with filtering & search
// @route   GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const { type, category, paymentMethod, startDate, endDate, search, limit = 50, page = 1 } = req.query;

    const query = { user: req.user._id };

    if (type && ['expense', 'income'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
      currentPage: parseInt(page),
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching transactions',
    });
  }
};

// @desc    Add new transaction
// @route   POST /api/transactions
export const addTransaction = async (req, res) => {
  try {
    const { type, amount, category, date, paymentMethod, description } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type (expense/income), amount, and category',
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Validate categories
    if (type === 'expense' && !EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
      });
    }

    if (type === 'income' && !INCOME_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${INCOME_CATEGORIES.join(', ')}`,
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: parsedAmount,
      category,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'UPI',
      description: description ? description.trim() : '',
    });

    // Check category budget thresholds & trigger notifications if applicable
    if (type === 'expense') {
      checkBudgetThresholds(req.user._id, transaction.date).catch((err) =>
        console.error('Error checking budget alerts on add:', err)
      );
    }

    return res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} added successfully`,
      data: transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating transaction',
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, paymentMethod, description } = req.body;

    let transaction = await Transaction.findOne({ _id: id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
      }
      transaction.amount = parsedAmount;
    }

    if (type) {
      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be expense or income',
        });
      }
      transaction.type = type;
    }

    if (category) {
      const validCategories = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${validCategories.join(', ')}`,
        });
      }
      transaction.category = category;
    }

    if (date) {
      transaction.date = new Date(date);
    }

    if (paymentMethod) {
      transaction.paymentMethod = paymentMethod;
    }

    if (description !== undefined) {
      transaction.description = description.trim();
    }

    await transaction.save();

    // Recheck budget thresholds after transaction update
    checkBudgetThresholds(req.user._id, transaction.date).catch((err) =>
      console.error('Error checking budget alerts on update:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating transaction',
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    // Recheck budget thresholds after transaction delete
    if (transaction.type === 'expense') {
      checkBudgetThresholds(req.user._id, transaction.date).catch((err) =>
        console.error('Error recalculating budget alerts on delete:', err)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting transaction',
    });
  }
};

// @desc    Get dashboard summary calculated strictly from DB records
// @route   GET /api/transactions/summary
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Calculate all-time totals
    const totals = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;

    totals.forEach((item) => {
      if (item._id === 'income') totalIncome = item.totalAmount;
      if (item._id === 'expense') totalExpenses = item.totalAmount;
    });

    const availableBalance = totalIncome - totalExpenses;

    // Calculate total savings goals accumulated
    const savingsGoals = await SavingsGoal.find({ user: userId });
    const totalSavings = savingsGoals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0);

    // Current Month calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTotals = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let monthIncome = 0;
    let monthExpenses = 0;

    monthTotals.forEach((item) => {
      if (item._id === 'income') monthIncome = item.totalAmount;
      if (item._id === 'expense') monthExpenses = item.totalAmount;
    });

    // Recent 5 transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // Last 6 months trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly trend data for recharts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};

    // Initialize 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      trendMap[key] = { key, month: label, income: 0, expense: 0, savings: 0 };
    }

    monthlyTrend.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (trendMap[key]) {
        if (item._id.type === 'income') {
          trendMap[key].income = item.total;
        } else if (item._id.type === 'expense') {
          trendMap[key].expense = item.total;
        }
        trendMap[key].savings = Math.max(0, trendMap[key].income - trendMap[key].expense);
      }
    });

    const monthlyChartData = Object.values(trendMap);

    // Check if user has entered an expense today (for reminder notification)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hasExpenseToday = await Transaction.exists({
      user: userId,
      type: 'expense',
      date: { $gte: startOfToday },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        availableBalance,
        totalSavings,
        monthlySummary: {
          income: monthIncome,
          expenses: monthExpenses,
          netSavings: monthIncome - monthExpenses,
          monthName: monthNames[now.getMonth()],
          year: now.getFullYear(),
        },
        monthlyChartData,
        recentTransactions,
        hasExpenseToday: !!hasExpenseToday,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating dashboard summary',
    });
  }
};

// @desc    Get detailed analytics
// @route   GET /api/transactions/analytics
export const getAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();

    // 1. Daily expense analysis (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyData = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days in 30 days
    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const displayDay = `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
      dailyMap[dayStr] = { date: dayStr, display: displayDay, amount: 0 };
    }
    dailyData.forEach(item => {
      if (dailyMap[item._id]) {
        dailyMap[item._id].amount = item.total;
      }
    });
    const dailyChart = Object.values(dailyMap);

    // 2. Weekly expense analysis (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const weeklyData = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: eightWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$date' },
            week: { $isoWeek: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const weeklyChart = weeklyData.map(item => ({
      week: `W${item._id.week}`,
      year: item._id.year,
      amount: item.total,
    }));

    // 3. Category-wise expense breakdown (all-time & current month)
    const categoryExpenses = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const categoryBreakdown = categoryExpenses.map(cat => ({
      category: cat._id,
      amount: cat.total,
      count: cat.count,
    }));

    // 4. Payment method breakdown
    const paymentBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // 5. Monthly comparison (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyComparison = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const comparisonMap = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      comparisonMap[key] = { month: label, income: 0, expense: 0, net: 0 };
    }

    monthlyComparison.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (comparisonMap[key]) {
        if (item._id.type === 'income') {
          comparisonMap[key].income = item.total;
        } else if (item._id.type === 'expense') {
          comparisonMap[key].expense = item.total;
        }
        comparisonMap[key].net = comparisonMap[key].income - comparisonMap[key].expense;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        dailyChart,
        weeklyChart,
        categoryBreakdown,
        paymentBreakdown: paymentBreakdown.map(p => ({ method: p._id || 'UPI', amount: p.total, count: p.count })),
        monthlyComparison: Object.values(comparisonMap),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating analytics',
    });
  }
};

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export/csv
export const exportCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });

    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Amount (INR)', 'Payment Method', 'Description'];
    const rows = transactions.map((t) => [
      t._id.toString(),
      new Date(t.date).toLocaleDateString('en-IN'),
      t.type.toUpperCase(),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${(t.paymentMethod || 'UPI').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=SpendWise_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error exporting CSV',
    });
  }
};

// @desc    Get smart spending insights & daily spending limit
// @route   GET /api/transactions/insights
export const getSmartInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();
    const currentMonthStr = `${currentYear}-${String(currentMonthNum + 1).padStart(2, '0')}`;

    // Current month boundaries
    const startOfCurrentMonth = new Date(currentYear, currentMonthNum, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonthNum + 1, 0, 23, 59, 59, 999);

    // Last month boundaries
    const startOfLastMonth = new Date(currentYear, currentMonthNum - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonthNum, 0, 23, 59, 59, 999);

    // Days in current month & days remaining
    const daysInCurrentMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();
    const currentDay = now.getDate();
    const remainingDays = Math.max(1, daysInCurrentMonth - currentDay + 1);

    // This week (last 7 days) and prior week (day -14 to day -7)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Start of today
    const startOfToday = new Date(currentYear, currentMonthNum, currentDay);

    // Run parallel database queries
    const [
      currentMonthAgg,
      lastMonthAgg,
      thisWeekAgg,
      lastWeekAgg,
      todayAgg,
      budgets,
    ] = await Promise.all([
      // Current month expenses by category
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Last month expenses by category
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]),

      // This week expense total
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: sevenDaysAgo },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Last week expense total
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Today's expense total
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Current month budgets
      Budget.find({ user: userId, month: currentMonthStr }),
    ]);

    // Current month totals
    const currentMonthExpenses = currentMonthAgg.reduce((sum, item) => sum + item.total, 0);
    const lastMonthMap = {};
    let lastMonthExpenses = 0;
    lastMonthAgg.forEach((item) => {
      lastMonthMap[item._id] = item.total;
      lastMonthExpenses += item.total;
    });

    // 1. Highest Spending Category
    let highestCategory = null;
    if (currentMonthAgg.length > 0) {
      const top = currentMonthAgg[0];
      highestCategory = {
        category: top._id,
        amount: top.total,
        percentage: currentMonthExpenses > 0 ? Math.round((top.total / currentMonthExpenses) * 100) : 0,
        count: top.count,
      };
    }

    // 2. Monthly Comparison
    const monthlyDiff = currentMonthExpenses - lastMonthExpenses;
    const monthlyPercentageChange =
      lastMonthExpenses > 0
        ? Math.round((monthlyDiff / lastMonthExpenses) * 100)
        : currentMonthExpenses > 0
        ? 100
        : 0;

    const monthlyComparison = {
      currentMonth: currentMonthExpenses,
      lastMonth: lastMonthExpenses,
      difference: monthlyDiff,
      percentageChange: monthlyPercentageChange,
      isHigher: monthlyDiff > 0,
    };

    // 3. Weekly Summary
    const thisWeekTotal = thisWeekAgg[0]?.total || 0;
    const lastWeekTotal = lastWeekAgg[0]?.total || 0;
    const weeklyDiff = thisWeekTotal - lastWeekTotal;
    const weeklyPercentageChange =
      lastWeekTotal > 0
        ? Math.round((weeklyDiff / lastWeekTotal) * 100)
        : thisWeekTotal > 0
        ? 100
        : 0;

    const weeklySummary = {
      thisWeek: thisWeekTotal,
      lastWeek: lastWeekTotal,
      difference: weeklyDiff,
      percentageChange: weeklyPercentageChange,
    };

    // 4. Unusual Increases in Expenses (categories with >20% increase vs last month)
    const unusualIncreases = [];
    currentMonthAgg.forEach((curr) => {
      const prevAmount = lastMonthMap[curr._id] || 0;
      if (prevAmount > 0 && curr.total > prevAmount * 1.2) {
        const increasePct = Math.round(((curr.total - prevAmount) / prevAmount) * 100);
        unusualIncreases.push({
          category: curr._id,
          current: curr.total,
          previous: prevAmount,
          increasePct,
        });
      }
    });

    // 5. Potential Savings Opportunities (discretionary spending: Shopping, Entertainment, Food dining)
    const discretionaryCategories = ['Shopping', 'Entertainment', 'Food'];
    let discretionaryTotal = 0;
    currentMonthAgg.forEach((item) => {
      if (discretionaryCategories.includes(item._id)) {
        discretionaryTotal += item.total;
      }
    });

    const potentialSavings = {
      discretionaryTotal,
      percentageOfOutflow:
        currentMonthExpenses > 0 ? Math.round((discretionaryTotal / currentMonthExpenses) * 100) : 0,
      suggestedTarget: Math.round(discretionaryTotal * 0.85), // 15% reduction suggestion
      possibleSavings: Math.round(discretionaryTotal * 0.15),
    };

    // 6. Daily Spending Limit & Remaining Monthly Budget
    // Total budget calculation
    const overallBudget = budgets.find((b) => b.category === 'Overall');
    let totalMonthlyBudget = 0;
    if (overallBudget) {
      totalMonthlyBudget = overallBudget.amount;
    } else if (budgets.length > 0) {
      totalMonthlyBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
    }

    const remainingMonthlyBudget = Math.max(0, totalMonthlyBudget - currentMonthExpenses);
    const suggestedDailyLimit =
      remainingDays > 0 && remainingMonthlyBudget > 0
        ? Math.round(remainingMonthlyBudget / remainingDays)
        : 0;

    const actualDailySpending = todayAgg[0]?.total || 0;
    const isDailyLimitExceeded = suggestedDailyLimit > 0 && actualDailySpending > suggestedDailyLimit;
    const dailyExceededAmount = Math.max(0, actualDailySpending - suggestedDailyLimit);

    return res.status(200).json({
      success: true,
      data: {
        highestCategory,
        monthlyComparison,
        weeklySummary,
        unusualIncreases,
        potentialSavings,
        dailySpending: {
          totalMonthlyBudget,
          currentMonthExpenses,
          remainingMonthlyBudget,
          remainingDays,
          suggestedDailyLimit,
          actualDailySpending,
          isDailyLimitExceeded,
          dailyExceededAmount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error computing spending insights',
    });
  }
};

// @desc    Get expense calendar data for a given month
// @route   GET /api/transactions/calendar
export const getExpenseCalendar = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || currentMonthStr;

    const [year, m] = month.split('-').map(Number);
    const startOfMonth = new Date(year, m - 1, 1);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      user: userId,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 });

    // Group by day of month (YYYY-MM-DD)
    const daysMap = {};
    let highestDayAmount = 0;
    let highestDate = null;

    transactions.forEach((tx) => {
      const dayStr = tx.date.toISOString().split('T')[0];
      if (!daysMap[dayStr]) {
        daysMap[dayStr] = {
          date: dayStr,
          day: new Date(tx.date).getDate(),
          totalAmount: 0,
          count: 0,
          transactions: [],
        };
      }
      daysMap[dayStr].totalAmount += tx.amount;
      daysMap[dayStr].count += 1;
      daysMap[dayStr].transactions.push({
        _id: tx._id,
        category: tx.category,
        amount: tx.amount,
        description: tx.description,
        paymentMethod: tx.paymentMethod,
        date: tx.date,
      });

      if (daysMap[dayStr].totalAmount > highestDayAmount) {
        highestDayAmount = daysMap[dayStr].totalAmount;
        highestDate = dayStr;
      }
    });

    const days = Object.values(daysMap);

    return res.status(200).json({
      success: true,
      month,
      highestDayAmount,
      highestDate,
      days,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching expense calendar',
    });
  }
};
