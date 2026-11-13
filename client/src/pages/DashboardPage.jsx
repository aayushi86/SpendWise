import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Calendar,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { ReminderBanner } from '../components/ReminderBanner';
import { SmartSpendingInsights } from '../components/SmartSpendingInsights';
import { formatINR, formatIndianDate, CATEGORY_COLORS } from '../utils/formatters';

export const DashboardPage = ({
  summary,
  loading,
  onOpenAddModal,
  onViewAllTransactions,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    availableBalance = 0,
    totalSavings = 0,
    monthlySummary = {},
    monthlyChartData = [],
    recentTransactions = [],
    hasExpenseToday = false,
  } = summary || {};

  return (
    <div className="space-y-6">
      {/* Daily Expense Entry Reminder */}
      <ReminderBanner
        hasExpenseToday={hasExpenseToday}
        onOpenAddExpense={() => onOpenAddModal('expense')}
      />

      <div className="px-4 md:px-8 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available Balance"
            amount={formatINR(availableBalance)}
            subtitle="Net total funds available"
            icon={Wallet}
            color={availableBalance >= 0 ? 'brand' : 'rose'}
            trend={availableBalance >= 0 ? 'Active' : 'Deficit'}
          />
          <StatCard
            title="Total Income"
            amount={formatINR(totalIncome)}
            subtitle={`This month: ${formatINR(monthlySummary.income || 0)}`}
            icon={ArrowUpRight}
            color="emerald"
            trend="+ Inflow"
          />
          <StatCard
            title="Total Expenses"
            amount={formatINR(totalExpenses)}
            subtitle={`This month: ${formatINR(monthlySummary.expenses || 0)}`}
            icon={ArrowDownRight}
            color="rose"
            trend="- Outflow"
          />
          <StatCard
            title="Total Savings"
            amount={formatINR(totalSavings)}
            subtitle="Accumulated in savings goals"
            icon={PiggyBank}
            color="amber"
            trend="Targeted"
          />
        </div>

        {/* Monthly Summary Alert Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-brand-500" />
              <span>{monthlySummary.monthName || 'Current Month'} {monthlySummary.year} Performance</span>
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Net Surplus this month:{' '}
              <span
                className={
                  (monthlySummary.netSavings || 0) >= 0
                    ? 'text-emerald-500 font-extrabold'
                    : 'text-rose-500 font-extrabold'
                }
              >
                {formatINR(monthlySummary.netSavings || 0)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddModal('expense')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition"
            >
              + Add Expense
            </button>
            <button
              onClick={() => onOpenAddModal('income')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition"
            >
              + Add Income
            </button>
          </div>
        </div>

        {/* Smart Spending Insights & Daily Spending Limit */}
        <SmartSpendingInsights onNavigateTab={onViewAllTransactions} />

        {/* Charts and Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Area Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Monthly Financial Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Income vs Expenses over recent months
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400">Expense</span>
                </div>
              </div>
            </div>

            {monthlyChartData && monthlyChartData.length > 0 ? (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatINR(value), '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#incomeGrad)"
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#expenseGrad)"
                      name="Expense"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                <span>No transaction history yet. Add your first entry to see trends.</span>
              </div>
            )}
          </div>

          {/* Recent Transactions Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Recent Transactions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest activity records
                </p>
              </div>
              <button
                onClick={onViewAllTransactions}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[320px]">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  const catColor = CATEGORY_COLORS[tx.category] || '#64748b';
                  return (
                    <div
                      key={tx._id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between transition hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                          }}
                        >
                          {tx.category.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.description || tx.category}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{formatIndianDate(tx.date)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {tx.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-extrabold ${
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatINR(tx.amount)}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                  <CreditCard className="w-8 h-8 mb-2 opacity-50" />
                  <span>No transactions recorded yet.</span>
                  <button
                    onClick={() => onOpenAddModal('expense')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold text-xs"
                  >
                    Add First Expense
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
