import mongoose from 'mongoose';

const MedicineReminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true }, 
  time: { type: String, required: true },   
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'custom'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'taken', 'skipped', 'snoozed'], 
    default: 'scheduled' 
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true } 
}, { timestamps: true });

export default mongoose.model('MedicineReminder', MedicineReminderSchema);