import React from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  PlusCircle,
  PieChart,
  BarChart3,
  Menu,
} from 'lucide-react';

export const BottomNav = ({ activeTab, setActiveTab, onOpenAddModal, onOpenMobileMenu }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-850/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
          activeTab === 'dashboard'
            ? 'text-brand-600 dark:text-brand-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setActiveTab('expenses')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
          activeTab === 'expenses'
            ? 'text-brand-600 dark:text-brand-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <ArrowDownCircle className="w-5 h-5" />
        <span>Expenses</span>
      </button>

      {/* Floating Center Action Button */}
      <button
        onClick={onOpenAddModal}
        className="-mt-5 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white p-3 rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform active:scale-95"
        title="Add Expense"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <button
        onClick={() => setActiveTab('budgets')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
          activeTab === 'budgets'
            ? 'text-brand-600 dark:text-brand-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <PieChart className="w-5 h-5" />
        <span>Budgets</span>
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        <Menu className="w-5 h-5" />
        <span>More</span>
      </button>
    </div>
  );
};
