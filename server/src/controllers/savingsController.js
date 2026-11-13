import SavingsGoal from '../models/SavingsGoal.js';

// @desc    Get all savings goals for current user
// @route   GET /api/savings
export const getSavingsGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ targetDate: 1 });

    const enrichedGoals = goals.map((goal) => {
      const percentage = goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
        : 0;
      const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

      return {
        ...goal.toObject(),
        percentage,
        remainingAmount,
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedGoals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching savings goals',
    });
  }
};

// @desc    Create a new savings goal
// @route   POST /api/savings
export const createSavingsGoal = async (req, res) => {
  try {
    const { title, targetAmount, targetDate, category, notes, initialAmount } = req.body;

    if (!title || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide goal title, target amount, and target date',
      });
    }

    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be a positive number',
      });
    }

    const initial = parseFloat(initialAmount) || 0;
    const contributions = [];
    if (initial > 0) {
      contributions.push({
        amount: initial,
        date: new Date(),
        note: 'Initial deposit',
      });
    }

    const goal = await SavingsGoal.create({
      user: req.user._id,
      title: title.trim(),
      targetAmount: parsedTarget,
      currentAmount: initial,
      targetDate: new Date(targetDate),
      category: category || 'General',
      notes: notes ? notes.trim() : '',
      isCompleted: initial >= parsedTarget,
      contributions,
    });

    return res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating savings goal',
    });
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings/:id
export const updateSavingsGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, targetAmount, targetDate, category, notes, isCompleted } = req.body;

    const goal = await SavingsGoal.findOne({ _id: id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized',
      });
    }

    if (title) goal.title = title.trim();
    if (targetAmount) {
      const parsed = parseFloat(targetAmount);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid target amount' });
      }
      goal.targetAmount = parsed;
    }
    if (targetDate) goal.targetDate = new Date(targetDate);
    if (category) goal.category = category.trim();
    if (notes !== undefined) goal.notes = notes.trim();
    if (typeof isCompleted === 'boolean') goal.isCompleted = isCompleted;

    goal.isCompleted = goal.currentAmount >= goal.targetAmount;

    await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Savings goal updated',
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating savings goal',
    });
  }
};

// @desc    Contribute or withdraw from savings goal
// @route   POST /api/savings/:id/contribute
export const contributeToGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note, type = 'deposit' } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    const goal = await SavingsGoal.findOne({ _id: id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized',
      });
    }

    if (type === 'withdraw' && goal.currentAmount < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds in goal. Available: ₹${goal.currentAmount}`,
      });
    }

    const change = type === 'withdraw' ? -parsedAmount : parsedAmount;
    goal.currentAmount = Math.max(0, goal.currentAmount + change);
    goal.contributions.push({
      amount: change,
      date: new Date(),
      note: note ? note.trim() : (type === 'withdraw' ? 'Withdrawal' : 'Deposit'),
    });

    goal.isCompleted = goal.currentAmount >= goal.targetAmount;

    await goal.save();

    return res.status(200).json({
      success: true,
      message: `${type === 'withdraw' ? 'Withdrawn from' : 'Added to'} savings goal successfully`,
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error recording contribution',
    });
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
export const deleteSavingsGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await SavingsGoal.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Savings goal deleted',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting savings goal',
    });
  }
};
