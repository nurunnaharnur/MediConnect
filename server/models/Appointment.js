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
    ref: 'User'
  },
  doctorName: {
    type: String,
    required: true,
    trim: true
  },
  doctorSpecialty: {
    type: String,
    default: 'General Practice',
    trim: true
  },
  department: {
    type: String,
    default: '',
    trim: true
  },
  patientName: {
    type: String,
    default: '',
    trim: true
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
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: ['in-person', 'video', 'consultation'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'Booked', 'Rescheduled', 'Cancelled', 'Completed'],
    default: 'scheduled'
  },
  clinicalNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Appointment', AppointmentSchema);
