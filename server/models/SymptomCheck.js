import mongoose from 'mongoose';

// One document per symptom-check session (FR-8: "log each symptom-check
// session to the patient's history for future reference").
const SymptomCheckSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one symptom must be selected.',
      },
    },
    condition: { type: String, required: true },
    specialist: { type: String, required: true },
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'Urgent'],
      required: true,
    },
    sensitive: { type: Boolean, default: false },
    matched: { type: Boolean, default: true }, // false when no rule matched (fallback case)
  },
  { timestamps: true }
);

export default mongoose.model('SymptomCheck', SymptomCheckSchema);
