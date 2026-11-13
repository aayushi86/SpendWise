import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  PieChart as PieIcon,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { formatINR, CATEGORY_COLORS } from '../utils/formatters';

const CHART_PALETTE = [
  '#6366f1', // brand indigo
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#eab308', // amber
  '#ef4444', // red
  '#3b82f6', // blue
];

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="px-4 md:px-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const {
    dailyChart = [],
    weeklyChart = [],
    categoryBreakdown = [],
    paymentBreakdown = [],
    monthlyComparison = [],
  } = analytics || {};

  return (
    <div className="px-4 md:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            <span>Financial Analytics & Insights</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive visualizations of spending habits, income vs expense, and trends
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              timeframe === 'daily'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              timeframe === 'weekly'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              timeframe === 'monthly'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Primary Trend Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {timeframe === 'daily'
                ? 'Daily Expense Outflow (Last 30 Days)'
                : timeframe === 'weekly'
                ? 'Weekly Expense Outflow (Last 8 Weeks)'
                : 'Monthly Income vs Expense (Last 12 Months)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pattern of expenditures calculated from live records
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {timeframe === 'daily' ? (
              <AreaChart data={dailyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="display" stroke="#64748b" fontSize={10} tickLine={false} interval={3} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), 'Expense']}
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
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dailyExpense)"
                />
              </AreaChart>
            ) : timeframe === 'weekly' ? (
              <BarChart data={weeklyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), 'Expense']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Payment Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Donut Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Category-wise Spending
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share of wallet per category
              </p>
            </div>
            <PieIcon className="w-5 h-5 text-slate-400" />
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-1">
              <div className="w-56 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.category] || CHART_PALETTE[index % CHART_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatINR(val), 'Spent']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend table */}
              <div className="flex-1 space-y-2 max-h-52 overflow-y-auto w-full">
                {categoryBreakdown.map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[item.category] || CHART_PALETTE[idx % CHART_PALETTE.length],
                        }}
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
              <span>No expense categorization data yet.</span>
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Payment Channel Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expenditure by payment mechanism
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>

          {paymentBreakdown.length > 0 ? (
            <div className="flex-1 space-y-3.5 flex flex-col justify-center">
              {paymentBreakdown.map((pm) => {
                const totalSpent = paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);
                const percent = totalSpent > 0 ? Math.round((pm.amount / totalSpent) * 100) : 0;
                return (
                  <div key={pm.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-brand-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {pm.method}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({pm.count} txns)
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatINR(pm.amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
              <span>No payment transactions logged yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
