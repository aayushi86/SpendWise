import React from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  BarChart3,
  CalendarDays,
  PiggyBank,
  Repeat,
  FileSpreadsheet,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: ArrowDownCircle },
  { id: 'income', label: 'Income', icon: ArrowUpCircle },
  { id: 'budgets', label: 'Budgets & Alerts', icon: PieChart },
  { id: 'calendar', label: 'Expense Calendar', icon: CalendarDays },
  { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
  { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
  { id: 'recurring', label: 'Recurring & Bills', icon: Repeat },
  { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-navy-850 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-200 dark:border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-500/20">
          ₹
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            SpendWise
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Smart Finance Tracker</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 dark:shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
