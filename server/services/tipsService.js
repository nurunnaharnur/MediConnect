import MoodEntry from '../models/MoodEntry.js';
import MedicineReminder from '../models/MedicineReminder.js';

export async function generatePersonalizedTips(patient) {
  const tips = [];
  const historyText = (patient.medicalHistory || '').toLowerCase();
  
  // Calculate BMI if height and weight exist
  let bmi = null;
  if (patient.height && patient.weight && patient.height > 0) {
    const heightInMeters = patient.height / 100;
    bmi = Number((patient.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  // 1. Fetch recent mood entries
  const recentMoods = await MoodEntry.find({ patientId: patient._id })
    .sort({ entryDate: -1 })
    .limit(5);

  // 2. Fetch active prescriptions
  const activeReminders = await MedicineReminder.find({
    patientId: patient._id,
    status: 'scheduled'
  });

  // --- Condition-Specific Tips based on Medical History ---
  if (historyText.includes('hypertension') || historyText.includes('blood pressure') || historyText.includes('bp')) {
    tips.push({
      id: 'hyp-1',
      category: 'Blood Pressure & Heart',
      icon: '🫀',
      title: 'Managing Blood Pressure with the DASH Pattern',
      content: 'Incorporating potassium-rich foods (bananas, spinach, beans) and moderating daily sodium intake under 2,000mg helps blood vessels remain relaxed and flexible.',
      tag: 'Personalized for Hypertension'
    });
  }

  if (historyText.includes('diabetes') || historyText.includes('sugar') || historyText.includes('glucose')) {
    tips.push({
      id: 'dia-1',
      category: 'Glucose & Metabolic Health',
      icon: '🩸',
      title: 'Pairing Fiber with Carbohydrates',
      content: 'Eating soluble fiber (oats, legumes, leafy greens) before starch slows carbohydrate digestion, helping avoid sudden post-meal blood sugar spikes.',
      tag: 'Personalized for Blood Glucose'
    });
  }

  if (historyText.includes('asthma') || historyText.includes('breathing') || historyText.includes('respiratory')) {
    tips.push({
      id: 'ast-1',
      category: 'Respiratory Wellness',
      icon: '🫁',
      title: 'Optimal Inhaler Technique & Cold Air Precautions',
      content: 'Always rinse your mouth after using steroid inhalers to prevent oral thrush. During cold weather, wearing a light scarf over the nose and mouth warms inhaled air.',
      tag: 'Personalized for Respiratory Health'
    });
  }

  if (historyText.includes('heart') || historyText.includes('cardiac') || historyText.includes('cholesterol')) {
    tips.push({
      id: 'card-1',
      category: 'Cardiovascular Care',
      icon: '❤️',
      title: 'Omega-3 Fats & Daily Heart Activity',
      content: 'Omega-3 fatty acids from fish or flaxseeds support arterial flexibility. 20–30 minutes of gentle aerobic walking daily promotes healthy circulation.',
      tag: 'Personalized for Cardiovascular Health'
    });
  }

  // --- Vitals & BMI Based Tips ---
  if (bmi && bmi >= 25) {
    tips.push({
      id: 'bmi-high',
      category: 'Metabolic Wellness',
      icon: '⚖️',
      title: 'Sustainable Movement & Hydration First',
      content: `Your current BMI is approximately ${bmi}. Prioritizing 2–3 liters of water daily and engaging in low-impact movement (brisk walking, swimming, cycling) protects joints while boosting metabolic rate.`,
      tag: 'Vitals-Tailored'
    });
  } else if (bmi && bmi < 18.5) {
    tips.push({
      id: 'bmi-low',
      category: 'Nutritional Density',
      icon: '🥗',
      title: 'Nutrient-Dense Caloric Balance',
      content: 'Focus on healthy calorie-dense foods such as avocados, nut butters, olive oil, and complex grains to maintain lean muscle mass and sustained energy.',
      tag: 'Vitals-Tailored'
    });
  }

  // --- Mood & Stress Trends Based Tips ---
  const hasHighStress = recentMoods.some((m) => ['stressed', 'anxious', 'angry'].includes(m.mood));
  const hasLowMood = recentMoods.some((m) => ['sad', 'very_sad'].includes(m.mood));

  if (hasHighStress) {
    tips.push({
      id: 'mood-stress',
      category: 'Stress & Nervous System',
      icon: '🧘',
      title: 'Vagal Nerve Activation (4-7-8 Breathing)',
      content: 'Your recent check-ins reflect elevated tension or stress. Inhale for 4 seconds, hold for 7, and exhale slowly for 8. This triggers the parasympathetic nervous system to quickly down-regulate heart rate.',
      tag: 'Based on Recent Mood Check-ins'
    });
  }

  if (hasLowMood) {
    tips.push({
      id: 'mood-low',
      category: 'Emotional Wellness',
      icon: '☀️',
      title: 'Morning Natural Light & Micro-Goals',
      content: 'Spending 10–15 minutes outside in natural sunlight within an hour of waking resets your circadian clock and triggers dopamine and serotonin release, gently supporting mood.',
      tag: 'Based on Recent Mood Check-ins'
    });
  }

  // --- Medication Adherence Tips ---
  if (activeReminders.length > 0) {
    tips.push({
      id: 'med-1',
      category: 'Medication Adherence',
      icon: '💊',
      title: `Adherence for Your ${activeReminders.length} Scheduled Medication(s)`,
      content: 'Take pills with a full 8oz glass of water to ensure complete transit to the stomach. Never crush or split extended-release (ER/XR) capsules unless explicitly directed by your doctor.',
      tag: 'Prescription Schedule'
    });
  }

  // --- Universal Health Standards (Guaranteed minimum of 4 helpful tips) ---
  const fallbackTips = [
    {
      id: 'univ-1',
      category: 'Hydration & Cellular Health',
      icon: '💧',
      title: 'Hydration and Nutrient Absorption',
      content: 'Adequate hydration supports kidney filtration and helps medications distribute evenly throughout tissues.',
      tag: 'General Wellness'
    },
    {
      id: 'univ-2',
      category: 'Sleep Architecture',
      icon: '🌙',
      title: 'Consistent Circadian Sleep Timing',
      content: 'Going to sleep and waking at identical times every day — even on weekends — stabilizes daytime energy and hormone regulation.',
      tag: 'Sleep Hygiene'
    },
    {
      id: 'univ-3',
      category: 'Preventive Nutrition',
      icon: '🥦',
      title: 'Phytonutrients & Color Variety',
      content: 'Consuming vegetables across 3 different colors daily provides a rich spectrum of antioxidants that defend cellular health.',
      tag: 'Nutrition'
    }
  ];

  fallbackTips.forEach((fb) => {
    if (tips.length < 5 && !tips.some((t) => t.id === fb.id)) {
      tips.push(fb);
    }
  });

  return {
    patientName: patient.name,
    totalTips: tips.length,
    disclaimer: 'Educational information only. This is not medical advice or a clinical diagnosis. Consult your doctor for individualized treatment.',
    tips
  };
}
