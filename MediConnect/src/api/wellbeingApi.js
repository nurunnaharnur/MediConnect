import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

// POST /api/wellbeing/checkin
export function submitCheckin(payload) {
  return request('/wellbeing/checkin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /api/wellbeing/history?type=depression|anxiety|ocd
export function fetchCheckinHistory(type = '') {
  const query = type ? `?type=${type}` : '';
  return request(`/wellbeing/history${query}`);
}

// GET /api/wellbeing/analytics
export function fetchCheckinAnalytics() {
  return request('/wellbeing/analytics');
}
