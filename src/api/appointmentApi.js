import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
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
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

// GET /api/appointments
export function fetchAppointments() {
  return request('/appointments');
}

// POST /api/appointments
export function bookAppointment({ doctorName, department, date, time, reason }) {
  return request('/appointments', {
    method: 'POST',
    body: JSON.stringify({ doctorName, department, date, time, reason }),
  });
}

// PUT /api/appointments/:id/reschedule
export function rescheduleAppointment(id, { date, time }) {
  return request(`/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ date, time }),
  });
}

// PUT /api/appointments/:id/cancel
export function cancelAppointment(id) {
  return request(`/appointments/${id}/cancel`, {
    method: 'PUT',
  });
}