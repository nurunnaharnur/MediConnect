import mongoose from 'mongoose';

const FLOW_LEVELS = ['Spotting', 'Light', 'Medium', 'Heavy'];

const DailyFlowSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    flowLevel: { type: String, enum: FLOW_LEVELS, required: true },
    notes: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const MenstrualCycleSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    periodStartDate: { type: Date, required: true },
    periodEndDate: { type: Date, default: null },
    flowLevel: { type: String, enum: FLOW_LEVELS, default: 'Medium' },
    dailyFlow: { type: [DailyFlowSchema], default: [] },
    symptoms: { type: [String], default: [] },
    notes: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

MenstrualCycleSchema.index({ patientId: 1, periodStartDate: -1 });

export const CYCLE_FLOW_LEVELS = FLOW_LEVELS;
export default mongoose.model('MenstrualCycle', MenstrualCycleSchema);