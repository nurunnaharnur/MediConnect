import User from '../models/User.js';

// @desc    List all doctors patients can share reports with
// @route   GET /api/doctors
export const listDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select(
      'name email specialization qualification'
    );
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};