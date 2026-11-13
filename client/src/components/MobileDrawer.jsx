import React from 'react';
import {
  X,
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
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const MobileDrawer = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: ArrowDownCircle },
    { id: 'income', label: 'Income Management', icon: ArrowUpCircle },
    { id: 'budgets', label: 'Budgets & Limits', icon: PieChart },
    { id: 'calendar', label: 'Expense Calendar', icon: CalendarDays },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'recurring', label: 'Recurring & Bills', icon: Repeat },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-4/5 max-w-xs bg-white dark:bg-navy-850 h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-colors">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                ₹
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">SpendWise</h3>
                <p className="text-[10px] text-slate-400">Expense & Budget Tracker</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="mt-5 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
