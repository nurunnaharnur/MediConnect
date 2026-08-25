import express from 'express';
import {
  getDoctorPatients,
  getPatientFullRecord,
  getDoctorAppointments,
  updateDoctorAppointment
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

router.use(protect);
router.use(requireDoctor);

router.get('/patients', getDoctorPatients);
router.get('/patient/:id', getPatientFullRecord);
router.get('/appointments', getDoctorAppointments);
router.patch('/appointments/:id', updateDoctorAppointment);

export default router;
