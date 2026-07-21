import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ReminderModel } from '../models/reminderModel.js';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTIFICATIONS_FILE = path.join(__dirname, '..', 'data', 'notifications.json');

function ensureDataFile() {
  const dir = path.dirname(NOTIFICATIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadNotifications() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

export function saveNotifications(notifications) {
  ensureDataFile();
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
}

export class NotificationService {
  static async getLogs(limit = 50) {
    if (db) {
      try {
        const logs = await db.collection('notifications')
          .find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();
        return logs;
      } catch (err) {
        console.error("MongoDB getLogs failed, falling back to files:", err);
      }
    }

    const logs = loadNotifications();
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  static async dispatchNotification(reminder, channel = 'push', isTest = false) {
    const now = new Date();
    let recipient = 'Browser User';
    let detail = '';

    if (channel === 'sms') {
      recipient = reminder.phoneNumber || '+1 (555) 019-2834';
      detail = `[Twilio Gateway] SMS sent to ${recipient}: "Reminder: Take ${reminder.medicineName} (${reminder.dosage}) now."`;
    } else if (channel === 'email') {
      recipient = reminder.email || 'patient@mediconnect.health';
      detail = `[SendGrid Service] Email dispatched to ${recipient}: Subject "MediConnect Reminder: ${reminder.medicineName}"`;
    } else {
      channel = 'push';
      recipient = 'Web Browser Client';
      detail = `[Web Push API] Desktop Alert: "Time to take ${reminder.medicineName} - ${reminder.dosage}"`;
    }

    const notificationRecord = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      reminderId: reminder.id || 'test_id',
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      channel,
      recipient,
      message: `Time to take ${reminder.medicineName} (${reminder.dosage})`,
      detail,
      timestamp: now.toISOString(),
      status: 'delivered',
      isTest
    };

    console.log(`🔔 AUTOMATED NOTIFICATION DELIVERED [${channel.toUpperCase()}]:`, detail);

    if (db) {
      try {
        await db.collection('notifications').insertOne(notificationRecord);
        return notificationRecord;
      } catch (err) {
        console.error("MongoDB insert notification failed, falling back to file:", err);
      }
    }

    const logs = loadNotifications();
    logs.push(notificationRecord);
    saveNotifications(logs);

    return notificationRecord;
  }

  static async checkDueReminders() {
    const reminders = await ReminderModel.getAll();
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[now.getDay()];

    const newlyTriggered = [];

    for (const r of reminders) {
      if (r.status === 'taken' || r.status === 'skipped' || r.status === 'expired' || r.isExpired) continue;

      let isDue = false;

      // Check custom days filter if frequency === 'Custom'
      if (r.frequency === 'Custom' && Array.isArray(r.customDays) && r.customDays.length > 0) {
        if (!r.customDays.includes(currentDayName)) {
          continue;
        }
      }

      // Check snoozed time
      if (r.status === 'snoozed' && r.snoozedUntil) {
        const snoozeDate = new Date(r.snoozedUntil);
        if (now >= snoozeDate) {
          isDue = true;
        }
      } 
      // Check normal scheduled time or secondTime slot (for Twice Daily)
      else if (r.time === currentHHMM || (r.frequency === 'Twice Daily' && r.secondTime === currentHHMM)) {
        // Prevent duplicate notifications within the same minute
        const lastNotifiedMinute = r.lastNotifiedAt ? r.lastNotifiedAt.substring(0, 16) : '';
        const currentMinuteISO = now.toISOString().substring(0, 16);
        if (lastNotifiedMinute !== currentMinuteISO) {
          isDue = true;
        }
      }

      if (isDue) {
        const channels = (r.channels && r.channels.length > 0) ? r.channels : ['push'];
        for (const ch of channels) {
          const notif = await NotificationService.dispatchNotification(r, ch, false);
          newlyTriggered.push(notif);
        }

        // Update reminder lastNotifiedAt and reset snoozed status
        await ReminderModel.updateNotificationTime(r.id, now.toISOString());
      }
    }

    return newlyTriggered;
  }

  static startScheduler(intervalMs = 15000) {
    console.log('⏰ MediConnect Notification Engine Scheduler Started (Interval: 15s)');
    
    // Initial async run
    (async () => {
      try {
        await NotificationService.checkDueReminders();
      } catch (e) {
        console.error('Error in initial notification check:', e);
      }
    })();

    setInterval(async () => {
      try {
        await NotificationService.checkDueReminders();
      } catch (e) {
        console.error('Error in scheduled notification check:', e);
      }
    }, intervalMs);
  }
}
