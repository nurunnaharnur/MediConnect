import express from 'express';
import {
  getNearbyHospitals,
  getHospitals,
  getHospitalById,
} from '../controllers/hospitalController.js';

const router = express.Router();

// Public discovery endpoints
router.get('/nearby', getNearbyHospitals);
router.get('/', getHospitals);
router.get('/:id', getHospitalById);

export default router;
