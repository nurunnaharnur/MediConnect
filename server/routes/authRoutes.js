import express from 'express';
import {
  register,
  login,
  doctorRegister,
  doctorLogin,
  getMe,
  updateEmergencyContact,
  sendEmergencyAlert,
  getHealthTips,
  exportComprehensiveHealthProfilePDF
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/doctor-register', doctorRegister);
router.post('/doctor-login', doctorLogin);

// Protected endpoints
router.get('/me', protect, getMe);
router.put('/emergency-contact', protect, updateEmergencyContact);
router.post('/emergency-alert', protect, sendEmergencyAlert);
router.get('/health-tips', protect, getHealthTips);
router.get('/health-profile/pdf', protect, exportComprehensiveHealthProfilePDF);

export default router;