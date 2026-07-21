import express from 'express';
import {
  createReminder,
  getAllReminders,
  getReminderById,
  updateReminderStatus,
  deleteReminder,
  getNotificationLogs,
  triggerTestNotification,
  checkDueNotifications
} from '../controllers/reminderController.js';

const router = express.Router();

// Base path: /api/reminders
router.post('/', createReminder);
router.get('/', getAllReminders);

// Notification API sub-routes
router.get('/notifications/logs', getNotificationLogs);
router.post('/notifications/test', triggerTestNotification);
router.get('/notifications/check', checkDueNotifications);

router.get('/:id', getReminderById);
router.patch('/:id/status', updateReminderStatus);
router.delete('/:id', deleteReminder);

export default router;

