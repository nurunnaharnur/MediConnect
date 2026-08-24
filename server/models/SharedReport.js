import mongoose from 'mongoose';

const SharedReportSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthReport', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional: lets a patient tag which appointment a share relates to.
    // Purely informational — does not affect authorization.
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    status: { type: String, enum: ['Shared', 'Viewed'], default: 'Shared' },
    sharedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Prevents the same report from being shared with the same doctor twice.
SharedReportSchema.index({ reportId: 1, doctorId: 1 }, { unique: true });

export default mongoose.model('SharedReport', SharedReportSchema);