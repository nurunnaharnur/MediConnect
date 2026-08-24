const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Sorts cycle records by periodStartDate ascending and returns the gaps
// (in whole days) between consecutive period start dates.
export function getSortedCyclesAndGaps(cycles) {
  const sorted = [...cycles].sort(
    (a, b) => new Date(a.periodStartDate) - new Date(b.periodStartDate)
  );

  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.round(
      (new Date(sorted[i].periodStartDate) - new Date(sorted[i - 1].periodStartDate)) / MS_PER_DAY
    );
    if (days > 0) gaps.push(days);
  }

  return { sorted, gaps };
}

export const CYCLE_DISCLAIMER =
  'Cycle and fertile-window predictions are estimates based on recorded cycle history. ' +
  'They should not be used as a guaranteed method of contraception or as medical advice.';

// Deterministic cycle + fertile-window prediction.
// Requires at least 2 recorded periods (i.e. at least 1 gap) to produce a result.
export function predictCycle(cycles) {
  const { sorted, gaps } = getSortedCyclesAndGaps(cycles);

  if (sorted.length < 2 || gaps.length === 0) {
    return {
      hasEnoughData: false,
      message: 'Add at least two completed cycles to generate a cycle prediction.',
      disclaimer: CYCLE_DISCLAIMER
    };
  }

  const averageCycleLength = Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
  const lastPeriod = sorted[sorted.length - 1];
  const lastPeriodStart = new Date(lastPeriod.periodStartDate);

  const predictedNextPeriod = addDays(lastPeriodStart, averageCycleLength);
  const estimatedOvulationDate = addDays(predictedNextPeriod, -14);
  const fertileWindow = {
    start: addDays(estimatedOvulationDate, -5),
    end: addDays(estimatedOvulationDate, 1)
  };

  return {
    hasEnoughData: true,
    averageCycleLength,
    lastPeriodStart,
    predictedNextPeriod,
    estimatedOvulationDate,
    fertileWindow,
    cycleLengthsUsed: gaps,
    disclaimer: CYCLE_DISCLAIMER
  };
}