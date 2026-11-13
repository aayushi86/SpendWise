import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Check,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatIndianDate } from '../utils/formatters';

export const SavingsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency Fund');
  const [notes, setNotes] = useState('');
  const [goalModalError, setGoalModalError] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Contribution Modal
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [contribType, setContribType] = useState('deposit'); // 'deposit' | 'withdraw'
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [contribError, setContribError] = useState('');
  const [savingContrib, setSavingContrib] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.getSavingsGoals();
      if (res.success) {
        setGoals(res.data);
      }
    } catch (err) {
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setGoalModalError('');

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setGoalModalError('Please enter a valid target amount');
      return;
    }

    if (!targetDate) {
      setGoalModalError('Please choose a target date');
      return;
    }

    try {
      setSavingGoal(true);
      const res = await api.createSavingsGoal({
        title,
        targetAmount: target,
        initialAmount: parseFloat(initialAmount) || 0,
        targetDate,
        category,
        notes,
      });
      if (res.success) {
        setIsGoalModalOpen(false);
        setTitle('');
        setTargetAmount('');
        setInitialAmount('');
        setNotes('');
        fetchGoals();
      }
    } catch (err) {
      setGoalModalError(err.message || 'Failed to create goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setContribError('');

    const amount = parseFloat(contribAmount);
    if (isNaN(amount) || amount <= 0) {
      setContribError('Please enter a valid amount');
      return;
    }

    try {
      setSavingContrib(true);
      const res = await api.contributeToSavingsGoal(activeGoal._id, {
        amount,
        type: contribType,
        note: contribNote,
      });
      if (res.success) {
        setIsContributeModalOpen(false);
        setContribAmount('');
        setContribNote('');
        fetchGoals();
      }
    } catch (err) {
      setContribError(err.message || 'Failed to record contribution');
    } finally {
      setSavingContrib(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.deleteSavingsGoal(id);
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const totalSavedAllGoals = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTargetAllGoals = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);

  return (
    <div className="px-4 md:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-amber-500" />
            <span>Savings Goals</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set targets, save regularly, and track your financial milestones
          </p>
        </div>

        <button
          onClick={() => {
            setGoalModalError('');
            setIsGoalModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-brand-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Total Accumulated Savings
          </span>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatINR(totalSavedAllGoals)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Target across all active goals: {formatINR(totalTargetAllGoals)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalTargetAllGoals > 0
              ? Math.round((totalSavedAllGoals / totalTargetAllGoals) * 100)
              : 0}
            %
          </span>
          <p className="text-[11px] text-slate-400">Overall Target Achieved</p>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Loading savings goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 text-center">
          <PiggyBank className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No Savings Goals Set Yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create goals for vacations, emergency funds, gadgets, or vehicles and track your deposits.
          </p>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md transition"
          >
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isCompleted = g.isCompleted || g.currentAmount >= g.targetAmount;
            return (
              <div
                key={g._id}
                className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {g.category || 'Goal'}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                        {g.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteGoal(g._id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {g.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
                      "{g.notes}"
                    </p>
                  )}

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Saved</span>
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {formatINR(g.currentAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Target</span>
                      <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                        {formatINR(g.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, g.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold mb-4">
                    <span className={isCompleted ? 'text-emerald-500 font-bold' : 'text-slate-500'}>
                      {g.percentage}% reached
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {isCompleted ? 'Target achieved! 🎉' : `${formatINR(g.remainingAmount)} remaining`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {formatIndianDate(g.targetDate)}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveGoal(g);
                      setContribType('deposit');
                      setContribAmount('');
                      setContribNote('');
                      setContribError('');
                      setIsContributeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm transition"
                  >
                    Deposit / Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-navy-850 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                New Savings Goal
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-3.5">
              {goalModalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                  {goalModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Goa Trip, MacBook Pro, Emergency Fund"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Target (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Initial Deposit (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Target Completion Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Travel & Vacation">Travel & Vacation</option>
                  <option value="Gadgets & Electronics">Gadgets & Electronics</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Home & Real Estate">Home & Real Estate</option>
                  <option value="Education">Education</option>
                  <option value="General">General Savings</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Save ₹5,000 every month"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingGoal ? 'Saving...' : 'Create Goal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution / Withdrawal Modal */}
      {isContributeModalOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-navy-850 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {activeGoal.title}
              </h3>
              <button
                onClick={() => setIsContributeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="p-6 space-y-4">
              {contribError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                  {contribError}
                </div>
              )}

              {/* Deposit vs Withdraw tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setContribType('deposit')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    contribType === 'deposit'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + Add Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setContribType('withdraw')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    contribType === 'withdraw'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  - Withdraw
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Amount (₹) *
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
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Current balance in goal: {formatINR(activeGoal.currentAmount)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Note / Reason
                </label>
                <input
                  type="text"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  placeholder="e.g. Monthly salary transfer"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContrib}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingContrib ? 'Saving...' : 'Confirm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
