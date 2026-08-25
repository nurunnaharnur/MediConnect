import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';

// @desc    Find hospitals near a location, with optional specialty/rating filters (FR-9, FR-10)
// @route   GET /api/hospitals/nearby?lat=..&lng=..&maxDistanceKm=..&specialty=..&minRating=..
export const getNearbyHospitals = async (req, res) => {
  const { lat, lng, maxDistanceKm = 10, specialty, minRating } = req.query;

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({
      message: 'lat and lng are required (use GPS or let the patient enter them manually).',
    });
  }

  // Build the extra filter conditions (FR-10) applied alongside the distance search
  const query = {};
  if (specialty) query.specialties = specialty;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };

  try {
    const hospitals = await Hospital.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distanceMeters',
          maxDistance: parseFloat(maxDistanceKm) * 1000,
          spherical: true,
          query,
        },
      },
      { $sort: { distanceMeters: 1 } },
    ]);

    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single hospital's details
// @route   GET /api/hospitals/:id
export const getHospitalById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid hospital id.' });
    }
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found.' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
