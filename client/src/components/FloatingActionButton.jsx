import React from 'react';
import { Plus } from 'lucide-react';

export const FloatingActionButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-8 right-5 md:right-8 z-40 group p-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white shadow-xl shadow-brand-500/35 hover:shadow-brand-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
      title="Quick Add Expense"
      aria-label="Quick Add Expense"
    >
      <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
      <span className="hidden sm:inline font-bold text-xs pr-1">Quick Add</span>
    </button>
  );
};
