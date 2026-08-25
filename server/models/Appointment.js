import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialty: {
    type: String,
    default: 'General Practice'
  },
  patientName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, // "HH:MM"
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in-person', 'video', 'consultation'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  clinicalNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Appointment', AppointmentSchema);
