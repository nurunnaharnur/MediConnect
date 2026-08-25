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

// GET /api/appointments
export const fetchAppointments = () => appointmentRequest('/appointments');
export const fetchPatientAppointments = fetchAppointments;

// POST /api/appointments
export const bookAppointment = (payload) =>
  appointmentRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// PUT /api/appointments/:id/reschedule
export const rescheduleAppointment = (id, { date, time }) =>
  appointmentRequest(`/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ date, time }),
  });

// PATCH / PUT /api/appointments/:id/cancel
export const cancelAppointment = (id) =>
  appointmentRequest(`/appointments/${id}/cancel`, {
    method: 'PATCH',
  });

// GET /api/appointments/doctors
export const fetchAvailableDoctors = () => appointmentRequest('/appointments/doctors');
