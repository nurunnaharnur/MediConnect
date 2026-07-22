import SymptomCheck from '../models/SymptomCheck.js';
import { matchRule, SYMPTOM_OPTIONS } from '../data/symptomRules.js';

const MENTAL_HEALTH_DISCLAIMER =
  'This is a screening prompt only, not a diagnosis. If you are struggling, please reach out to a ' +
  'qualified mental-health professional. If you are in crisis, contact your local emergency number ' +
  'or a crisis helpline right away.';

const GENERAL_DISCLAIMER =
  'This suggestion is informational only and not a substitute for professional medical diagnosis. ' +
  'Please consult a qualified doctor.';

// @desc    Return the checklist options the frontend renders
// @route   GET /api/symptom-check/options
export const getSymptomOptions = (req, res) => {
  res.json(SYMPTOM_OPTIONS);
};

// @desc    Run the rule-based symptom check (FR-3, FR-4, FR-5, FR-6) and log it (FR-8)
// @route   POST /api/symptom-check
export const runSymptomCheck = async (req, res) => {
  const { symptoms } = req.body;

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
          sensitive: !!rule.sensitive,
          matched: true,
        }
      : {
          // Fallback for FR-4/FR-7: unmatched combinations still get a safe, useful response
          condition: 'Unclassified symptom combination',
          specialist: 'General Physician',
          severity: 'Low',
          sensitive: false,
          matched: false,
        };

    const record = await SymptomCheck.create({
      patientId: req.user._id,
      symptoms,
      ...result,
    });

    res.status(201).json({
      ...record.toObject(),
      disclaimer: result.sensitive ? MENTAL_HEALTH_DISCLAIMER : GENERAL_DISCLAIMER,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the current user's symptom-check history (FR-8)
// @route   GET /api/symptom-check
export const getSymptomHistory = async (req, res) => {
  try {
    const history = await SymptomCheck.find({ patientId: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
