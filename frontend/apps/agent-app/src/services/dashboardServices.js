import { authService } from './authService';

const API_BASE = 'https://usethecred.com/api';

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
