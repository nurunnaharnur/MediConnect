import MedicineReminder from '../models/MedicineReminder.js';
import { sendEmailNotification } from '../services/notificationService.js';
import jwt from 'jsonwebtoken';

// Helper to render responsive HTML confirmation page for email actions
function renderActionHtml({ success, title, medicineName, dosage, status, statusColor, statusBg, icon, time, message }) {
  const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173/reminders';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediConnect - ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F5F7F6;
      font-family: 'Inter', system-ui, sans-serif;
      color: #16241F;
    }
    .card {
      background: #ffffff;
      max-width: 440px;
      width: 90%;
      margin: 20px auto;
      border-radius: 20px;
      padding: 36px 28px;
      box-shadow: 0 12px 36px rgba(20, 99, 86, 0.08);
      text-align: center;
      border: 1px solid #E4EFEC;
      box-sizing: border-box;
    }
    .logo {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.3rem;
      color: #146356;
      margin-bottom: 20px;
      display: inline-block;
    }
    .icon-wrap {
      font-size: 3.2rem;
      margin-bottom: 12px;
      line-height: 1;
    }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.4rem;
      margin: 0 0 12px;
      color: #16241F;
    }
    .med-box {
      background: #F8FAFA;
      border: 1px solid #E7ECEA;
      border-radius: 12px;
      padding: 16px;
      margin: 18px 0;
      text-align: left;
    }
    .med-name {
      font-weight: 700;
      font-size: 1.1rem;
      color: #146356;
      margin: 0 0 4px;
    }
    .med-meta {
      font-size: 0.9rem;
      color: #5B6B65;
      margin: 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.82rem;
      margin-top: 10px;
      background: ${statusBg || '#E4EFEC'};
      color: ${statusColor || '#146356'};
    }
    .msg {
      font-size: 0.92rem;
      color: #5B6B65;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: #146356;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.92rem;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 999px;
      transition: background 0.15s ease;
    }
    .btn:hover {
      background: #0F4E44;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">💊 MediConnect</div>
    <div class="icon-wrap">${icon || (success ? '✅' : '⚠️')}</div>
    <h1>${title}</h1>
    ${medicineName ? `
      <div class="med-box">
        <p class="med-name">${medicineName}</p>
        <p class="med-meta">Dosage: ${dosage || 'Prescribed dose'} • Time: ${time}</p>
        <span class="badge">${icon} Status: ${status}</span>
      </div>
      <p class="msg">Your medication record has been updated successfully in MediConnect.</p>
    ` : `
      <p class="msg">${message}</p>
    `}
    <a href="${clientUrl}" class="btn">Open MediConnect Dashboard</a>
  </div>
</body>
</html>
  `;
}

// @desc    Handle 1-click status update from email action buttons
// @route   GET /api/reminders/email-action
export const handleEmailAction = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(renderActionHtml({
      success: false,
      title: 'Invalid Request',
      message: 'No action token was provided in this email link.',
      icon: '⚠️'
    }));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mediconnect-secret');
    const { reminderId, status, patientId } = decoded;

    if (!['taken', 'skipped', 'snoozed'].includes(status)) {
      return res.status(400).send(renderActionHtml({
        success: false,
        title: 'Invalid Action',
        message: 'The requested action is not recognized.',
        icon: '⚠️'
      }));
    }

    const query = { _id: reminderId };
    if (patientId) query.patientId = patientId;

    const reminder = await MedicineReminder.findOne(query);
    if (!reminder) {
      return res.status(404).send(renderActionHtml({
        success: false,
        title: 'Reminder Not Found',
        message: 'This medication reminder could not be found or may have been deleted.',
        icon: '🔍'
      }));
    }

    reminder.status = status;
    reminder.logs.push({ status, timestamp: new Date() });
    await reminder.save();

    const statusDisplay = {
      taken: { text: 'Taken', color: '#2F9E44', bg: '#E7F5EA', icon: '✅' },
      skipped: { text: 'Skipped', color: '#C4441C', bg: '#FBEBE4', icon: '⏭️' },
      snoozed: { text: 'Snoozed', color: '#A8791A', bg: '#FBF2DF', icon: '⏰' }
    }[status];

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    console.log(`[Email Action] 🎯 Reminder "${reminder.name}" marked as "${status}" via 1-click email link.`);

    return res.send(renderActionHtml({
      success: true,
      title: `Marked as ${statusDisplay.text}`,
      medicineName: reminder.name,
      dosage: reminder.dosage,
      status: statusDisplay.text,
      statusColor: statusDisplay.color,
      statusBg: statusDisplay.bg,
      icon: statusDisplay.icon,
      time: formattedTime,
    }));
  } catch (err) {
    console.error('[Email Action Error]:', err.message);
    return res.status(400).send(renderActionHtml({
      success: false,
      title: 'Link Expired or Invalid',
      message: 'This email action link is invalid or has expired. Please log in to your dashboard to update your medication schedule.',
      icon: '⏳'
    }));
  }
};

// @desc    Create medicine reminder
// @route   POST /api/reminders
export const createReminder = async (req, res) => {
  const { name, dosage, time, mealSegment, notes, emailNotification, frequency, endDate } = req.body;
  try {
    const reminder = await MedicineReminder.create({
      patientId: req.user._id,
      name,
      dosage,
      time,
      mealSegment: mealSegment || 'other',
      notes: notes || '',
      emailNotification: emailNotification ?? true,
      frequency: frequency || 'daily',
      endDate
    });
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's reminders
// @route   GET /api/reminders
export const getReminders = async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({ patientId: req.user._id }).sort({ time: 1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log reminder interaction status
// @route   PATCH /api/reminders/:id/status
export const updateReminderStatus = async (req, res) => {
  const { status } = req.body; 
  try {
    const reminder = await MedicineReminder.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder record not found' });

    reminder.status = status;
    reminder.logs.push({ status, timestamp: new Date() });

    await reminder.save();
    res.json({ message: `Reminder status updated to ${status}`, reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send test reminder email to user
// @route   POST /api/reminders/:id/test-email
export const sendTestReminderEmail = async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder record not found' });

    const result = await sendEmailNotification(req.user.email, reminder);
    if (!result.success) {
      return res.status(400).json({ message: `Failed to send email: ${result.reason || result.error || 'Unknown error'}` });
    }

    res.json({ message: `Test email sent successfully to ${req.user.email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};