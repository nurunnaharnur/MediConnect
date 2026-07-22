// server/data/symptomRules.js
//
// The rule-base for the AI-assisted (rule-based) symptom checker.
// This is intentionally a plain, structured JS array (not a trained ML model) —
// see SRS section 3.1.9 "Sample Rule-Base Logic". Admins/devs can add a new
// mapping just by adding a new object here; no code changes elsewhere are needed
// (SRS NFR-10).
//
// Each rule:
//   id:               unique key
//   requiredSymptoms: array of symptom keys (see SYMPTOM_OPTIONS below) that must
//                      ALL be present in what the patient selected for this rule to match
//   condition:        the possible condition shown to the patient
//   specialist:       recommended specialist (feature 4)
//   severity:         'Low' | 'Moderate' | 'Urgent' (feature 5)
//   sensitive:        true for mental-health / reproductive-health rules — the API
//                      attaches an extra disclaimer + helpline note for these (SRS pg 8)

export const symptomRules = [
  {
    id: 'flu-cold',
    requiredSymptoms: ['fever', 'cough'],
    condition: 'Flu / Common Cold',
    specialist: 'General Physician',
    severity: 'Low',
  },
  {
    id: 'viral-infection',
    requiredSymptoms: ['fever', 'sore_throat', 'body_ache'],
    condition: 'Possible Viral Infection',
    specialist: 'General Physician',
    severity: 'Low',
  },
  {
    id: 'cardiac',
    requiredSymptoms: ['chest_pain'],
    condition: 'Possible Cardiac Issue',
    specialist: 'Cardiologist',
    severity: 'Urgent',
  },
  {
    id: 'heart-kidney',
    requiredSymptoms: ['shortness_of_breath', 'leg_swelling'],
    condition: 'Possible Heart / Kidney Issue',
    specialist: 'Cardiologist / Nephrologist',
    severity: 'Urgent',
  },
  {
    id: 'dermatological',
    requiredSymptoms: ['skin_rash'],
    condition: 'Dermatological Condition',
    specialist: 'Dermatologist',
    severity: 'Low',
  },
  {
    id: 'neurological',
    requiredSymptoms: ['persistent_headache', 'blurred_vision'],
    condition: 'Possible Neurological Issue',
    specialist: 'Neurologist',
    severity: 'Moderate',
  },
  {
    id: 'arthritis',
    requiredSymptoms: ['joint_pain', 'swelling'],
    condition: 'Possible Arthritis',
    specialist: 'Orthopedic / Rheumatologist',
    severity: 'Moderate',
  },
  {
    id: 'gastric',
    requiredSymptoms: ['abdominal_pain', 'nausea'],
    condition: 'Possible Gastric Issue',
    specialist: 'Gastroenterologist',
    severity: 'Moderate',
  },
  {
    id: 'gastroenteritis',
    requiredSymptoms: ['fatigue', 'diarrhea'],
    condition: 'Possible Gastroenteritis',
    specialist: 'Gastroenterologist / General Physician',
    severity: 'Moderate',
  },
  {
    id: 'diabetes-indicator',
    requiredSymptoms: ['frequent_urination', 'excessive_thirst', 'fatigue'],
    condition: 'Possible Diabetes Indicator',
    specialist: 'Endocrinologist',
    severity: 'Moderate',
  },
  {
    id: 'depression',
    requiredSymptoms: ['persistent_sadness', 'loss_of_interest', 'low_energy'],
    condition: 'Possible Depression',
    specialist: 'Psychiatrist / Clinical Psychologist',
    severity: 'Moderate',
    sensitive: true,
  },
  {
    id: 'anxiety',
    requiredSymptoms: ['excessive_worry', 'restlessness', 'racing_heart'],
    condition: 'Possible Anxiety Disorder',
    specialist: 'Psychiatrist / Clinical Psychologist',
    severity: 'Moderate',
    sensitive: true,
  },
  {
    id: 'ocd',
    requiredSymptoms: ['intrusive_thoughts', 'repetitive_behaviors'],
    condition: 'Possible OCD',
    specialist: 'Psychiatrist / Clinical Psychologist',
    severity: 'Moderate',
    sensitive: true,
  },
  {
    id: 'pcos',
    requiredSymptoms: ['irregular_periods', 'weight_gain', 'acne'],
    condition: 'Possible PCOS',
    specialist: 'Gynecologist / Endocrinologist',
    severity: 'Moderate',
    sensitive: true,
  },
  {
    id: 'menstrual-disorder',
    requiredSymptoms: ['severe_menstrual_pain', 'heavy_flow'],
    condition: 'Possible Menstrual Disorder',
    specialist: 'Gynecologist',
    severity: 'Moderate',
    sensitive: true,
  },
];

