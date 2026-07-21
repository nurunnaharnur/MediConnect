import MedicineReminder from '../models/MedicineReminder.js';

// @desc    Create medicine reminder
// @route   POST /api/reminders
export const createReminder = async (req, res) => {
  const { name, dosage, time, frequency, endDate } = req.body;
  try {
    const reminder = await MedicineReminder.create({
      patientId: req.user._id,
      name,
      dosage,
      time,
      frequency,
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
    const reminders = await MedicineReminder.find({ patientId: req.user._id });
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
    await reminder.save();
    res.json({ message: `Reminder status updated to ${status}`, reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};