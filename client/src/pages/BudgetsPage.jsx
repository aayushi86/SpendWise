import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  EXPENSE_CATEGORIES,
  getMonthYearString,
} from '../utils/formatters';

export const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [totalMonthExpense, setTotalMonthExpense] = useState(0);
  const [month, setMonth] = useState(getMonthYearString());
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Overall');
  const [amount, setAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.getBudgets(month);
      if (res.success) {
        setBudgets(res.data);
        setTotalMonthExpense(res.totalMonthExpense || 0);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setModalError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError('Please enter a valid budget amount');
      return;
    }

    try {
      setSaving(true);
      const res = await api.saveBudget({
        month,
        category,
        amount: parsedAmount,
        alertThreshold: Number(alertThreshold) || 80,
      });
      if (res.success) {
        setIsModalOpen(false);
        setAmount('');
        fetchBudgets();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget target?')) return;
    try {
      await api.deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const availableCategories = ['Overall', ...EXPENSE_CATEGORIES];

  return (
    <div className="px-4 md:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-brand-500" />
            <span>Budget Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set spending limits and receive smart overrun warnings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-navy-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-brand-500" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setModalError('');
              setAmount('');
              setCategory('Overall');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Warning Banners if any budget exceeded or near limit */}
      {budgets.some((b) => b.isExceeded) && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs">
          <AlertOctagon className="w-5 h-5 shrink-0 animate-bounce" />
          <div>
            <span className="font-bold">Budget Exceeded Alert: </span>
            <span>
              You have exceeded your limit for{' '}
              {budgets
                .filter((b) => b.isExceeded)
                .map((b) => b.category)
                .join(', ')}
              . Review your recent transactions.
            </span>
          </div>
        </div>
      )}

      {budgets.some((b) => b.isNearLimit) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">Approaching Limit Warning: </span>
            <span>
              Spending has crossed 80% for{' '}
              {budgets
                .filter((b) => b.isNearLimit)
                .map((b) => b.category)
                .join(', ')}
              .
            </span>
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Loading budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 text-center">
          <PieChart className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No Budgets Defined for {month}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Set monthly targets for food, travel, bills or an overall total to monitor your utilization.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md transition"
          >
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isExceeded = b.isExceeded;
            const isNearLimit = b.isNearLimit;
            let statusColor = 'bg-brand-500';
            let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
            let statusText = 'On Track';

            if (isExceeded) {
              statusColor = 'bg-rose-500';
              badgeBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
              statusText = 'Exceeded 100%';
            } else if (isNearLimit) {
              statusColor = 'bg-amber-500';
              badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
              statusText = 'Warning (>80%)';
            }

            return (
              <div
                key={b._id}
                className={`p-5 rounded-2xl bg-white dark:bg-navy-850 border shadow-sm transition hover:shadow-md ${
                  isExceeded
                    ? 'border-rose-500/40 dark:border-rose-500/30 ring-1 ring-rose-500/20'
                    : isNearLimit
                    ? 'border-amber-500/40 dark:border-amber-500/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {b.category}
                    </h3>
                    <p className="text-[11px] text-slate-400">Month: {b.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                      {statusText}
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(b._id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount comparisons */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Spent</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatINR(b.spent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
                    <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                      {formatINR(b.amount)}
                    </p>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${statusColor}`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">
                    {b.percentage}% utilized
                  </span>
                  <span className={isExceeded ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                    {isExceeded
                      ? `Over by ${formatINR(b.spent - b.amount)}`
                      : `${formatINR(b.remaining)} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-navy-850 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Set Monthly Budget
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Budget Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Budget Limit (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Warning Alert Threshold: {alertThreshold}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Set Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