// The checklist the frontend renders (FR-3: "enter symptoms via a checklist").
// key must exactly match a requiredSymptoms entry above.
export const SYMPTOM_OPTIONS = [
  { key: 'fever', label: 'Fever', category: 'General' },
  { key: 'cough', label: 'Cough', category: 'General' },
  { key: 'sore_throat', label: 'Sore Throat', category: 'General' },
  { key: 'body_ache', label: 'Body Ache', category: 'General' },
  { key: 'fatigue', label: 'Fatigue', category: 'General' },

  { key: 'chest_pain', label: 'Chest Pain', category: 'Cardio / Respiratory' },
  { key: 'shortness_of_breath', label: 'Shortness of Breath', category: 'Cardio / Respiratory' },
  { key: 'leg_swelling', label: 'Leg Swelling', category: 'Cardio / Respiratory' },

  { key: 'persistent_headache', label: 'Persistent Headache', category: 'Neurological' },
  { key: 'blurred_vision', label: 'Blurred Vision', category: 'Neurological' },

  { key: 'skin_rash', label: 'Skin Rash', category: 'Skin' },
  { key: 'joint_pain', label: 'Joint Pain', category: 'Musculoskeletal' },
  { key: 'swelling', label: 'Swelling', category: 'Musculoskeletal' },

  { key: 'abdominal_pain', label: 'Abdominal Pain', category: 'Digestive' },
  { key: 'nausea', label: 'Nausea', category: 'Digestive' },
  { key: 'diarrhea', label: 'Diarrhea', category: 'Digestive' },

  { key: 'frequent_urination', label: 'Frequent Urination', category: 'Metabolic' },
  { key: 'excessive_thirst', label: 'Excessive Thirst', category: 'Metabolic' },

  { key: 'persistent_sadness', label: 'Persistent Sadness (2+ weeks)', category: 'Mental Wellbeing' },
  { key: 'loss_of_interest', label: 'Loss of Interest', category: 'Mental Wellbeing' },
  { key: 'low_energy', label: 'Low Energy', category: 'Mental Wellbeing' },
  { key: 'excessive_worry', label: 'Excessive Worry', category: 'Mental Wellbeing' },
  { key: 'restlessness', label: 'Restlessness', category: 'Mental Wellbeing' },
  { key: 'racing_heart', label: 'Racing Heart', category: 'Mental Wellbeing' },
  { key: 'intrusive_thoughts', label: 'Intrusive Thoughts', category: 'Mental Wellbeing' },
  { key: 'repetitive_behaviors', label: 'Repetitive / Compulsive Behaviors', category: 'Mental Wellbeing' },

  { key: 'irregular_periods', label: 'Irregular Periods', category: 'Reproductive Health' },
  { key: 'weight_gain', label: 'Weight Gain', category: 'Reproductive Health' },
  { key: 'acne', label: 'Acne / Excess Hair Growth', category: 'Reproductive Health' },
  { key: 'severe_menstrual_pain', label: 'Severe Menstrual Pain', category: 'Reproductive Health' },
  { key: 'heavy_flow', label: 'Heavy Flow', category: 'Reproductive Health' },
];

/**
 * Finds the best-matching rule for a given set of submitted symptom keys.
 * "Best" = the rule whose requiredSymptoms are ALL present in the submission,
 * preferring the most specific (longest requiredSymptoms) match.
 * Returns null if nothing matches.
 */
export function matchRule(submittedSymptoms) {
  const submitted = new Set(submittedSymptoms.map((s) => s.toLowerCase().trim()));

  const fullMatches = symptomRules.filter((rule) =>
    rule.requiredSymptoms.every((sym) => submitted.has(sym))
  );

  if (fullMatches.length === 0) return null;

  // Prefer the rule that explains the most symptoms (most specific match)
  fullMatches.sort((a, b) => b.requiredSymptoms.length - a.requiredSymptoms.length);
  return fullMatches[0];
}
