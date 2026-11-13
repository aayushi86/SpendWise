import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Plus, Download, Menu, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = ({
  title,
  onOpenAddModal,
  onOpenMobileMenu,
  onNavigateTab,
  deferredPrompt,
  onInstallPwa,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {title}
          </h2>
          <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name || 'User'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button if browser supports */}
        {deferredPrompt && (
          <button
            onClick={onInstallPwa}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark/light theme"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notification Bell with Badge & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* Quick Add Transaction Button */}
        <button
          onClick={() => onOpenAddModal('expense')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
        </button>
      </div>
    </header>
  );
};
