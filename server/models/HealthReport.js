
import mongoose from 'mongoose';

const HealthReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: { type: String, required: true, trim: true },
  severity: {
    type: String,
    enum: ['Mild', 'Moderate', 'Severe'],
    default: 'Mild'
  },
  summary: { type: String, default: '' },
  vitalsSnapshot: {
    age: Number,
    gender: String,
    height: Number,
    weight: Number,
    medicalHistory: String
  },
  pdfFileName: { type: String, required: true },
  pdfPath: { type: String, required: true }, // relative path, e.g. uploads/reports/xxx.pdf
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('HealthReport', HealthReportSchema);