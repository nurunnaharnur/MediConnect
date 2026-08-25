import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function appointmentRequest(path, options = {}) {
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
    throw new Error(data.message || 'Appointment request failed.');
  }

  return data;
}

// POST /api/appointments
export const bookAppointment = (payload) =>
  appointmentRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// GET /api/appointments
export const fetchPatientAppointments = () => appointmentRequest('/appointments');

// GET /api/appointments/doctors
export const fetchAvailableDoctors = () => appointmentRequest('/appointments/doctors');

// PATCH /api/appointments/:id/cancel
export const cancelAppointment = (id) =>
  appointmentRequest(`/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
