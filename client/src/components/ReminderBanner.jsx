import React, { useState } from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';

export const ReminderBanner = ({ hasExpenseToday, onOpenAddExpense }) => {
  const [dismissed, setDismissed] = useState(false);

  if (hasExpenseToday || dismissed) return null;

  return (
    <div className="mx-4 md:mx-8 mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-900/40 via-violet-900/30 to-slate-900/40 border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-brand-950/20">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Daily Expense Reminder</h4>
          <p className="text-xs text-slate-300">
            You haven't logged any expenses for today yet. Stay on track with your budget!
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={() => onOpenAddExpense('expense')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm"
        >
          <span>Log Expense</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
