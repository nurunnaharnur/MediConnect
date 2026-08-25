import mongoose from 'mongoose';

const MedicineReminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true }, 
  time: { type: String, required: true }, // "HH:MM"
  mealSegment: {
    type: String,
    enum: [
      'before_breakfast', 'after_breakfast',
      'before_lunch', 'after_lunch',
      'before_dinner', 'after_dinner',
      'bedtime', 'other'
    ],
    default: 'other'
  },
  notes: { type: String, default: '' },
  emailNotification: { type: Boolean, default: true },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'custom'], 
    default: 'daily' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'taken', 'skipped', 'snoozed', 'missed'], 
    default: 'scheduled' 
  },
  logs: [{
    status: { type: String, enum: ['taken', 'skipped', 'snoozed', 'missed'] },
    timestamp: { type: Date, default: Date.now }
  }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true } 
}, { timestamps: true });

export default mongoose.model('MedicineReminder', MedicineReminderSchema);