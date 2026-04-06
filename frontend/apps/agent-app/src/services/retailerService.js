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

export const retailerService = {
  async getRetailers() {
    const response = await fetch(`${API_BASE}/retailers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getRetailerByCode(retailerCode) {
    const response = await fetch(`${API_BASE}/retailers/${retailerCode}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createRetailer(payload) {
    const response = await fetch(`${API_BASE}/retailers`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async updateRetailer(retailerCode, payload) {
    const response = await fetch(`${API_BASE}/retailers/${retailerCode}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async updateRetailerStatus(retailerCode, status) {
    const response = await fetch(`${API_BASE}/retailers/${retailerCode}/status`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};