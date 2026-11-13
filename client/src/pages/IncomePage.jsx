import React, { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  TrendingUp,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatIndianDate, INCOME_CATEGORIES, CATEGORY_COLORS } from '../utils/formatters';

export const IncomePage = ({ onOpenAddModal, onEditTransaction }) => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions({ type: 'income', limit: 100 });
      if (res.success) {
        setIncomes(res.data);
      }
    } catch (err) {
      console.error('Failed to load income:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      setDeletingId(id);
      await api.deleteTransaction(id);
      setIncomes((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalAllTimeIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  const currentMonthIncome = incomes
    .filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Source breakdown
  const sourceTotals = {};
  incomes.forEach((i) => {
    sourceTotals[i.category] = (sourceTotals[i.category] || 0) + i.amount;
  });

  return (
    <div className="px-4 md:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
            <span>Income Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track earnings, salaries, freelance & investments
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal('income')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            This Month's Inflow
          </span>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatINR(currentMonthIncome)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Current calendar month total
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            All-Time Total Inflow
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatINR(totalAllTimeIncome)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {incomes.length} recorded entries
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Top Income Stream
          </span>
          {Object.entries(sourceTotals).length > 0 ? (
            (() => {
              const [topCat, topAmt] = Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0];
              return (
                <div>
                  <h3 className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-2">
                    {topCat}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Generated {formatINR(topAmt)}
                  </p>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-slate-400 mt-3">No income logged yet</p>
          )}
        </div>
      </div>

      {/* Sources Pills */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Income Streams Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {INCOME_CATEGORIES.map((cat) => {
            const amount = sourceTotals[cat] || 0;
            const color = CATEGORY_COLORS[cat] || '#10b981';
            return (
              <div
                key={cat}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {cat}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {formatINR(amount)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inflow Ledger */}
      <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Incomes Received
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading income history...</div>
        ) : incomes.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
            <p>No income records yet. Add your salary or earnings!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Account / Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {incomes.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatIndianDate(inc.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {inc.category}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {inc.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {inc.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatINR(inc.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditTransaction(inc)}
                          className="p-1.5 text-slate-400 hover:text-brand-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inc._id)}
                          disabled={deletingId === inc._id}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
