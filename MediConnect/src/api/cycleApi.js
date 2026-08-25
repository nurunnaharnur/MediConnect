import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function cycleRequest(path, options = {}) {
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
    throw new Error(data.message || 'Cycle Tracker API request failed.');
  }

  return data;
}

// GET /api/cycle
export const fetchCycleData = () => cycleRequest('/cycle');

// PUT /api/cycle/settings
export const updateCycleSettings = (payload) =>
  cycleRequest('/cycle/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

// POST /api/cycle/log
export const logDailyCycleSymptom = (payload) =>
  cycleRequest('/cycle/log', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
