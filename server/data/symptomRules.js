// server/data/symptomRules.js
//
// Rule-base for the AI-assisted symptom checker and disease predictor.
// Covers physical, metabolic, mental wellbeing, and reproductive health conditions.

export const symptomRules = [
  {
    id: 'flu-cold',
    requiredSymptoms: ['fever', 'cough'],
    condition: 'Flu / Common Cold',
    specialist: 'General Physician',
    severity: 'Low',
    remedies: [
      { name: 'Paracetamol 500mg', dosage: '1 tablet every 6 hours as needed' },
      { name: 'Warm Saline Gargle & Hydration', dosage: '3-4 times daily' }
    ],
    recommendation: 'Rest adequately, stay well hydrated, and monitor temperature.',
    sensitive: false
  },
  {
    id: 'viral-infection',
    requiredSymptoms: ['fever', 'sore_throat', 'body_ache'],
    condition: 'Possible Viral Infection',
    specialist: 'General Physician',
    severity: 'Low',
    remedies: [
      { name: 'Antihistamine / Antipyretic', dosage: '1 tablet daily at bedtime' },
      { name: 'Vitamin C & Zinc', dosage: '1 tablet daily after meal' }
    ],
    recommendation: 'Monitor symptoms for 48 hours. Consult a doctor if fever persists above 102°F.',
    sensitive: false
  },
  {
    id: 'cardiac',
    requiredSymptoms: ['chest_pain'],
    condition: 'Possible Cardiac Issue / Angina',
    specialist: 'Cardiologist',
    severity: 'Urgent',
    remedies: [
      { name: 'Emergency Clinical Assessment', dosage: 'Immediate hospital visit' }
    ],
    recommendation: 'Seek immediate emergency medical evaluation. Do not engage in strenuous physical activity.',
    sensitive: false
  },
  {
    id: 'heart-kidney',
    requiredSymptoms: ['shortness_of_breath', 'leg_swelling'],
    condition: 'Possible Heart / Kidney Issue',
    specialist: 'Cardiologist / Nephrologist',
    severity: 'Urgent',
    remedies: [
      { name: 'Urgent Specialist Consultation', dosage: 'Consult doctor immediately' }
    ],
    recommendation: 'Leg edema combined with dyspnea requires urgent cardiovascular and renal assessment.',
    sensitive: false
  },
  {
    id: 'dermatological',
    requiredSymptoms: ['skin_rash'],
    condition: 'Dermatological Condition / Allergy',
    specialist: 'Dermatologist',
    severity: 'Low',
    remedies: [
      { name: 'Calamine Lotion / Topical Emollient', dosage: 'Apply gently twice daily' },
      { name: 'Cetirizine 10mg', dosage: '1 tablet at bedtime if itching persists' }
    ],
    recommendation: 'Keep the affected area clean and dry. Avoid harsh soaps or known allergens.',
    sensitive: false
  },
  {
    id: 'neurological',
    requiredSymptoms: ['persistent_headache', 'blurred_vision'],
    condition: 'Possible Neurological Issue / Migraine',
    specialist: 'Neurologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Rest in a Dark Quiet Room', dosage: 'Avoid screen exposure' },
      { name: 'Pain Relief Medication', dosage: 'As prescribed by physician' }
    ],
    recommendation: 'Persistent headaches with visual disturbances warrant neurological evaluation.',
    sensitive: false
  },
  {
    id: 'arthritis',
    requiredSymptoms: ['joint_pain', 'swelling'],
    condition: 'Possible Arthritis / Musculoskeletal Inflammation',
    specialist: 'Orthopedic / Rheumatologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Warm/Cold Compress', dosage: 'Apply 15 mins twice daily' },
      { name: 'Anti-inflammatory Gel', dosage: 'Apply to affected joints' }
    ],
    recommendation: 'Avoid high-impact strain on joints. A rheumatology blood panel is recommended.',
    sensitive: false
  },
  {
    id: 'gastric',
    requiredSymptoms: ['abdominal_pain', 'nausea'],
    condition: 'Possible Gastric Issue / Acid Reflux',
    specialist: 'Gastroenterologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Antacid / Omeprazole 20mg', dosage: '1 capsule 30 mins before breakfast' },
      { name: 'Electrolyte Solution & Bland Diet', dosage: 'Small frequent meals' }
    ],
    recommendation: 'Avoid spicy, oily foods and caffeine. If vomiting or severe pain develops, seek prompt care.',
    sensitive: false
  },
  {
    id: 'gastroenteritis',
    requiredSymptoms: ['fatigue', 'diarrhea'],
    condition: 'Possible Gastroenteritis / Food Intolerance',
    specialist: 'Gastroenterologist / General Physician',
    severity: 'Moderate',
    remedies: [
      { name: 'Oral Rehydration Salts (ORS)', dosage: 'Drink 250ml after each loose stool' },
      { name: 'Probiotics', dosage: '1 capsule daily' }
    ],
    recommendation: 'Maintain strict electrolyte hydration. Consult a physician if diarrhea lasts more than 2 days.',
    sensitive: false
  },
  {
    id: 'diabetes-indicator',
    requiredSymptoms: ['frequent_urination', 'excessive_thirst', 'fatigue'],
    condition: 'Possible Diabetes Mellitus Indicator',
    specialist: 'Endocrinologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Fasting Blood Glucose Test (FBS)', dosage: 'Schedule laboratory screening' },
      { name: 'HbA1c Glycated Hemoglobin Test', dosage: 'Comprehensive 3-month profile' }
    ],
    recommendation: 'The combination of polydipsia (excessive thirst), polyuria (frequent urination), and fatigue strongly indicates screening for glucose regulation.',
    sensitive: false
  },
  {
    id: 'depression',
    requiredSymptoms: ['persistent_sadness', 'loss_of_interest', 'low_energy'],
    condition: 'Possible Depression (Major Depressive Disorder Screen)',
    specialist: 'Psychiatrist / Clinical Psychologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Professional Mental Health Counseling', dosage: 'Schedule confidential consultation' },
      { name: 'Mindfulness & Guided Breathing', dosage: '15 mins daily routine' }
    ],
    recommendation: 'Persistent depressive mood affecting daily function for over 2 weeks is treatable. We encourage speaking with a licensed mental health professional.',
    sensitive: true
  },
  {
    id: 'anxiety',
    requiredSymptoms: ['excessive_worry', 'restlessness', 'racing_heart'],
    condition: 'Possible Generalized Anxiety Disorder / Panic Episode',
    specialist: 'Psychiatrist / Clinical Psychologist',
    severity: 'Moderate',
    remedies: [
      { name: '4-7-8 Deep Breathing Exercise', dosage: 'Practice whenever restlessness occurs' },
      { name: 'Cognitive Behavioral Therapy (CBT)', dosage: 'Consult clinical psychologist' }
    ],
    recommendation: 'Excessive worry combined with somatic symptoms like tachycardia benefits greatly from clinical relaxation techniques and therapy.',
    sensitive: true
  },
  {
    id: 'ocd',
    requiredSymptoms: ['intrusive_thoughts', 'repetitive_behaviors'],
    condition: 'Possible Obsessive-Compulsive Disorder (OCD)',
    specialist: 'Psychiatrist / Clinical Psychologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Exposure and Response Prevention (ERP)', dosage: 'Specialized behavioral therapy' },
      { name: 'Mental Wellbeing Journaling', dosage: 'Track thought triggers daily' }
    ],
    recommendation: 'Intrusive thought patterns accompanied by repetitive rituals are well-managed through targeted psychotherapeutic support.',
    sensitive: true
  },
  {
    id: 'pcos',
    requiredSymptoms: ['irregular_periods', 'weight_gain', 'acne'],
    condition: 'Possible Polycystic Ovary Syndrome (PCOS)',
    specialist: 'Gynecologist / Endocrinologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Pelvic Ultrasound & Hormone Panel', dosage: 'LH/FSH, Free Testosterone, DHEA-S' },
      { name: 'Low Glycemic & High-Fiber Diet', dosage: 'Balanced meals to support insulin regulation' }
    ],
    recommendation: 'Irregular menstruation with androgenic signs (acne, weight changes) warrants an ultrasound and reproductive endocrinology review.',
    sensitive: true
  },
  {
    id: 'menstrual-disorder',
    requiredSymptoms: ['severe_menstrual_pain', 'heavy_flow'],
    condition: 'Possible Dysmenorrhea / Menstrual Disorder',
    specialist: 'Gynecologist',
    severity: 'Moderate',
    remedies: [
      { name: 'Mefenamic Acid / Ibuprofen 400mg', dosage: 'Take with food during active cramps as advised' },
      { name: 'Warm Lower Abdominal Heating Pad', dosage: 'Apply for 20 mins as needed' }
    ],
    recommendation: 'Severe pelvic pain or menorrhagia should be evaluated by a gynecologist to rule out endometriosis or fibroids.',
    sensitive: true
  }
];

