import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';

// @desc    List doctors, optionally filtered by hospital and/or specialty and/or rating (FR-10)
// @route   GET /api/doctors?hospitalId=..&specialty=..&minRating=..
export const getDoctors = async (req, res) => {
  const { hospitalId, specialty, minRating } = req.query;

  const query = {};
  if (hospitalId) {
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ message: 'Invalid hospitalId.' });
    }
    query.hospitalId = hospitalId;
  }
  if (specialty) query.specialty = specialty;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };

  try {
    const doctors = await Doctor.find(query)
      .populate('hospitalId', 'name address')
      .sort({ rating: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single doctor's full profile: specialty, experience, available slots (FR-11)
// @route   GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid doctor id.' });
    }
    const doctor = await Doctor.findById(req.params.id).populate('hospitalId', 'name address phone');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
