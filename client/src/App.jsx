import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { TransactionModal } from './components/TransactionModal';
import { FloatingActionButton } from './components/FloatingActionButton';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { IncomePage } from './pages/IncomePage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SavingsPage } from './pages/SavingsPage';
import { RecurringPage } from './pages/RecurringPage';
import { ReportsPage } from './pages/ReportsPage';

import { api } from './services/api';

export function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultType, setDefaultType] = useState('expense');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const fetchSummary = async () => {
    if (!isAuthenticated) return;
    try {
      setSummaryLoading(true);
      const res = await api.getDashboardSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
    }
  }, [isAuthenticated]);

  // Open modal for new entry
  const handleOpenAddModal = (type = 'expense') => {
    setEditingTransaction(null);
    setDefaultType(type);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setDefaultType(tx.type);
    setIsModalOpen(true);
  };

  // Handle submit from modal
  const handleTransactionSubmit = async (formData) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction._id, formData);
    } else {
      await api.addTransaction(formData);
    }
    // Refresh dashboard summary and notifications
    fetchSummary();
    if (fetchNotifications) fetchNotifications();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/25 animate-pulse">
            ₹
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Loading SpendWise...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const tabTitles = {
    dashboard: 'Financial Overview',
    expenses: 'Expense Management',
    income: 'Income Management',
    budgets: 'Monthly Budgets & Alerts',
    calendar: 'Expense Calendar',
    analytics: 'Financial Analytics & Insights',
    savings: 'Savings Goals',
    recurring: 'Recurring Subscriptions',
    reports: 'Reports & Statements',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex transition-colors duration-200 relative">
      {/* Desktop Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Navbar with Notifications */}
        <Navbar
          title={tabTitles[activeTab] || 'SpendWise'}
          onOpenAddModal={handleOpenAddModal}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          onNavigateTab={setActiveTab}
          deferredPrompt={deferredPrompt}
          onInstallPwa={handleInstallPwa}
        />

        {/* Tab Content */}
        <main className="flex-1 py-6">
          {activeTab === 'dashboard' && (
            <DashboardPage
              summary={summary}
              loading={summaryLoading}
              onOpenAddModal={handleOpenAddModal}
              onViewAllTransactions={() => setActiveTab('expenses')}
              onRefresh={fetchSummary}
            />
          )}

          {activeTab === 'expenses' && (
            <TransactionsPage
              key="expenses-tab"
              initialType="expense"
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {activeTab === 'income' && (
            <IncomePage
              key="income-tab"
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {activeTab === 'budgets' && <BudgetsPage key="budgets-tab" />}

          {activeTab === 'calendar' && <CalendarPage key="calendar-tab" />}

          {activeTab === 'analytics' && <AnalyticsPage key="analytics-tab" />}

          {activeTab === 'savings' && <SavingsPage key="savings-tab" />}

          {activeTab === 'recurring' && (
            <RecurringPage key="recurring-tab" onRefreshSummary={fetchSummary} />
          )}

          {activeTab === 'reports' && <ReportsPage key="reports-tab" />}
        </main>
      </div>

      {/* Floating Action Button (FAB) for Quick Add Expense */}
      <FloatingActionButton onClick={() => handleOpenAddModal('expense')} />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal('expense')}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Add / Edit Transaction Modal with Receipt Scanning */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        initialData={editingTransaction}
        defaultType={defaultType}
      />
    </div>
  );
}

export default App;
