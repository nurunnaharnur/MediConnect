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

// GET /api/cycles
export function fetchCycles() {
  return request('/cycles');
}

// POST /api/cycles
export function createCycle(payload) {
  return request('/cycles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// PUT /api/cycles/:id
export function updateCycle(id, payload) {
  return request(`/cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// DELETE /api/cycles/:id
export function deleteCycle(id) {
  return request(`/cycles/${id}`, {
    method: 'DELETE',
  });
}

// GET /api/cycles/prediction
export function fetchCyclePrediction() {
  return request('/cycles/prediction');
}