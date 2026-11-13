import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Play,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  formatIndianDate,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_COLORS,
} from '../utils/formatters';

export const RecurringPage = ({ onRefreshSummary }) => {
  const [recurringList, setRecurringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [frequency, setFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const res = await api.getRecurringExpenses();
      if (res.success) {
        setRecurringList(res.data);
      }
    } catch (err) {
      console.error('Error fetching recurring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    setModalError('');

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setModalError('Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      const res = await api.createRecurringExpense({
        title,
        amount: parsed,
        category,
        paymentMethod,
        frequency,
        startDate,
      });
      if (res.success) {
        setIsModalOpen(false);
        setTitle('');
        setAmount('');
        fetchRecurring();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create recurring expense');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessNow = async (id, itemTitle) => {
    try {
      setProcessingId(id);
      const res = await api.logRecurringExpense(id);
      if (res.success) {
        alert(`Successfully recorded expense for "${itemTitle}" and updated next due date!`);
        fetchRecurring();
        if (onRefreshSummary) onRefreshSummary();
      }
    } catch (err) {
      alert(err.message || 'Failed to process recurring expense');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring expense subscription?')) return;
    try {
      await api.deleteRecurringExpense(id);
      setRecurringList((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const monthlyCommittedExpense = recurringList
    .filter((r) => r.isActive)
    .reduce((sum, r) => {
      let multiplier = 1;
      if (r.frequency === 'Daily') multiplier = 30;
      if (r.frequency === 'Weekly') multiplier = 4.3;
      if (r.frequency === 'Yearly') multiplier = 1 / 12;
      return sum + r.amount * multiplier;
    }, 0);

  return (
    <div className="px-4 md:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-500" />
            <span>Recurring Expenses & Subscriptions</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automate tracking for rent, utilities, Netflix, SIPs, and memberships
          </p>
        </div>

        <button
          onClick={() => {
            setModalError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Recurring Item</span>
        </button>
      </div>

      {/* Committed Cost Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Estimated Monthly Recurring Commitments
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatINR(monthlyCommittedExpense)}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Based on {recurringList.filter((r) => r.isActive).length} active recurring subscriptions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-500/20">
          <Clock className="w-4 h-4" />
          <span>Next Due Dates Tracked Automatically</span>
        </div>
      </div>

      {/* Recurring Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Loading recurring expenses...
        </div>
      ) : recurringList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 text-center">
          <Repeat className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No Recurring Expenses Configured
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add recurring costs like Rent, WiFi bills, OTT subscriptions, or insurance premiums.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
          >
            Add First Recurring Expense
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recurringList.map((item) => {
            const nextDue = new Date(item.nextDueDate);
            const now = new Date();
            const isDueSoon = nextDue <= now;
            const catColor = CATEGORY_COLORS[item.category] || '#6366f1';

            return (
              <div
                key={item._id}
                className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.frequency}
                      </span>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                    {formatINR(item.amount)}
                  </p>

                  <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        Next Due:
                      </span>
                      <span
                        className={`font-bold ${
                          isDueSoon ? 'text-amber-500 animate-pulse' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatIndianDate(item.nextDueDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 opacity-60" />
                        Payment Mode:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {item.lastProcessedDate
                      ? `Last logged: ${formatIndianDate(item.lastProcessedDate)}`
                      : 'Never logged yet'}
                  </span>
                  <button
                    onClick={() => handleProcessNow(item._id, item.title)}
                    disabled={processingId === item._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{processingId === item._id ? 'Logging...' : 'Log Now'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to add recurring expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-navy-850 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                New Recurring Expense
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="p-6 space-y-3.5">
              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Subscription / Bill Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Netflix 4K, House Rent, Jio Fiber"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="649"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Add Recurring'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
