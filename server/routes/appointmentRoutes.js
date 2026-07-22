import express from 'express';
import {
  bookAppointment,
  getAppointments,
  rescheduleAppointment,
  cancelAppointment
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(bookAppointment)
  .get(getAppointments);

router.put('/:id/reschedule', rescheduleAppointment);
router.put('/:id/cancel', cancelAppointment);

export default router;