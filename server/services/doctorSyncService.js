import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';

const DEFAULT_SLOTS = [
  { day: 'Monday', startTime: '09:00', endTime: '13:00' },
  { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
  { day: 'Friday', startTime: '15:00', endTime: '18:00' },
];

/**
 * Removes duplicate doctor entries from the Doctor collection
 */
export async function cleanupDuplicateDoctors() {
  try {
    const allDoctors = await Doctor.find().sort({ createdAt: 1 });
    const seenEmails = new Set();
    const seenUserIds = new Set();
    const seenNames = new Set();

    for (const doc of allDoctors) {
      const email = doc.email ? doc.email.toLowerCase().trim() : null;
      const userId = doc.userId ? doc.userId.toString() : null;
      const name = doc.name ? doc.name.toLowerCase().trim() : null;

      let isDuplicate = false;

      if (userId && seenUserIds.has(userId)) isDuplicate = true;
      if (email && seenEmails.has(email)) isDuplicate = true;
      if (!userId && !email && name && seenNames.has(name)) isDuplicate = true;

      if (isDuplicate) {
        await Doctor.deleteOne({ _id: doc._id });
      } else {
        if (userId) seenUserIds.add(userId);
        if (email) seenEmails.add(email);
        if (name) seenNames.add(name);
      }
    }
  } catch (error) {
    console.error('Error cleaning up duplicate doctors:', error.message);
  }
}

/**
 * Synchronizes a registered doctor user into the Doctor collection
 */
export async function syncDoctorUser(userDoc) {
  if (!userDoc || userDoc.role !== 'doctor') return null;

  try {
    const email = userDoc.email ? userDoc.email.toLowerCase().trim() : '';

    // Check if Doctor record already exists by userId or email or name
    let doctor = await Doctor.findOne({
      $or: [
        { userId: userDoc._id },
        ...(email ? [{ email }] : []),
        { name: userDoc.name },
      ],
    });

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
      `${userDoc.qualification ? userDoc.qualification + ' — ' : ''}Specialist in ${specialty}. License ID: ${userDoc.licenseNumber || 'Verified'}. Dedicated to comprehensive patient consultations.`;

    if (!doctor) {
      doctor = await Doctor.create({
        userId: userDoc._id,
        name: userDoc.name,
        email,
        specialty,
        experienceYears,
        hospitalId,
        rating: 4.8,
        bio,
        availableSlots: DEFAULT_SLOTS,
      });
    } else {
      let modified = false;
      if (!doctor.userId) { doctor.userId = userDoc._id; modified = true; }
      if (!doctor.email && email) { doctor.email = email; modified = true; }
      if (!doctor.hospitalId && hospitalId) { doctor.hospitalId = hospitalId; modified = true; }
      if (userDoc.specialization && doctor.specialty !== userDoc.specialization) {
        doctor.specialty = userDoc.specialization;
        modified = true;
      }
      if (modified) await doctor.save();
    }

    return doctor;
  } catch (error) {
    console.error(`Error syncing doctor for user ${userDoc._id}:`, error.message);
    return null;
  }
}

/**
 * Synchronizes all registered doctor users in the system and cleans up duplicates
 */
export async function syncAllDoctorUsers() {
  try {
    await cleanupDuplicateDoctors();
    const doctorUsers = await User.find({ role: 'doctor' });
    for (const docUser of doctorUsers) {
      await syncDoctorUser(docUser);
    }
    await cleanupDuplicateDoctors();
  } catch (error) {
    console.error('Error syncing all doctors:', error.message);
  }
}
