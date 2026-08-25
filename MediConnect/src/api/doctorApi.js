import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function doctorRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Doctor API request failed.');
  }

  return data;
}

// GET /api/doctor/patients
export const fetchDoctorPatients = () => doctorRequest('/doctor/patients');

// GET /api/doctor/patient/:id
export const fetchPatientFullRecord = (patientId) => doctorRequest(`/doctor/patient/${patientId}`);

// GET /api/doctor/appointments
export const fetchDoctorAppointments = () => doctorRequest('/doctor/appointments');

// PATCH /api/doctor/appointments/:id
export const updateDoctorAppointment = (id, payload) =>
  doctorRequest(`/doctor/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

// GET /api/doctors
export const fetchDoctors = () => doctorRequest('/doctors');
