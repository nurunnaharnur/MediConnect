import mongoose from 'mongoose';

// One self-reported symptom profile per patient. This holds symptoms that
// aren't part of the MenstrualCycle history (acne, hirsutism, etc.) so the
// PCOS screening rules in utils/pcosRules.js can combine both sources.
const PcosProfileSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    acne: { type: Boolean, default: false },
    excessHairGrowth: { type: Boolean, default: false },
    hairThinning: { type: Boolean, default: false },
    weightGain: { type: Boolean, default: false },
    skinDarkening: { type: Boolean, default: false },
    familyHistoryPCOS: { type: Boolean, default: false },
    notes: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('PcosProfile', PcosProfileSchema);