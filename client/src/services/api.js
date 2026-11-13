const envApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const API_BASE = envApiUrl ? `${envApiUrl}/api` : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('spendwise_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({ message: 'Network response was not JSON' }));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  register: (userData) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(handleResponse),

  login: (credentials) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    }).then(handleResponse),

  updateProfile: (profileData) =>
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    }).then(handleResponse),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/transactions${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  addTransaction: (data) =>
    fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateTransaction: (id, data) =>
    fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteTransaction: (id) =>
    fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  getDashboardSummary: () =>
    fetch(`${API_BASE}/transactions/summary`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getAnalytics: () =>
    fetch(`${API_BASE}/transactions/analytics`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getSmartInsights: () =>
    fetch(`${API_BASE}/transactions/insights`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getExpenseCalendar: (month) =>
    fetch(`${API_BASE}/transactions/calendar${month ? `?month=${month}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  exportCSVUrl: () => `${API_BASE}/transactions/export/csv`,

  // Budgets
  getBudgets: (month) =>
    fetch(`${API_BASE}/budgets${month ? `?month=${month}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  saveBudget: (data) =>
    fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteBudget: (id) =>
    fetch(`${API_BASE}/budgets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  // Savings
  getSavingsGoals: () =>
    fetch(`${API_BASE}/savings`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createSavingsGoal: (data) =>
    fetch(`${API_BASE}/savings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateSavingsGoal: (id, data) =>
    fetch(`${API_BASE}/savings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  contributeToSavingsGoal: (id, data) =>
    fetch(`${API_BASE}/savings/${id}/contribute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteSavingsGoal: (id) =>
    fetch(`${API_BASE}/savings/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  // Recurring
  getRecurringExpenses: () =>
    fetch(`${API_BASE}/recurring`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createRecurringExpense: (data) =>
    fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateRecurringExpense: (id, data) =>
    fetch(`${API_BASE}/recurring/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteRecurringExpense: (id) =>
    fetch(`${API_BASE}/recurring/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  logRecurringExpense: (id) =>
    fetch(`${API_BASE}/recurring/${id}/log`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  // Notifications
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/notifications${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  markNotificationRead: (id) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    }).then(handleResponse),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getHeaders(),
    }).then(handleResponse),

  deleteNotification: (id) =>
    fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  getVapidKey: () =>
    fetch(`${API_BASE}/notifications/vapid-key`, {
      headers: getHeaders(),
    }).then(handleResponse),

  subscribePush: (subscription) =>
    fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subscription }),
    }).then(handleResponse),

  getNotificationPreferences: () =>
    fetch(`${API_BASE}/notifications/preferences`, {
      headers: getHeaders(),
    }).then(handleResponse),

  updateNotificationPreferences: (preferences) =>
    fetch(`${API_BASE}/notifications/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ preferences }),
    }).then(handleResponse),
};
