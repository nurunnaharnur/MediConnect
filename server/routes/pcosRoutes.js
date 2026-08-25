import express from 'express';
import { getProfile, upsertProfile, getScreening } from '../controllers/pcosController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(upsertProfile);

router.get('/screening', getScreening);

export default router;