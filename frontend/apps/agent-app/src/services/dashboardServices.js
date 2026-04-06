import { authService } from './authService';

const API_BASE = 'http://127.0.0.1:8000/api';

export const dashboardService = {
  async getStats() {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to fetch stats');
    return json.data;
  },
};
