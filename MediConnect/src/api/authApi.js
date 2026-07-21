// Talks to the /api/auth routes exposed by authRoutes.js / authController.js
// Set VITE_API_URL in your .env (e.g. VITE_API_URL=http://localhost:3000/api)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(endpoint, payload) {
  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // authController.js sends { message } on 400/401/500
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data; // { _id, name, email, token }
}

/**
 * @param {{ name: string, email: string, password: string, age?: number,
 *   gender?: string, height?: number, weight?: number, medicalHistory?: string }} payload
 */
export const registerUser = (payload) => request('/auth/register', payload);

/**
 * @param {{ email: string, password: string }} payload
 */
export const loginUser = (payload) => request('/auth/login', payload);

// Small helpers for storing the session once auth succeeds
export const saveSession = (data) => {
  localStorage.setItem('mc_token', data.token);
  localStorage.setItem(
    'mc_user',
    JSON.stringify({ _id: data._id, name: data.name, email: data.email })
  );
};

export const getToken = () => localStorage.getItem('mc_token');
export const clearSession = () => {
  localStorage.removeItem('mc_token');
  localStorage.removeItem('mc_user');
};
