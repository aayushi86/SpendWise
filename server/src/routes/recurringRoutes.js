import express from 'express';
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  processRecurringExpense,
} from '../controllers/recurringController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecurringExpenses)
  .post(createRecurringExpense);

router.route('/:id')
  .put(updateRecurringExpense)
  .delete(deleteRecurringExpense);

router.post('/:id/log', processRecurringExpense);

export default router;
