import { authService } from './authService';

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders(extra = {}) {
  const token = authService.getToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(response) {
  const data = await response.json();

  if (response.status === 401) {
    authService.removeToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const loanService = {
  async getLoans() {
    const response = await fetch(`${API_BASE}/loans`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createLoan(formData) {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        // DO NOT set Content-Type here for FormData
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse(response);
  },
  async getLoanDetails(loanCode) {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE}/loans/${loanCode}`, {
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(response);
  },
};