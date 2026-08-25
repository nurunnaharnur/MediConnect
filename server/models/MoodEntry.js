import mongoose from 'mongoose';

const MOOD_TYPES = [
  'very_happy',
  'happy',
  'calm',
  'neutral',
  'stressed',
  'anxious',
  'sad',
  'very_sad',
  'angry'
];

const EMOTION_TAGS = [
  'Stress',
  'Anxiety',
  'Loneliness',
  'Anger',
  'Sadness',
  'Happiness',
  'Motivation',
  'Calmness'
];

const MoodEntrySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mood: {
    type: String,
    enum: MOOD_TYPES,
    required: true
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  emotions: [{
    type: String,
    enum: EMOTION_TAGS
  }],
  note: {
    type: String,
    default: '',
    maxlength: 1000
  },
  entryDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

export default mongoose.model('MoodEntry', MoodEntrySchema);
