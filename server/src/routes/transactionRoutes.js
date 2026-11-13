import express from 'express';
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboardSummary,
  getAnalytics,
  exportCSV,
  getSmartInsights,
  getExpenseCalendar,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all transaction routes
router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/analytics', getAnalytics);
router.get('/insights', getSmartInsights);
router.get('/calendar', getExpenseCalendar);
router.get('/export/csv', exportCSV);

router.route('/')
  .get(getTransactions)
  .post(addTransaction);

router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;
