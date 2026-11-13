import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Gauge,
  Calendar,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, CATEGORY_COLORS } from '../utils/formatters';

export const SmartSpendingInsights = ({ onNavigateTab }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await api.getSmartInsights();
        if (res.success) {
          setInsights(res.data);
        }
      } catch (err) {
        console.error('Error fetching smart insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const {
    highestCategory,
    monthlyComparison,
    weeklySummary,
    unusualIncreases = [],
    potentialSavings,
    dailySpending,
  } = insights;

  const {
    suggestedDailyLimit = 0,
    actualDailySpending = 0,
    remainingMonthlyBudget = 0,
    isDailyLimitExceeded = false,
    dailyExceededAmount = 0,
    remainingDays = 1,
  } = dailySpending || {};

  return (
    <div className="space-y-4">
      {/* Daily Spending Recommendation Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDailyLimitExceeded
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-gradient-to-r from-brand-900/30 via-indigo-950/20 to-slate-900/40 border-brand-500/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDailyLimitExceeded
                  ? 'bg-rose-500/20 text-rose-500'
                  : 'bg-brand-500/20 text-brand-400'
              }`}
            >
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Daily Spending Recommendation
                </h4>
                {isDailyLimitExceeded && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    Limit Exceeded
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Suggested allowance: <strong className="text-brand-500 font-bold">{formatINR(suggestedDailyLimit)}/day</strong> based on {formatINR(remainingMonthlyBudget)} remaining for {remainingDays} day{remainingDays === 1 ? '' : 's'}.
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-4 self-end sm:self-auto text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Spent Today</span>
              <p
                className={`text-lg font-black ${
                  isDailyLimitExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatINR(actualDailySpending)}
              </p>
            </div>
          </div>
        </div>

        {isDailyLimitExceeded && (
          <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              You have exceeded today's suggested limit by {formatINR(dailyExceededAmount)}. Consider slowing down non-essential expenses for the rest of today!
            </span>
          </div>
        )}
      </div>

      {/* 3-Column Smart Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Highest Spending Category */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Top Expense Driver
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            {highestCategory ? (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[highestCategory.category] || '#6366f1' }}
                  />
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {highestCategory.category}
                  </h4>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatINR(highestCategory.amount)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Accounts for <strong>{highestCategory.percentage}%</strong> of all monthly expenses across {highestCategory.count} transaction{highestCategory.count === 1 ? '' : 's'}.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No expenses logged this month yet.</p>
            )}
          </div>
        </div>

        {/* 2. Monthly Comparison & Weekly Summary */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Monthly & Weekly Pace
              </span>
              {monthlyComparison.isHigher ? (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="space-y-2 mt-1">
              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">vs Last Month:</span>
                  <span
                    className={`font-bold ${
                      monthlyComparison.isHigher ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {monthlyComparison.percentageChange > 0 ? '+' : ''}
                    {monthlyComparison.percentageChange}% ({formatINR(Math.abs(monthlyComparison.difference))})
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">This Week:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatINR(weeklySummary.thisWeek)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>Prior Week:</span>
                  <span>{formatINR(weeklySummary.lastWeek)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Potential Savings Opportunities */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Savings Opportunity
              </span>
              <PiggyBank className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Discretionary spend (Shopping, Dining, Leisure):
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatINR(potentialSavings?.discretionaryTotal || 0)}
            </p>
            <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-300">
              <span className="font-bold">Pro Tip: </span>
              A 15% reduction in non-essentials could save you{' '}
              <strong>{formatINR(potentialSavings?.possibleSavings || 0)}</strong> this month!
            </div>
          </div>
        </div>
      </div>

      {/* Unusual Increases alert banner if detected */}
      {unusualIncreases.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <span className="font-bold">Unusual Expense Spikes: </span>
            {unusualIncreases.map((u, i) => (
              <span key={u.category}>
                <strong>{u.category}</strong> surged +{u.increasePct}% ({formatINR(u.current)} vs {formatINR(u.previous)} last month)
                {i < unusualIncreases.length - 1 ? '; ' : '.'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
