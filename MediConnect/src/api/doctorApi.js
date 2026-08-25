import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function doctorRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot reach the MediConnect server on port 5001. Check connection and try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Doctor API request failed.');
  }

  return data;
}

// Doctor Discovery APIs (FR-10, FR-11)
export const fetchDoctors = ({ hospitalId, specialty, minRating } = {}) => {
  const params = new URLSearchParams();
  if (hospitalId) params.append('hospitalId', hospitalId);
  if (specialty) params.append('specialty', specialty);
  if (minRating) params.append('minRating', String(minRating));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return doctorRequest(`/doctors${qs}`);
};

export const fetchDoctorById = (doctorId) =>
  doctorRequest(`/doctors/${doctorId}`);

// Clinical Provider Portal APIs
export const fetchDoctorPatients = () => doctorRequest('/doctor/patients');

export const fetchPatientFullRecord = (patientId) => doctorRequest(`/doctor/patient/${patientId}`);

export const fetchDoctorAppointments = () => doctorRequest('/doctor/appointments');

export const updateDoctorAppointment = (id, payload) =>
  doctorRequest(`/doctor/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
