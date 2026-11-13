import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getVapidKey,
  subscribePush,
  getPreferences,
  updatePreferences,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

router.get('/vapid-key', getVapidKey);
router.post('/subscribe', subscribePush);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
