import express from 'express';
import {
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
  getAvailableDoctors
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(bookAppointment)
  .get(getPatientAppointments);

router.get('/doctors', getAvailableDoctors);
router.patch('/:id/cancel', cancelAppointment);

export default router;
