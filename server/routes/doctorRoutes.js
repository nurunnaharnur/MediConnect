import express from 'express';
import {
  listDoctors,
  getDoctors,
  getDoctorById,
  getDoctorPatients,
  getPatientFullRecord,
  getDoctorAppointments,
  updateDoctorAppointment,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Doctor authorization check middleware
const requireDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Healthcare provider authorization required.' });
};

// Public Doctor Discovery Endpoints (FR-10, FR-11)
router.get('/', (req, res, next) => {
  if (req.query.hospitalId || req.query.specialty || req.query.minRating) {
    return getDoctors(req, res, next);
  }
  // If no query parameters, return registered doctor list
  return getDoctors(req, res, next);
});

router.get('/list-all', listDoctors);

// Doctor-only routes (require authentication + doctor role)
router.get('/patients', protect, requireDoctor, getDoctorPatients);
router.get('/patient/:id', protect, requireDoctor, getPatientFullRecord);
router.get('/appointments', protect, requireDoctor, getDoctorAppointments);
router.patch('/appointments/:id', protect, requireDoctor, updateDoctorAppointment);

// Doctor detail by ID
router.get('/:id', getDoctorById);

export default router;
