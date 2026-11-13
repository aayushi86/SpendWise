import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  CheckCheck,
  Trash2,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatIndianDate } from '../utils/formatters';

export const NotificationDropdown = ({ isOpen, onClose, onNavigateTab }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
    requestPushPermission,
  } = useNotifications();

  const [activeView, setActiveView] = useState('list'); // 'list' | 'settings'
  const [savingPrefs, setSavingPrefs] = useState(false);

  if (!isOpen) return null;

  const handleTogglePref = async (key) => {
    try {
      setSavingPrefs(true);
      await updatePreferences({ [key]: !preferences[key] });
    } finally {
      setSavingPrefs(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'budget_exceeded_100':
        return <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'budget_warning_80':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'bill_reminder':
        return <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-brand-500 shrink-0" />;
    }
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-navy-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            {activeView === 'settings' ? 'Notification Preferences' : 'Notifications'}
          </h4>
          {activeView === 'list' && unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView((v) => (v === 'list' ? 'settings' : 'list'))}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeView === 'settings' ? 'text-brand-500 bg-brand-50 dark:bg-brand-950/40' : ''
            }`}
            title={activeView === 'settings' ? 'Back to notifications' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeView === 'settings' ? (
        /* Settings View */
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Browser Push Alerts</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive alerts even when tab is backgrounded</p>
            </div>
            <button
              onClick={requestPushPermission}
              className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-500 transition shadow-sm"
            >
              Enable Push
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { key: 'budgetWarning80', label: '80% Category Budget Warning', desc: 'Alert when category spending hits 80%' },
              { key: 'budgetExceeded100', label: '100% Budget Exceeded Alert', desc: 'Alert when category spending reaches 100%' },
              { key: 'billReminders', label: 'Upcoming Bill Reminders', desc: 'Reminders 3 days before recurring bills are due' },
              { key: 'dailyLimitAlerts', label: 'Daily Spending Limit Warning', desc: 'Alert when exceeding daily suggested allowance' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-start justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
              >
                <div className="pr-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!preferences[item.key]}
                  onChange={() => handleTogglePref(item.key)}
                  disabled={savingPrefs}
                  className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        /* Notifications List View */
        <div className="flex flex-col max-h-[380px]">
          {/* Subheader action */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60 text-[11px]">
              <span className="text-slate-500">{notifications.length} alerts recorded</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-brand-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-1">No budget warnings or payment alerts right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    !n.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5">{getIconForType(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatIndianDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px]">
                      {n.category && (
                        <button
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab('budgets');
                            onClose();
                          }}
                          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>View Budget</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n._id)}
                        className="text-slate-400 hover:text-rose-500 ml-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
