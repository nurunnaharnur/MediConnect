import SymptomCheck from '../models/SymptomCheck.js';
import { matchRule, SYMPTOM_OPTIONS, symptomRules } from '../data/symptomRules.js';

const MENTAL_HEALTH_DISCLAIMER =
  'This is an informational screening prompt, not a formal psychiatric diagnosis. If you are struggling, please reach out to a ' +
  'licensed mental-health professional or clinical psychologist. If you or someone you know is in crisis, contact your local emergency services ' +
  'or dial a crisis hotline immediately.';

const GENERAL_DISCLAIMER =
  'This algorithmic suggestion is informational only and not a substitute for professional clinical diagnosis. ' +
  'Please consult a qualified physician or specialist.';

// @desc    Return categorized symptom checklist options
// @route   GET /api/symptom-check/options
export const getSymptomOptions = (req, res) => {
  res.json(SYMPTOM_OPTIONS);
};

// @desc    Run the AI rule-based symptom check
// @route   POST /api/symptom-check
export const runSymptomCheck = async (req, res) => {
  const { symptoms, severity: inputSeverity, durationDays } = req.body;

  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ message: 'Please select at least one symptom.' });
  }

  try {
    const rule = matchRule(symptoms);

    const result = rule
      ? {
          condition: rule.condition,
          specialist: rule.specialist,
          severity: rule.severity,
          remedies: rule.remedies || [],
          recommendation: rule.recommendation || '',
          sensitive: !!rule.sensitive,
          matched: true,
        }
      : {
          condition: 'Unclassified Symptom Pattern',
          specialist: 'General Physician',
          severity: inputSeverity === 'Severe' ? 'Urgent' : 'Low',
          remedies: [
            { name: 'General Physical Consultation', dosage: 'Schedule an in-person appointment' }
          ],
          recommendation: 'Your selected combination of symptoms does not match a single standard pattern. A general physician can perform full lab evaluations.',
          sensitive: false,
          matched: false,
        };

    // Calculate secondary differential diagnoses
    const submittedKeys = new Set(symptoms.map(s => s.toLowerCase().trim().replace(/[\s-]+/g, '_')));
    const allMatches = symptomRules
      .filter(r => r.requiredSymptoms.some(sym => submittedKeys.has(sym)))
      .map(r => {
        const overlap = r.requiredSymptoms.filter(sym => submittedKeys.has(sym)).length;
        const confidence = Math.round((overlap / r.requiredSymptoms.length) * 100);
        return {
          condition: r.condition,
          specialist: r.specialist,
          severity: r.severity,
          confidence
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4);

    let patientId = null;
    if (req.user && req.user._id) {
      patientId = req.user._id;
    }

    const record = await SymptomCheck.create({
      patientId,
      symptoms,
      condition: result.condition,
      specialist: result.specialist,
      severity: result.severity,
      remedies: result.remedies,
      recommendation: result.recommendation,
      sensitive: result.sensitive,
      matched: result.matched,
    });

    res.status(201).json({
      ...record.toObject(),
      differentialDiagnoses: allMatches,
      durationDays: durationDays || 1,
      disclaimer: result.sensitive ? MENTAL_HEALTH_DISCLAIMER : GENERAL_DISCLAIMER,
    });
  } catch (error) {
    console.error('Error running symptom check:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's symptom-check history
// @route   GET /api/symptom-check
export const getSymptomHistory = async (req, res) => {
  try {
    const query = req.user ? { patientId: req.user._id } : {};
    const history = await SymptomCheck.find(query).sort({ createdAt: -1 }).limit(30);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear user's symptom-check history
// @route   DELETE /api/symptom-check
export const clearSymptomHistory = async (req, res) => {
  try {
    const query = req.user ? { patientId: req.user._id } : {};
    await SymptomCheck.deleteMany(query);
    res.json({ message: 'Symptom history cleared successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
