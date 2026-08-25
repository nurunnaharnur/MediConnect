import { getSortedCyclesAndGaps } from './cyclePrediction.js';

// Simple, explicit rule-based PCOS SCREENING (NOT a diagnosis).
// Each rule is intentionally small and independent so rules can be tuned,
// removed, or added later without touching the evaluation logic below.
export const PCOS_RULES = [
  {
    id: 'irregular_cycles',
    label: 'Your recorded cycle lengths vary widely from one cycle to the next.',
    test: ({ gaps }) => gaps.length >= 2 && (Math.max(...gaps) - Math.min(...gaps) > 9)
  },
  {
    id: 'long_cycle_gaps',
    label: 'One or more of your cycles was longer than 35 days.',
    test: ({ gaps }) => gaps.some((g) => g > 35)
  },
  {
    id: 'frequently_missed_periods',
    label: 'Your cycle history suggests periods are being missed frequently.',
    test: ({ gaps }) => gaps.length > 0 && gaps.every((g) => g > 45)
  },
  {
    id: 'acne',
    label: 'You reported ongoing acne.',
    test: (_ctx, profile) => !!profile?.acne
  },
  {
    id: 'excess_hair_growth',
    label: 'You reported excess hair growth.',
    test: (_ctx, profile) => !!profile?.excessHairGrowth
  },
  {
    id: 'hair_thinning',
    label: 'You reported hair thinning or hair loss.',
    test: (_ctx, profile) => !!profile?.hairThinning
  },
  {
    id: 'weight_gain',
    label: 'You reported unexplained weight gain.',
    test: (_ctx, profile) => !!profile?.weightGain
  },
  {
    id: 'skin_darkening',
    label: 'You reported skin darkening.',
    test: (_ctx, profile) => !!profile?.skinDarkening
  }
];

export const PCOS_DISCLAIMER =
  'This is a screening flag based only on the cycle history and symptoms you have entered. ' +
  'It is not a medical diagnosis. Please discuss any concerns with a gynecologist or ' +
  'qualified healthcare provider.';

export function evaluatePcosScreening(cycles, profile) {
  const { gaps } = getSortedCyclesAndGaps(cycles);
  const context = { gaps };

  const matchedRules = PCOS_RULES.filter((rule) => rule.test(context, profile));
  const cycleRelatedIds = ['irregular_cycles', 'long_cycle_gaps', 'frequently_missed_periods'];
  const matchedCycleRules = matchedRules.filter((r) => cycleRelatedIds.includes(r.id));

  let result;
  if (matchedRules.length === 0) {
    result = 'No pattern currently detected';
  } else if (matchedRules.length === 1) {
    result = matchedCycleRules.length === 1
      ? 'Irregular cycle pattern detected'
      : 'A possible PCOS-related pattern was noted';
  } else {
    result = 'Multiple PCOS-related patterns detected';
  }

  return {
    result,
    matchedFlags: matchedRules.map((r) => ({ id: r.id, label: r.label })),
    disclaimer: PCOS_DISCLAIMER
  };
}