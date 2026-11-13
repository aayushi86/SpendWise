import React from 'react';

export const StatCard = ({ title, amount, subtitle, icon: Icon, color, trend }) => {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      badge: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      badge: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
    },
    brand: {
      bg: 'bg-brand-500/10 dark:bg-brand-500/10',
      text: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-500/20',
      badge: 'bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
      badge: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    },
  };

  const currentStyle = colorStyles[color] || colorStyles.brand;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${currentStyle.bg} ${currentStyle.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {amount}
        </h3>
        {trend && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${currentStyle.badge}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
