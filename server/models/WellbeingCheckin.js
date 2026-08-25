import mongoose from 'mongoose';

const SCREENING_TYPES = ['depression', 'anxiety', 'ocd'];
const INDICATION_LEVELS = ['minimal', 'mild', 'moderate', 'higher'];

const QuestionResponseSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  questionText: { type: String, required: true },
  answerValue: { type: Number, required: true, min: 0, max: 3 },
  answerLabel: { type: String, required: true }
}, { _id: false });

const WellbeingCheckinSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  screeningType: {
    type: String,
    enum: SCREENING_TYPES,
    required: true
  },
  responses: [QuestionResponseSchema],
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true
  },
  indicationLevel: {
    type: String,
    enum: INDICATION_LEVELS,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  recommendations: [{
    type: String
  }],
  hasSafetyAlert: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

export default mongoose.model('WellbeingCheckin', WellbeingCheckinSchema);
