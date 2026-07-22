import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'reminders.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadReminders() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

export function saveReminders(reminders) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2), 'utf-8');
}

export function calculateEndDate(startDateStr, durationDays) {
  const start = new Date(startDateStr);
  const end = new Date(start);
  end.setDate(end.getDate() + parseInt(durationDays, 10));
  return end.toISOString().split('T')[0];
}

export function enrichCourseProgress(reminder) {
  // Feature 16: Recurring & auto-expiring medicine schedules (tracks days passed, total duration, and checks if expired)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(reminder.startDate || today);
  start.setHours(0, 0, 0, 0);

  const end = new Date(reminder.endDate || calculateEndDate(reminder.startDate, reminder.durationDays || 7));
  end.setHours(23, 59, 59, 999);

  const durationDays = parseInt(reminder.durationDays, 10) || 7;
  const diffTime = today - start;
  const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const isExpired = today > end || daysPassed > durationDays;
  const daysRemaining = isExpired ? 0 : Math.max(0, durationDays - daysPassed + 1);
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / durationDays) * 100)));

  const computedStatus = isExpired && reminder.status !== 'taken' ? 'expired' : reminder.status;

  return {
    ...reminder,
    endDate: reminder.endDate || calculateEndDate(reminder.startDate, durationDays),
    status: computedStatus,
    daysPassed,
    daysTotal: durationDays,
    daysRemaining,
    progressPercent,
    isExpired
  };
}

export class ReminderModel {
  static async getAll() {
    if (db) {
      try {
        let raw = await db.collection('reminders').find({}).toArray();
        if (raw.length === 0) {
          const localReminders = loadReminders();
          if (localReminders.length > 0) {
            console.log(`Migrating ${localReminders.length} local reminders to MongoDB...`);
            await db.collection('reminders').insertMany(localReminders);
            raw = await db.collection('reminders').find({}).toArray();
          }
        }
        const enriched = [];
        for (const r of raw) {
          const item = enrichCourseProgress(r);
          if (item.status !== r.status) {
            await db.collection('reminders').updateOne({ id: r.id }, { $set: { status: item.status } });
          }
          enriched.push(item);
        }
        return enriched;
      } catch (err) {
        console.warn("⚠️ MongoDB is read-only or connection failed. Gracefully falling back to local files database.");
      }
    }

    // Local JSON Fallback
    const raw = loadReminders();
    let updated = false;
    const enriched = raw.map(r => {
      const item = enrichCourseProgress(r);
      if (item.status !== r.status) {
        r.status = item.status;
        updated = true;
      }
      return item;
    });

    if (updated) {
      saveReminders(raw);
    }
    return enriched;
  }

  static async getById(id) {
    if (db) {
      try {
        const reminder = await db.collection('reminders').findOne({ id });
        return reminder ? enrichCourseProgress(reminder) : null;
      } catch (err) {
        console.error("MongoDB getById failed, falling back:", err);
      }
    }
    const reminders = await ReminderModel.getAll();
    return reminders.find(r => r.id === id);
  }

  static async create(data) {
    // Feature 13: Medicine reminder creation (dosage, time, frequency)
    // Feature 16: Recurring & auto-expiring medicine schedules (calculates end dates)
    const startDate = data.startDate || new Date().toISOString().split('T')[0];
    const durationDays = parseInt(data.durationDays, 10) || 7;
    const endDate = calculateEndDate(startDate, durationDays);

    const newReminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      medicineName: data.medicineName,
      dosage: data.dosage,
      time: data.time,
      secondTime: data.secondTime || '',
      frequency: data.frequency || 'Daily',
      customDays: Array.isArray(data.customDays) ? data.customDays : [],
      startDate,
      durationDays,
      endDate,
      channels: Array.isArray(data.channels) && data.channels.length > 0 ? data.channels : ['push'],
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      status: 'pending',
      lastNotifiedAt: null,
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('reminders').insertOne(newReminder);
        return enrichCourseProgress(newReminder);
      } catch (err) {
        console.error("MongoDB insert failed, falling back to JSON:", err);
      }
    }

    const reminders = loadReminders();
    reminders.push(newReminder);
    saveReminders(reminders);
    return enrichCourseProgress(newReminder);
  }

  static async updateStatus(id, newStatus, snoozeMinutes = 15) {
    // Feature 15: Mark reminder as taken / skipped / snoozed
    let snoozeTime = null;
    if (newStatus === 'snoozed') {
      snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
    }

    if (db) {
      try {
        const updateDoc = {
          $set: { status: newStatus, updatedAt: new Date().toISOString() }
        };
        if (snoozeTime) {
          updateDoc.$set.snoozedUntil = snoozeTime;
        } else {
          updateDoc.$unset = { snoozedUntil: "" };
        }

        await db.collection('reminders').updateOne({ id }, updateDoc);
        return await ReminderModel.getById(id);
      } catch (err) {
        console.error("MongoDB updateStatus failed, falling back:", err);
      }
    }

    const reminders = loadReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;

    reminders[index].status = newStatus;
    if (newStatus === 'snoozed') {
      reminders[index].snoozedUntil = snoozeTime;
    } else {
      delete reminders[index].snoozedUntil;
    }
    reminders[index].updatedAt = new Date().toISOString();

    saveReminders(reminders);
    return enrichCourseProgress(reminders[index]);
  }

  static async updateNotificationTime(id, isoTimestamp) {
    if (db) {
      try {
        const updateDoc = {
          $set: { lastNotifiedAt: isoTimestamp, updatedAt: isoTimestamp }
        };
        const reminder = await db.collection('reminders').findOne({ id });
        if (reminder && reminder.status === 'snoozed') {
          updateDoc.$set.status = 'pending';
          updateDoc.$unset = { snoozedUntil: "" };
        }
        await db.collection('reminders').updateOne({ id }, updateDoc);
        return await ReminderModel.getById(id);
      } catch (err) {
        console.error("MongoDB updateNotificationTime failed, falling back:", err);
      }
    }

    const reminders = loadReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;

    reminders[index].lastNotifiedAt = isoTimestamp;
    if (reminders[index].status === 'snoozed') {
      reminders[index].status = 'pending';
      delete reminders[index].snoozedUntil;
    }
    reminders[index].updatedAt = isoTimestamp;

    saveReminders(reminders);
    return enrichCourseProgress(reminders[index]);
  }

  static async delete(id) {
    if (db) {
      try {
        const res = await db.collection('reminders').deleteOne({ id });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB delete failed, falling back:", err);
      }
    }

    const reminders = loadReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return false;

    reminders.splice(index, 1);
    saveReminders(reminders);
    return true;
  }
}
