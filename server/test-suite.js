import http from 'http';

const PORT = 5000;

function httpRequest(path, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET';
    const resolvedPath = path === '/' ? '/' : (path.startsWith('/api') ? path : `/api${path}`);
    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path: resolvedPath,
      method: method,
      headers: { ...(options.headers || {}) },
      timeout: 10000,
    };

    let dataStr = null;
    if (postData !== null || method === 'POST' || method === 'PUT') {
      dataStr = JSON.stringify(postData || {});
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(body); } catch (e) { json = { raw: body }; }
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: json });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out for ${path}`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (dataStr !== null) {
      req.write(dataStr);
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 SPENDWISE UPGRADED AUTOMATED VERIFICATION TEST SUITE 🚀');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 0. Root URL Check
  try {
    const rootRes = await httpRequest('/');
    assert(rootRes.ok && rootRes.data.status === 'online' && rootRes.data.message.includes('SpendWise'), '0. Backend Root URL GET / Check');
  } catch (e) {
    assert(false, '0. Backend Root URL GET / Check', e.message);
  }

  // 1. Health check
  try {
    const health = await httpRequest('/health');
    assert(health.ok && health.data.status === 'online', '1. API Health Check', JSON.stringify(health.data));
  } catch (e) {
    assert(false, '1. API Health Check', e.message);
  }

  // 2. User registration
  const testEmail = `upgrade_tester_${Date.now()}@spendwise.org`;
  let token = '';

  try {
    const regRes = await httpRequest('/auth/register', { method: 'POST' }, {
      name: 'Priya Sharma',
      email: testEmail,
      password: 'SpendWisePassword123!',
    });
    assert(regRes.ok && regRes.data.success && regRes.data.token, '2. User Registration & JWT generation');
    token = regRes.data.token;
  } catch (e) {
    assert(false, '2. User Registration', e.message);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 3. User Login
  try {
    const loginRes = await httpRequest('/auth/login', { method: 'POST' }, {
      email: testEmail,
      password: 'SpendWisePassword123!',
    });
    assert(loginRes.ok && loginRes.data.token, '3. User Login Authentication');
  } catch (e) {
    assert(false, '3. User Login Authentication', e.message);
  }

  // 4. Record Income
  try {
    const incRes = await httpRequest('/transactions', { method: 'POST', headers: authHeaders }, {
      type: 'income',
      amount: 100000,
      category: 'Salary',
      paymentMethod: 'Net Banking',
      description: 'Monthly Senior Engineer Salary',
    });
    assert(incRes.ok && incRes.data.data.amount === 100000, '4. Record Income (₹1,00,000 Salary via Net Banking)');
  } catch (e) {
    assert(false, '4. Record Income', e.message);
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 5. Create Monthly Category Budget for Testing Notifications
  try {
    // Set ₹5,000 budget for Food
    const bFood = await httpRequest('/budgets', { method: 'POST', headers: authHeaders }, {
      category: 'Food',
      amount: 5000,
      month: currentMonth,
      alertThreshold: 80,
    });
    assert(bFood.ok, '5. Set Monthly Category Budget (Food: ₹5,000, threshold: 80%)');
  } catch (e) {
    assert(false, '5. Set Monthly Category Budget', e.message);
  }

  // 6. Test 80% Budget Alert Trigger (Spend ₹4,000 on Food = 80%)
  try {
    const exp80 = await httpRequest('/transactions', { method: 'POST', headers: authHeaders }, {
      type: 'expense',
      amount: 4000,
      category: 'Food',
      paymentMethod: 'UPI',
      description: 'Weekly Grocery Stockup',
    });
    assert(exp80.ok, '6a. Record ₹4,000 Food Expense (reaching 80% of ₹5,000 budget)');

    // Wait 200ms for async budget check
    await new Promise((r) => setTimeout(r, 200));

    // Fetch notifications
    const notifs80 = await httpRequest('/notifications', { headers: authHeaders });
    const has80Alert = notifs80.data.data.some(
      (n) => n.threshold === 80 && n.category === 'Food' && n.message.includes('₹4,000 out of your ₹5,000')
    );
    assert(has80Alert, '6b. Verify 80% Budget Warning Notification Created in DB ("⚠️ Budget Warning! You have spent ₹4,000 out of your ₹5,000 Food budget. Only ₹1,000 remains.")');
  } catch (e) {
    assert(false, '6. 80% Budget Alert Trigger', e.message);
  }

  // 7. Test Duplicate Alert Prevention (Spend additional ₹200 on Food = ₹4,200 = 84%)
  try {
    await httpRequest('/transactions', { method: 'POST', headers: authHeaders }, {
      type: 'expense',
      amount: 200,
      category: 'Food',
      paymentMethod: 'Cash',
      description: 'Coffee & Snacks',
    });
    await new Promise((r) => setTimeout(r, 200));

    const notifsCheck = await httpRequest('/notifications', { headers: authHeaders });
    const count80 = notifsCheck.data.data.filter((n) => n.threshold === 80 && n.category === 'Food').length;
    assert(count80 === 1, '7. Duplicate Alert Prevention (Only 1 notification exists for 80% threshold this month)');
  } catch (e) {
    assert(false, '7. Duplicate Alert Prevention', e.message);
  }

  // 8. Test 100% Budget Exceeded Alert (Spend additional ₹1,000 on Food = Total ₹5,200 >= ₹5,000)
  try {
    const exp100 = await httpRequest('/transactions', { method: 'POST', headers: authHeaders }, {
      type: 'expense',
      amount: 1000,
      category: 'Food',
      paymentMethod: 'Credit Card',
      description: 'Family Dinner',
    });
    assert(exp100.ok, '8a. Record ₹1,000 Food Expense (spending reaches ₹5,200, exceeding ₹5,000 budget)');

    await new Promise((r) => setTimeout(r, 200));

    const notifs100 = await httpRequest('/notifications', { headers: authHeaders });
    const has100Alert = notifs100.data.data.some(
      (n) => n.threshold === 100 && n.category === 'Food' && n.message.includes('used your entire ₹5,000')
    );
    assert(has100Alert, '8b. Verify 100% Budget Exceeded Notification Created in DB ("🚨 Budget Exceeded! You have used your entire ₹5,000 Food budget. Your current spending is ₹5,200.")');
  } catch (e) {
    assert(false, '8. 100% Budget Exceeded Alert', e.message);
  }

  // 9. Test Notification Mark as Read & Mark All as Read
  try {
    const notifsRes = await httpRequest('/notifications', { headers: authHeaders });
    const firstId = notifsRes.data.data[0]._id;

    const readSingle = await httpRequest(`/notifications/${firstId}/read`, { method: 'PUT', headers: authHeaders });
    assert(readSingle.ok && readSingle.data.data.isRead === true, '9a. Mark single notification as read');

    const readAll = await httpRequest('/notifications/mark-all-read', { method: 'PUT', headers: authHeaders });
    assert(readAll.ok && readAll.data.unreadCount === 0, '9b. Mark all notifications as read (unreadCount: 0)');
  } catch (e) {
    assert(false, '9. Mark notifications as read', e.message);
  }

  // 10. Test Notification Preferences (VAPID key and preference toggling)
  try {
    const vapid = await httpRequest('/notifications/vapid-key', { headers: authHeaders });
    assert(vapid.ok && !!vapid.data.publicKey, '10a. Fetch VAPID Public Key for Web Push');

    const updatePrefs = await httpRequest('/notifications/preferences', { method: 'PUT', headers: authHeaders }, {
      preferences: { budgetWarning80: true, budgetExceeded100: true, billReminders: true },
    });
    assert(updatePrefs.ok && updatePrefs.data.preferences.budgetWarning80 === true, '10b. Update & verify notification preferences');
  } catch (e) {
    assert(false, '10. Notification preferences', e.message);
  }

  // 11. Test Smart Spending Insights & Daily Spending Limit API
  try {
    const insightsRes = await httpRequest('/transactions/insights', { headers: authHeaders });
    const ins = insightsRes.data.data;
    assert(
      insightsRes.ok &&
      ins.highestCategory &&
      ins.highestCategory.category === 'Food' &&
      ins.dailySpending &&
      typeof ins.dailySpending.suggestedDailyLimit === 'number' &&
      typeof ins.dailySpending.actualDailySpending === 'number',
      '11. Smart Spending Insights & Daily Spending Limit Calculations (Food is highest, daily limit computed from remaining budget)'
    );
  } catch (e) {
    assert(false, '11. Smart Spending Insights', e.message);
  }

  // 12. Test Expense Calendar API
  try {
    const calRes = await httpRequest(`/transactions/calendar?month=${currentMonth}`, { headers: authHeaders });
    assert(
      calRes.ok &&
      Array.isArray(calRes.data.days) &&
      calRes.data.days.length > 0 &&
      calRes.data.highestDayAmount > 0,
      '12. Expense Calendar API (Daily breakdown, transaction count, highest spend day)'
    );
  } catch (e) {
    assert(false, '12. Expense Calendar API', e.message);
  }

  // 13. Test Recurring Expenses & Upcoming Reminders with Duplicate Processing Guard
  try {
    const recCreate = await httpRequest('/recurring', { method: 'POST', headers: authHeaders }, {
      title: 'Fiber Internet Broadband',
      amount: 999,
      category: 'Bills',
      paymentMethod: 'UPI',
      frequency: 'Monthly',
      startDate: new Date().toISOString(),
    });
    assert(recCreate.ok, '13a. Create Recurring Bill');
    const recId = recCreate.data.data._id;

    // Check recurring list with status & reminders
    const recList = await httpRequest('/recurring', { headers: authHeaders });
    const billItem = recList.data.data.find((r) => r._id === recId);
    assert(billItem && typeof billItem.diffDays === 'number' && !!billItem.statusLabel, '13b. Upcoming Payment Reminders & Due Date Tracking');

    // First log
    const log1 = await httpRequest(`/recurring/${recId}/log`, { method: 'POST', headers: authHeaders });
    assert(log1.ok, '13c. Log Recurring Expense');

    // Immediate duplicate log attempt on same day must be prevented
    const log2 = await httpRequest(`/recurring/${recId}/log`, { method: 'POST', headers: authHeaders });
    assert(!log2.ok && log2.status === 400 && log2.data.message.includes('already been processed today'), '13d. Prevent Duplicate Recurring Processing Guard');
  } catch (e) {
    assert(false, '13. Recurring Expenses & Reminders', e.message);
  }

  // 14. Test Monthly Alert Reset for a Different Budget Month
  try {
    // Next month: '2026-12' (or +1 month)
    const nextMonth = `${now.getFullYear()}-${String((now.getMonth() + 2) % 12 || 12).padStart(2, '0')}`;
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);

    // Set budget for Food in next month
    await httpRequest('/budgets', { method: 'POST', headers: authHeaders }, {
      category: 'Food',
      amount: 5000,
      month: nextMonth,
      alertThreshold: 80,
    });

    // Add expense in next month of ₹4,100 (82% of ₹5,000)
    await httpRequest('/transactions', { method: 'POST', headers: authHeaders }, {
      type: 'expense',
      amount: 4100,
      category: 'Food',
      date: nextMonthDate.toISOString(),
      paymentMethod: 'UPI',
      description: 'Next Month Grocery',
    });

    await new Promise((r) => setTimeout(r, 200));

    const notifsNextMonth = await httpRequest('/notifications', { headers: authHeaders });
    const nextMonthAlert = notifsNextMonth.data.data.some(
      (n) => n.month === nextMonth && n.threshold === 80 && n.category === 'Food'
    );
    assert(nextMonthAlert, '14. Monthly Alert Eligibility Reset for New Budget Month (Fresh 80% alert triggered for next month)');
  } catch (e) {
    assert(false, '14. Monthly Alert Reset', e.message);
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
