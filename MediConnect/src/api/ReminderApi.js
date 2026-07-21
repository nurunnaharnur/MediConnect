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

// GET /api/reminders
export function fetchReminders() {
  return request('/reminders');
}

// POST /api/reminders
export function createReminder({ name, dosage, time, frequency, endDate }) {
  return request('/reminders', {
    method: 'POST',
    body: JSON.stringify({ name, dosage, time, frequency, endDate }),
  });
}

// PATCH /api/reminders/:id/status
export function updateReminderStatus(id, status) {
  return request(`/reminders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}