// Categorized checklist options
export const SYMPTOM_OPTIONS = [
  // General
  { key: 'fever', label: 'Fever / Elevated Temperature', category: 'General', icon: '🌡️' },
  { key: 'cough', label: 'Persistent Cough', category: 'General', icon: '🗣️' },
  { key: 'sore_throat', label: 'Sore / Scratchy Throat', category: 'General', icon: '🧣' },
  { key: 'body_ache', label: 'Muscle & Body Aches', category: 'General', icon: '💪' },
  { key: 'fatigue', label: 'Severe Fatigue & Weakness', category: 'General', icon: '🥱' },

  // Cardio / Respiratory
  { key: 'chest_pain', label: 'Chest Pain or Pressure', category: 'Cardio / Respiratory', icon: '🫀' },
  { key: 'shortness_of_breath', label: 'Shortness of Breath / Dyspnea', category: 'Cardio / Respiratory', icon: '🫁' },
  { key: 'leg_swelling', label: 'Leg / Ankle Swelling (Edema)', category: 'Cardio / Respiratory', icon: '🦵' },

  // Neurological
  { key: 'persistent_headache', label: 'Persistent Headache / Migraine', category: 'Neurological', icon: '🤕' },
  { key: 'blurred_vision', label: 'Blurred / Altered Vision', category: 'Neurological', icon: '👁️' },

  // Skin & Musculoskeletal
  { key: 'skin_rash', label: 'Skin Rash or Hives', category: 'Skin', icon: '🧴' },
  { key: 'joint_pain', label: 'Joint Pain / Stiffness', category: 'Musculoskeletal', icon: '🦴' },
  { key: 'swelling', label: 'Joint Swelling / Redness', category: 'Musculoskeletal', icon: '🩹' },

  // Digestive
  { key: 'abdominal_pain', label: 'Abdominal / Stomach Pain', category: 'Digestive', icon: '🩺' },
  { key: 'nausea', label: 'Nausea or Vomiting', category: 'Digestive', icon: '🤢' },
  { key: 'diarrhea', label: 'Frequent Diarrhea / Loose Stools', category: 'Digestive', icon: '🚽' },

  // Metabolic
  { key: 'frequent_urination', label: 'Frequent Urination (Polyuria)', category: 'Metabolic', icon: '💧' },
  { key: 'excessive_thirst', label: 'Excessive Thirst (Polydipsia)', category: 'Metabolic', icon: '🥤' },

  // Mental Wellbeing
  { key: 'persistent_sadness', label: 'Persistent Sadness / Emptiness (2+ weeks)', category: 'Mental Wellbeing', icon: '🌧️' },
  { key: 'loss_of_interest', label: 'Loss of Interest in Activities', category: 'Mental Wellbeing', icon: '🥀' },
  { key: 'low_energy', label: 'Chronic Low Energy / Lethargy', category: 'Mental Wellbeing', icon: '🪫' },
  { key: 'excessive_worry', label: 'Excessive Uncontrollable Worry', category: 'Mental Wellbeing', icon: '😰' },
  { key: 'restlessness', label: 'Restlessness / Feeling on Edge', category: 'Mental Wellbeing', icon: '⚡' },
  { key: 'racing_heart', label: 'Racing Heart / Palpitations', category: 'Mental Wellbeing', icon: '💓' },
  { key: 'intrusive_thoughts', label: 'Intrusive / Disturbing Thoughts', category: 'Mental Wellbeing', icon: '💭' },
  { key: 'repetitive_behaviors', label: 'Repetitive / Compulsive Rituals', category: 'Mental Wellbeing', icon: '🔄' },

  // Reproductive Health
  { key: 'irregular_periods', label: 'Irregular / Missed Periods', category: 'Reproductive Health', icon: '🗓️' },
  { key: 'weight_gain', label: 'Unexplained Weight Gain', category: 'Reproductive Health', icon: '⚖️' },
  { key: 'acne', label: 'Acne / Excess Facial & Body Hair', category: 'Reproductive Health', icon: '🌸' },
  { key: 'severe_menstrual_pain', label: 'Severe Menstrual Cramps / Pain', category: 'Reproductive Health', icon: '🩸' },
  { key: 'heavy_flow', label: 'Excessively Heavy Menstrual Flow', category: 'Reproductive Health', icon: '🌊' }
];

export function matchRule(submittedSymptoms) {
  const submitted = new Set(submittedSymptoms.map((s) => s.toLowerCase().trim().replace(/[\s-]+/g, '_')));

  // Normalize rule required symptoms
  const fullMatches = symptomRules.filter((rule) =>
    rule.requiredSymptoms.every((sym) =>
      submitted.has(sym) ||
      submitted.has(sym.replace(/_/g, ' ')) ||
      submitted.has(sym.replace(/_/g, '-'))
    )
  );

  if (fullMatches.length === 0) return null;

  // Prefer the rule that explains the most symptoms (most specific match)
  fullMatches.sort((a, b) => b.requiredSymptoms.length - a.requiredSymptoms.length);
  return fullMatches[0];
}
