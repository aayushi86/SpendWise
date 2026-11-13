import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Savings goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least ₹1'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    contributions: [contributionSchema],
  },
  {
    timestamps: true,
  }
);

savingsGoalSchema.index({ user: 1, isCompleted: 1 });

export default mongoose.model('SavingsGoal', savingsGoalSchema);
