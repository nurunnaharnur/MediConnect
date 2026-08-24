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

// GET /api/pcos/profile
export function fetchPcosProfile() {
  return request('/pcos/profile');
}

// PUT /api/pcos/profile
export function savePcosProfile(payload) {
  return request('/pcos/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// GET /api/pcos/screening
export function fetchPcosScreening() {
  return request('/pcos/screening');
}