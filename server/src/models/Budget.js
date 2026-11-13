import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: String, // Format: 'YYYY-MM'
      required: [true, 'Month is required in YYYY-MM format'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [1, 'Budget amount must be at least ₹1'],
    },
    alertThreshold: {
      type: Number,
      default: 80, // Percentage warning threshold
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate budget for same user, month and category
budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
