import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  X,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatIndianDate, CATEGORY_COLORS, getMonthYearString } from '../utils/formatters';

export const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(getMonthYearString());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchCalendar = async (month) => {
    try {
      setLoading(true);
      const res = await api.getExpenseCalendar(month);
      if (res.success) {
        setCalendarData(res);
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentMonth);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    setCurrentMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    setCurrentMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDay(null);
  };

  // Build grid of days
  const [year, monthNum] = currentMonth.split('-').map(Number);
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const daysMap = {};
  if (calendarData?.days) {
    calendarData.days.forEach((d) => {
      daysMap[d.date] = d;
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const highestAmount = calendarData?.highestDayAmount || 0;

  return (
    <div className="px-4 md:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-500" />
            <span>Expense Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View daily spending frequency, highest outlay days, and drill-down transaction details
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 bg-white dark:bg-navy-850 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
            {monthNames[monthNum - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        {loading ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Loading monthly calendar data...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/40 dark:bg-slate-900/20 border border-transparent" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data = daysMap[dayStr];
              const isSelected = selectedDay?.date === dayStr;
              const hasSpend = data && data.totalAmount > 0;
              const isHighestDay = hasSpend && highestAmount > 0 && data.totalAmount === highestAmount;

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => setSelectedDay(data || { date: dayStr, totalAmount: 0, count: 0, transactions: [] })}
                  className={`h-20 sm:h-24 p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/30'
                      : isHighestDay
                      ? 'border-rose-400/80 dark:border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/20'
                      : hasSpend
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
                      : 'border-slate-100 dark:border-slate-800/40 bg-transparent opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {day}
                    </span>
                    {isHighestDay && (
                      <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded-full">
                        Peak
                      </span>
                    )}
                  </div>

                  {hasSpend ? (
                    <div>
                      <p className="text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400 truncate">
                        {formatINR(data.totalAmount)}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {data.count} txn{data.count === 1 ? '' : 's'}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 opacity-40">-</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Drill-down Modal / Panel */}
      {selectedDay && (
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Day Breakdown: {formatIndianDate(selectedDay.date)}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedDay.count} transaction{selectedDay.count === 1 ? '' : 's'} • Total Spent:{' '}
                <strong className="text-rose-500">{formatINR(selectedDay.totalAmount)}</strong>
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {selectedDay.transactions && selectedDay.transactions.length > 0 ? (
              selectedDay.transactions.map((tx) => {
                const catColor = CATEGORY_COLORS[tx.category] || '#6366f1';
                return (
                  <div
                    key={tx._id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {tx.category} • {tx.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      -{formatINR(tx.amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No expenses logged on this date.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
