import mongoose from 'mongoose';

const DailyLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  flow: {
    type: String,
    enum: ['none', 'spotting', 'light', 'medium', 'heavy'],
    default: 'none'
  },
  symptoms: [{
    type: String,
    enum: [
      'Cramps',
      'Bloating',
      'Fatigue',
      'Mood Swings',
      'Headache',
      'Backache',
      'Tender Breasts',
      'Acne',
      'Cravings',
      'Insomnia'
    ]
  }],
  note: { type: String, default: '', maxlength: 500 }
}, { _id: true, timestamps: true });

const CycleEntrySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  lastPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  cycleLength: {
    type: Number,
    required: true,
    default: 28,
    min: 20,
    max: 45
  },
  periodDuration: {
    type: Number,
    required: true,
    default: 5,
    min: 2,
    max: 10
  },
  dailyLogs: [DailyLogSchema]
}, { timestamps: true });

export default mongoose.model('CycleEntry', CycleEntrySchema);
