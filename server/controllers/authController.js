import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const ALLOWED_ROLES = ['patient', 'doctor'];

// @desc    Register a Patient or a Doctor
// @route   POST /api/auth/register
export const register = async (req, res) => {
  const {
    name, email, password, age, gender, height, weight, medicalHistory,
    role, specialization, qualification, licenseNumber
  } = req.body;

  const finalRole = ALLOWED_ROLES.includes(role) ? role : 'patient';

  if (finalRole === 'doctor' && (!specialization || !specialization.trim())) {
    return res.status(400).json({ message: 'specialization is required to register as a doctor' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email is already registered' });

    const userData = {
      name,
      email,
      password,
      role: finalRole
    };
    
    if (finalRole === 'doctor') {
      userData.specialization = specialization;
      userData.qualification = qualification;
      userData.licenseNumber = licenseNumber;
    } else {
      userData.age = age;
      userData.gender = gender;
      userData.height = height;
      userData.weight = weight;
      userData.medicalHistory = medicalHistory;
    }
    
    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate Patient or Doctor
// @route   POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};