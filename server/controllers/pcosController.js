import PcosProfile from '../models/PcosProfile.js';
import MenstrualCycle from '../models/MenstrualCycle.js';
import { evaluatePcosScreening } from '../utils/pcosRules.js';

// @desc    Get the logged-in patient's PCOS symptom profile
// @route   GET /api/pcos/profile
export const getProfile = async (req, res) => {
  try {
    const profile = await PcosProfile.findOne({ patientId: req.user._id });
    res.json(
      profile || {
        patientId: req.user._id,
        acne: false,
        excessHairGrowth: false,
        hairThinning: false,
        weightGain: false,
        skinDarkening: false,
        familyHistoryPCOS: false,
        notes: ''
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update the logged-in patient's PCOS symptom profile
// @route   PUT /api/pcos/profile
export const upsertProfile = async (req, res) => {
  const { acne, excessHairGrowth, hairThinning, weightGain, skinDarkening, familyHistoryPCOS, notes } = req.body;
  try {
    const profile = await PcosProfile.findOneAndUpdate(
      { patientId: req.user._id },
      {
        patientId: req.user._id,
        acne: !!acne,
        excessHairGrowth: !!excessHairGrowth,
        hairThinning: !!hairThinning,
        weightGain: !!weightGain,
        skinDarkening: !!skinDarkening,
        familyHistoryPCOS: !!familyHistoryPCOS,
        notes: notes || ''
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Run the rule-based PCOS pattern screening
// @route   GET /api/pcos/screening
export const getScreening = async (req, res) => {
  try {
    const [cycles, profile] = await Promise.all([
      MenstrualCycle.find({ patientId: req.user._id }).sort({ periodStartDate: 1 }),
      PcosProfile.findOne({ patientId: req.user._id })
    ]);
    const screening = evaluatePcosScreening(cycles, profile);
    res.json(screening);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};