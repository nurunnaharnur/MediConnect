import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';

const DEFAULT_SLOTS = [
  { day: 'Monday', startTime: '09:00', endTime: '13:00' },
  { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
  { day: 'Friday', startTime: '15:00', endTime: '18:00' },
];

/**
 * Synchronizes a registered doctor user into the Doctor collection
 */
export async function syncDoctorUser(userDoc) {
  if (!userDoc || userDoc.role !== 'doctor') return null;

  try {
    // Check if Doctor record already exists by userId or email
    let doctor = await Doctor.findOne({
      $or: [
        { userId: userDoc._id },
        ...(userDoc.email ? [{ email: userDoc.email.toLowerCase() }] : []),
      ],
    });

    // Find hospital to attach
    let hospitalId = userDoc.hospitalId;
    if (!hospitalId) {
      const defaultHospital = await Hospital.findOne().sort({ rating: -1 });
      if (defaultHospital) {
        hospitalId = defaultHospital._id;
      }
    }

    const specialty = userDoc.specialization || 'General Physician';
    const experienceYears = userDoc.experienceYears || 5;
    const bio = userDoc.bio ||
      `${userDoc.qualification ? userDoc.qualification + ' — ' : ''}Specialist in ${specialty}. License ID: ${userDoc.licenseNumber || 'Verified'}. Dedicated to providing comprehensive healthcare and patient consultations.`;

    if (!doctor) {
      doctor = await Doctor.create({
        userId: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        specialty,
        experienceYears,
        hospitalId,
        rating: 4.8,
        bio,
        availableSlots: DEFAULT_SLOTS,
      });
    } else {
      // Update missing fields
      let modified = false;
      if (!doctor.userId) { doctor.userId = userDoc._id; modified = true; }
      if (!doctor.email && userDoc.email) { doctor.email = userDoc.email; modified = true; }
      if (!doctor.hospitalId && hospitalId) { doctor.hospitalId = hospitalId; modified = true; }
      if (modified) await doctor.save();
    }

    return doctor;
  } catch (error) {
    console.error(`Error syncing doctor for user ${userDoc._id}:`, error.message);
    return null;
  }
}

/**
 * Synchronizes all registered doctor users in the system
 */
export async function syncAllDoctorUsers() {
  try {
    const doctorUsers = await User.find({ role: 'doctor' });
    for (const docUser of doctorUsers) {
      await syncDoctorUser(docUser);
    }
  } catch (error) {
    console.error('Error syncing all doctors:', error.message);
  }
}
