// Format currency with Indian numbering system (e.g., ₹1,50,000.00)
export const formatINR = (amount, decimals = 0) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount);
};

// Format date to Indian format (e.g., "12 Nov 2026" or "12/11/2026")
export const formatIndianDate = (dateString, withTime = false) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  if (withTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  return `${day} ${month} ${year}`;
};

export const getMonthYearString = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Bills',
  'Healthcare',
  'Entertainment',
  'Others',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Gift',
  'Others',
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
];

export const CATEGORY_COLORS = {
  Food: '#f97316',        // Orange
  Travel: '#06b6d4',      // Cyan
  Shopping: '#ec4899',    // Pink
  Education: '#8b5cf6',   // Purple
  Bills: '#eab308',       // Amber
  Healthcare: '#ef4444',  // Red
  Entertainment: '#6366f1', // Indigo
  Others: '#64748b',      // Slate
  Salary: '#10b981',      // Emerald
  Freelance: '#14b8a6',   // Teal
  Business: '#3b82f6',    // Blue
  Investments: '#8b5cf6', // Violet
  Gift: '#d946ef',        // Fuchsia
};
