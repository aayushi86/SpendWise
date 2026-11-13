import mongoose from 'mongoose';

const recurringExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'UPI',
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      default: 'Monthly',
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextDueDate: {
      type: Date,
      required: true,
    },
    lastProcessedDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

recurringExpenseSchema.index({ user: 1, isActive: 1, nextDueDate: 1 });

export default mongoose.model('RecurringExpense', recurringExpenseSchema);
