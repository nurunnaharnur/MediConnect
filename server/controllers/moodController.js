import MoodEntry from '../models/MoodEntry.js';

const MOOD_SCORE_MAP = {
  very_happy: 5,
  happy: 4,
  calm: 4,
  neutral: 3,
  stressed: 2,
  anxious: 2,
  sad: 2,
  very_sad: 1,
  angry: 1
};

const SCORE_TO_LABEL_MAP = {
  5: 'Very Happy',
  4: 'Happy / Calm',
  3: 'Neutral',
  2: 'Mild Distress',
  1: 'Low / Distressed'
};

// @desc    Create a new mood check-in entry
// @route   POST /api/mood
export const createMoodEntry = async (req, res) => {
  try {
    const { mood, emotions, note, entryDate } = req.body;

    if (!mood || !MOOD_SCORE_MAP[mood]) {
      return res.status(400).json({ message: 'A valid mood selection is required.' });
    }

    const moodScore = MOOD_SCORE_MAP[mood];
    const newEntry = await MoodEntry.create({
      patientId: req.user._id,
      mood,
      moodScore,
      emotions: Array.isArray(emotions) ? emotions : [],
      note: note ? String(note).trim() : '',
      entryDate: entryDate ? new Date(entryDate) : new Date()
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ message: error.message || 'Failed to record mood entry.' });
  }
};

// @desc    Get mood entries with timeframe filtering
// @route   GET /api/mood
export const getMoodEntries = async (req, res) => {
  try {
    const { timeframe } = req.query; // '7d', '30d', '90d', or 'all'
    const query = { patientId: req.user._id };

    if (timeframe && timeframe !== 'all') {
      const now = new Date();
      let days = 7;
      if (timeframe === '30d') days = 30;
      if (timeframe === '90d') days = 90;

      const startDate = new Date();
      startDate.setDate(now.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      query.entryDate = { $gte: startDate };
    }

    const entries = await MoodEntry.find(query).sort({ entryDate: -1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve mood entries.' });
  }
};

// @desc    Get aggregated mood analytics and trend data
// @route   GET /api/mood/analytics
export const getMoodAnalytics = async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const now = new Date();
    let days = 7;
    if (timeframe === '30d') days = 30;
    if (timeframe === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await MoodEntry.find({
      patientId: req.user._id,
      entryDate: { $gte: startDate }
    }).sort({ entryDate: 1 });

    const totalEntries = entries.length;

    if (totalEntries === 0) {
      return res.json({
        totalEntries: 0,
        averageScore: null,
        averageMoodLabel: 'No entries yet',
        mostFrequentEmotion: 'None',
        topEmotions: [],
        trajectory: 'No data',
        trendSeries: []
      });
    }

    // 1. Calculate Average Mood Score
    const totalScore = entries.reduce((acc, curr) => acc + curr.moodScore, 0);
    const averageScore = Number((totalScore / totalEntries).toFixed(1));
    const roundedScore = Math.round(averageScore);
    const averageMoodLabel = SCORE_TO_LABEL_MAP[roundedScore] || 'Neutral';

    // 2. Aggregate Emotion Tags
    const emotionCounts = {};
    entries.forEach((entry) => {
      if (Array.isArray(entry.emotions)) {
        entry.emotions.forEach((tag) => {
          emotionCounts[tag] = (emotionCounts[tag] || 0) + 1;
        });
      }
    });

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    const mostFrequentEmotion = topEmotions.length > 0 ? topEmotions[0].emotion : 'None';

    // 3. Aggregate Daily Trend Points
    const dailyMap = {};
    entries.forEach((entry) => {
      const dateKey = new Date(entry.entryDate).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          scores: [],
          emotions: []
        };
      }
      dailyMap[dateKey].scores.push(entry.moodScore);
      if (entry.emotions) {
        dailyMap[dateKey].emotions.push(...entry.emotions);
      }
    });

    const trendSeries = Object.keys(dailyMap).sort().map((dateKey) => {
      const dayData = dailyMap[dateKey];
      const avg = Number((dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length).toFixed(1));
      const dateObj = new Date(dateKey + 'T00:00:00');
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: dateKey,
        displayDate,
        averageScore: avg,
        entriesCount: dayData.scores.length
      };
    });

    // 4. Calculate Trajectory (first half vs second half)
    let trajectory = 'Stable';
    if (entries.length >= 4) {
      const mid = Math.floor(entries.length / 2);
      const firstHalf = entries.slice(0, mid);
      const secondHalf = entries.slice(mid);

      const firstAvg = firstHalf.reduce((a, b) => a + b.moodScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b.moodScore, 0) / secondHalf.length;

      const diff = secondAvg - firstAvg;
      if (diff >= 0.4) trajectory = 'Improving';
      else if (diff <= -0.4) trajectory = 'Decreasing';
      else trajectory = 'Stable';
    }

    res.json({
      timeframe,
      totalEntries,
      averageScore,
      averageMoodLabel,
      mostFrequentEmotion,
      topEmotions: topEmotions.slice(0, 5),
      trajectory,
      trendSeries
    });
  } catch (error) {
    console.error('Error computing mood analytics:', error);
    res.status(500).json({ message: error.message || 'Failed to compute mood trends.' });
  }
};

// @desc    Delete a mood check-in entry
// @route   DELETE /api/mood/:id
export const deleteMoodEntry = async (req, res) => {
  try {
    const entry = await MoodEntry.findOneAndDelete({
      _id: req.params.id,
      patientId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ message: 'Mood record not found or unauthorized.' });
    }

    res.json({ message: 'Mood record successfully deleted.' });
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ message: error.message || 'Failed to delete mood record.' });
  }
};
