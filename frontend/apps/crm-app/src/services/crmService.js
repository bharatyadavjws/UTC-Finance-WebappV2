import { authService } from './authService';

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const token = authService.getToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  const data = await response.json();
  if (response.status === 401) {
    authService.removeToken();
    window.location.href = '/login';
    throw new Error('Session expired.');
  }
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const crmService = {

  async getCommissions() {
    const res = await fetch(`${API_BASE}/crm/commissions`, {
      method: 'GET', headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async markCommissionPaid(id) {
    const res = await fetch(`${API_BASE}/crm/commissions/${id}/mark-paid`, {
      method: 'POST', headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getApprovedLoans() {
    const res = await fetch(`${API_BASE}/crm/loans?status=approved`, {
      method: 'GET', headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async disburseLoan(id) {
    const res = await fetch(`${API_BASE}/crm/loans/${id}/disburse`, {
      method: 'POST', headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
