import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Bills',
  'Healthcare',
  'Entertainment',
  'Others',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Gift',
  'Others',
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
];

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      required: [true, 'Transaction type must be either expense or income'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'UPI',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringExpense',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by user and date
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
