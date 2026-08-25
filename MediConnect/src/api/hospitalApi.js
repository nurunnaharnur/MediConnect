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

// GET /api/hospitals/nearby
export function fetchNearbyHospitals({ lat, lng, maxDistanceKm, specialty, minRating }) {
  const params = new URLSearchParams({ lat, lng });
  if (maxDistanceKm) params.set('maxDistanceKm', maxDistanceKm);
  if (specialty) params.set('specialty', specialty);
  if (minRating) params.set('minRating', minRating);
  return request(`/hospitals/nearby?${params.toString()}`);
}

// GET /api/hospitals/:id
export function fetchHospitalById(id) {
  return request(`/hospitals/${id}`);
}
