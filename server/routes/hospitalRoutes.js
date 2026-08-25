import express from 'express';
import { getNearbyHospitals, getHospitalById } from '../controllers/hospitalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/nearby', getNearbyHospitals);
router.get('/:id', getHospitalById);

export default router;
