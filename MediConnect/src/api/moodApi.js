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

// POST /api/mood
export function createMoodEntry(payload) {
  return request('/mood', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /api/mood?timeframe=7d|30d|90d|all
export function fetchMoodEntries(timeframe = '7d') {
  return request(`/mood?timeframe=${timeframe}`);
}

// GET /api/mood/analytics?timeframe=7d|30d|90d
export function fetchMoodAnalytics(timeframe = '7d') {
  return request(`/mood/analytics?timeframe=${timeframe}`);
}

// DELETE /api/mood/:id
export function deleteMoodEntry(id) {
  return request(`/mood/${id}`, {
    method: 'DELETE',
  });
}
