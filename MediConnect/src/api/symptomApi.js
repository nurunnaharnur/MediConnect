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

// GET /api/symptom-check/options
export function fetchSymptomOptions() {
  return request('/symptom-check/options');
}

// POST /api/symptom-check
export function submitSymptomCheck(symptoms) {
  return request('/symptom-check', {
    method: 'POST',
    body: JSON.stringify({ symptoms }),
  });
}

// GET /api/symptom-check
export function fetchSymptomHistory() {
  return request('/symptom-check');
}
