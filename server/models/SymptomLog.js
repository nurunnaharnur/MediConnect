import mongoose from 'mongoose';

const SymptomLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: { type: String, required: true, trim: true },
  severity: {
    type: String,
    enum: ['Mild', 'Moderate', 'Severe'],
    default: 'Mild'
  },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthReport', default: null },
  loggedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('SymptomLog', SymptomLogSchema);