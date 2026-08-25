import express from 'express';
import {
  listDoctors,
  getDoctorPatients,
  getPatientFullRecord,
  getDoctorAppointments,
  updateDoctorAppointment
} from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Publicly available to all logged-in users (patients can list doctors)
router.get('/', listDoctors);

// Doctor authorization check middleware
const requireDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Healthcare provider authorization required.' });
};

// Doctor-only routes
router.get('/patients', requireDoctor, getDoctorPatients);
router.get('/patient/:id', requireDoctor, getPatientFullRecord);
router.get('/appointments', requireDoctor, getDoctorAppointments);
router.patch('/appointments/:id', requireDoctor, updateDoctorAppointment);

export default router;
