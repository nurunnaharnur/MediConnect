import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function hospitalRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot reach the MediConnect server on port 5001. Check connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Hospital request failed.');
  }
  return data;
}

export const fetchNearbyHospitals = ({ lat, lng, maxDistanceKm = 10, specialty, minRating }) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    maxDistanceKm: String(maxDistanceKm),
  });
  if (specialty) params.append('specialty', specialty);
  if (minRating) params.append('minRating', String(minRating));

  return hospitalRequest(`/hospitals/nearby?${params.toString()}`);
};

export const fetchAllHospitals = ({ specialty, minRating } = {}) => {
  const params = new URLSearchParams();
  if (specialty) params.append('specialty', specialty);
  if (minRating) params.append('minRating', String(minRating));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return hospitalRequest(`/hospitals${qs}`);
};

export const fetchHospitalById = (id) =>
  hospitalRequest(`/hospitals/${id}`);
