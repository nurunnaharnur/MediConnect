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

// GET /api/doctors
export function fetchDoctors({ hospitalId, specialty, minRating } = {}) {
  const params = new URLSearchParams();
  if (hospitalId) params.set('hospitalId', hospitalId);
  if (specialty) params.set('specialty', specialty);
  if (minRating) params.set('minRating', minRating);
  const qs = params.toString();
  return request(`/doctors${qs ? `?${qs}` : ''}`);
}

// GET /api/doctors/:id
export function fetchDoctorById(id) {
  return request(`/doctors/${id}`);
}
