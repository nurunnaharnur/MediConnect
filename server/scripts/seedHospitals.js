// server/scripts/seedHospitals.js
//
// Seeds a small set of sample hospitals and doctors so FR-9/FR-10/FR-11 have
// real data to search against. Safe to run more than once — skips seeding
// anything that already has data.
//
// Usage (from the project root):
//   node --env-file=.env server/scripts/seedHospitals.js

import 'dotenv/config';
import mongoose from 'mongoose';
   import dns from 'node:dns';
   dns.setServers(['8.8.8.8', '1.1.1.1']);
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';

// Coordinates are [longitude, latitude] — GeoJSON order, not the lat/lng
// order people normally say out loud.
const hospitals = [
  {
    name: 'Square Hospital',
    address: '18/F, West Panthapath, Dhaka',
    phone: '+880-2-8159457',
    location: { type: 'Point', coordinates: [90.3866, 23.7519] },
    specialties: ['General Physician', 'Cardiologist', 'Gastroenterologist'],
    rating: 4.5,
  },
  {
    name: 'United Hospital',
    address: 'Plot 15, Road 71, Gulshan, Dhaka',
    phone: '+880-2-8836000',
    location: { type: 'Point', coordinates: [90.4078, 23.7925] },
    specialties: ['Cardiologist', 'Neurologist', 'Endocrinologist'],
    rating: 4.6,
  },
  {
    name: 'Evercare Hospital',
    address: 'Plot 81, Block E, Bashundhara R/A, Dhaka',
    phone: '+880-2-6604700',
    location: { type: 'Point', coordinates: [90.4319, 23.8103] },
    specialties: ['Orthopedic / Rheumatologist', 'Gynecologist', 'Dermatologist'],
    rating: 4.4,
  },
  {
    name: 'Dhaka Medical College Hospital',
    address: 'Secretariat Road, Dhaka',
    phone: '+880-2-55165088',
    location: { type: 'Point', coordinates: [90.3987, 23.7269] },
    specialties: ['General Physician', 'Neurologist', 'Psychiatrist / Clinical Psychologist'],
    rating: 4.0,
  },
  {
    name: 'Ibn Sina Hospital',
    address: 'House 48, Road 9/A, Kallyanpur, Dhaka',
    phone: '+880-2-9130435',
    location: { type: 'Point', coordinates: [90.3654, 23.7639] },
    specialties: ['Dermatologist', 'Gynecologist', 'Endocrinologist'],
    rating: 4.2,
  },
];

// Doctors are attached to hospitals by array index after hospitals are inserted.
const doctorsByHospitalIndex = [
  [
    { name: 'Dr. Farida Rahman', specialty: 'General Physician', experienceYears: 12, rating: 4.7,
      bio: 'General physician focused on primary care and preventive health.',
      availableSlots: [{ day: 'Sunday', startTime: '09:00', endTime: '13:00' }, { day: 'Tuesday', startTime: '09:00', endTime: '13:00' }] },
    { name: 'Dr. Kamal Hossain', specialty: 'Cardiologist', experienceYears: 18, rating: 4.8,
      bio: 'Cardiologist specializing in hypertension and heart-failure management.',
      availableSlots: [{ day: 'Monday', startTime: '15:00', endTime: '18:00' }, { day: 'Wednesday', startTime: '15:00', endTime: '18:00' }] },
  ],
  [
    { name: 'Dr. Nusrat Jahan', specialty: 'Cardiologist', experienceYears: 9, rating: 4.5,
      bio: 'Interventional cardiologist with a focus on preventive cardiology.',
      availableSlots: [{ day: 'Sunday', startTime: '10:00', endTime: '14:00' }] },
    { name: 'Dr. Shafiqul Islam', specialty: 'Neurologist', experienceYears: 15, rating: 4.6,
      bio: 'Neurologist treating headaches, migraines, and neurological disorders.',
      availableSlots: [{ day: 'Thursday', startTime: '16:00', endTime: '19:00' }] },
  ],
  [
    { name: 'Dr. Afsana Karim', specialty: 'Orthopedic / Rheumatologist', experienceYears: 11, rating: 4.3,
      bio: 'Treats joint pain, arthritis, and musculoskeletal conditions.',
      availableSlots: [{ day: 'Saturday', startTime: '09:00', endTime: '12:00' }] },
    { name: 'Dr. Tania Akter', specialty: 'Gynecologist', experienceYears: 14, rating: 4.7,
      bio: "Women's health specialist covering menstrual and reproductive health.",
      availableSlots: [{ day: 'Monday', startTime: '10:00', endTime: '13:00' }, { day: 'Wednesday', startTime: '10:00', endTime: '13:00' }] },
  ],
  [
    { name: 'Dr. Mahmudul Hasan', specialty: 'General Physician', experienceYears: 20, rating: 4.1,
      bio: 'Senior general physician at a major public teaching hospital.',
      availableSlots: [{ day: 'Sunday', startTime: '08:00', endTime: '12:00' }] },
    { name: 'Dr. Sabrina Chowdhury', specialty: 'Psychiatrist / Clinical Psychologist', experienceYears: 10, rating: 4.4,
      bio: 'Clinical psychologist specializing in anxiety, depression, and OCD.',
      availableSlots: [{ day: 'Tuesday', startTime: '14:00', endTime: '17:00' }] },
  ],
  [
    { name: 'Dr. Rezaul Karim', specialty: 'Dermatologist', experienceYears: 8, rating: 4.2,
      bio: 'Dermatologist treating skin conditions, rashes, and allergies.',
      availableSlots: [{ day: 'Saturday', startTime: '15:00', endTime: '18:00' }] },
    { name: 'Dr. Farhana Yasmin', specialty: 'Endocrinologist', experienceYears: 13, rating: 4.5,
      bio: 'Endocrinologist specializing in diabetes and thyroid conditions.',
      availableSlots: [{ day: 'Monday', startTime: '09:00', endTime: '12:00' }] },
  ],
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const existingHospitals = await Hospital.countDocuments();
  if (existingHospitals > 0) {
    console.log(`Hospital collection already has ${existingHospitals} document(s) — skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const insertedHospitals = await Hospital.insertMany(hospitals);
  console.log(`Seeded ${insertedHospitals.length} hospitals.`);

  const doctorDocs = insertedHospitals.flatMap((hospital, index) =>
    (doctorsByHospitalIndex[index] || []).map((doc) => ({ ...doc, hospitalId: hospital._id }))
  );

  await Doctor.insertMany(doctorDocs);
  console.log(`Seeded ${doctorDocs.length} doctors.`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
