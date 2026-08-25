import CycleEntry from '../models/CycleEntry.js';

// Calculate cycle metrics and phase predictions
function computeCycleMetrics(cycleRecord) {
  const { lastPeriodStart, cycleLength = 28, periodDuration = 5, dailyLogs = [] } = cycleRecord;

  const now = new Date();
  const startDate = new Date(lastPeriodStart);
  startDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - startDate.getTime();
  const daysSinceStart = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const currentCycleDay = (daysSinceStart % cycleLength) + 1;
  const cyclesCompleted = Math.floor(daysSinceStart / cycleLength);

  // Next Period Start Date
  const nextPeriodMs = startDate.getTime() + (cyclesCompleted + 1) * cycleLength * 24 * 60 * 60 * 1000;
  const nextPeriodDate = new Date(nextPeriodMs);
  const daysUntilNext = Math.max(0, Math.ceil((nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Ovulation & Fertile Window
  const ovulationDay = Math.max(10, cycleLength - 14);
  const fertileStartDay = Math.max(periodDuration + 1, ovulationDay - 5);
  const fertileEndDay = ovulationDay + 1;

  // Phase Determination
  let phase = 'Follicular Phase';
  let phaseEmoji = '🌸';
  let phaseDescription = 'Estrogen is rising. Energy and mental clarity are naturally boosted.';
  let recommendations = 'Great time for high-energy workouts, creative projects, and nutrient-dense fresh meals.';

  if (currentCycleDay <= periodDuration) {
    phase = 'Menstrual Phase';
    phaseEmoji = '🩸';
    phaseDescription = `Days 1–${periodDuration}: Uterine lining shedding. Focus on comfort, hydration, and warmth.`;
    recommendations = 'Prioritize iron-rich foods (leafy greens, lentils), magnesium for cramps, and gentle restorative rest.';
  } else if (currentCycleDay >= fertileStartDay && currentCycleDay <= fertileEndDay) {
    phase = 'Ovulation Window';
    phaseEmoji = '🥚';
    phaseDescription = `Estimated Fertile Window (Day ${ovulationDay} is peak ovulation).`;
    recommendations = 'Metabolism and strength peak. Stay well hydrated and maintain consistent sleep.';
  } else if (currentCycleDay > fertileEndDay) {
    phase = 'Luteal Phase';
    phaseEmoji = '🌙';
    phaseDescription = `Days ${fertileEndDay + 1}–${cycleLength}: Progesterone rises as body prepares for the next cycle.`;
    recommendations = 'Focus on complex carbs, calming evening routines, and gentle stretching to ease PMS symptoms.';
  }

  // Sort daily logs by date descending
  const sortedLogs = [...dailyLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    lastPeriodStart: cycleRecord.lastPeriodStart,
    cycleLength,
    periodDuration,
    currentCycleDay,
    daysUntilNext,
    nextPeriodDate,
    ovulationDay,
    phase,
    phaseEmoji,
    phaseDescription,
    recommendations,
    dailyLogs: sortedLogs
  };
}

// @desc    Get patient's cycle data and predictions
// @route   GET /api/cycle
export const getCycleData = async (req, res) => {
  try {
    let cycleRecord = await CycleEntry.findOne({ patientId: req.user._id });

    if (!cycleRecord) {
      // Create default initialized cycle record
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 7); // Default to 7 days ago

      cycleRecord = await CycleEntry.create({
        patientId: req.user._id,
        lastPeriodStart: defaultStart,
        cycleLength: 28,
        periodDuration: 5,
        dailyLogs: []
      });
    }

    const metrics = computeCycleMetrics(cycleRecord);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching cycle data:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve cycle data.' });
  }
};

// @desc    Update cycle settings (last period date, length, duration)
// @route   PUT /api/cycle/settings
export const updateCycleSettings = async (req, res) => {
  const { lastPeriodStart, cycleLength, periodDuration } = req.body;

  try {
    let cycleRecord = await CycleEntry.findOne({ patientId: req.user._id });

    if (!cycleRecord) {
      cycleRecord = new CycleEntry({ patientId: req.user._id });
    }

    if (lastPeriodStart) cycleRecord.lastPeriodStart = new Date(lastPeriodStart);
    if (cycleLength) cycleRecord.cycleLength = Number(cycleLength);
    if (periodDuration) cycleRecord.periodDuration = Number(periodDuration);

    await cycleRecord.save();

    const metrics = computeCycleMetrics(cycleRecord);
    res.json({ message: 'Cycle settings updated successfully.', ...metrics });
  } catch (error) {
    console.error('Error updating cycle settings:', error);
    res.status(500).json({ message: error.message || 'Failed to update cycle settings.' });
  }
};

// @desc    Log daily symptoms and flow
// @route   POST /api/cycle/log
export const logDailySymptom = async (req, res) => {
  const { date, flow, symptoms, note } = req.body;

  try {
    let cycleRecord = await CycleEntry.findOne({ patientId: req.user._id });

    if (!cycleRecord) {
      cycleRecord = await CycleEntry.create({
        patientId: req.user._id,
        lastPeriodStart: new Date(),
        cycleLength: 28,
        periodDuration: 5,
        dailyLogs: []
      });
    }

    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    // Check if a log already exists for this date
    const existingIndex = cycleRecord.dailyLogs.findIndex((l) => {
      const d = new Date(l.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === logDate.getTime();
    });

    if (existingIndex > -1) {
      cycleRecord.dailyLogs[existingIndex].flow = flow || 'none';
      cycleRecord.dailyLogs[existingIndex].symptoms = Array.isArray(symptoms) ? symptoms : [];
      cycleRecord.dailyLogs[existingIndex].note = note || '';
    } else {
      cycleRecord.dailyLogs.push({
        date: logDate,
        flow: flow || 'none',
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        note: note || ''
      });
    }

    await cycleRecord.save();

    const metrics = computeCycleMetrics(cycleRecord);
    res.json({ message: 'Daily cycle entry recorded.', ...metrics });
  } catch (error) {
    console.error('Error logging cycle symptoms:', error);
    res.status(500).json({ message: error.message || 'Failed to record symptom log.' });
  }
};
