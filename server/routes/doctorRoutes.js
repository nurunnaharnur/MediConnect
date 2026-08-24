import express from 'express';
import { listDoctors } from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', listDoctors);

export default router;