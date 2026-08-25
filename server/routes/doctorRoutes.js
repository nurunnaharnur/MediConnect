import express from 'express';
import { getDoctors, getDoctorById } from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDoctors);
router.get('/:id', getDoctorById);

export default router;
