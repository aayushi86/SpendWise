import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['budget_warning_80', 'budget_exceeded_100', 'bill_reminder', 'daily_limit_exceeded', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    month: {
      type: String, // Format: YYYY-MM
      trim: true,
      default: '',
    },
    threshold: {
      type: Number, // 80 or 100
      default: null,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index with unique constraint to guarantee duplicate prevention for user, month, category, and threshold
notificationSchema.index({ user: 1, month: 1, category: 1, threshold: 1 }, { unique: true });
notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
