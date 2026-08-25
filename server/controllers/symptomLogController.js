import SymptomLog from '../models/SymptomLog.js';

// @desc    Get symptom history for the logged-in patient, chronological order
// @route   GET /api/symptoms
export const getSymptomHistory = async (req, res) => {
  try {
    const logs = await SymptomLog.find({ patientId: req.user._id }).sort({ loggedAt: 1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};