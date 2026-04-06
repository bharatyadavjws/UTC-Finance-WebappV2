const API_BASE = 'http://127.0.0.1:8000/api';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(
        json.message || json.errors?.email?.[0] || 'Login failed'
      );
    }
    return json.data;
  },

  async logout(token) {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async me(token) {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    if (!response.ok) throw new Error('Session expired');
    return json.data;
  },

  saveToken(token) {
    localStorage.setItem('utc_agent_token', token);
  },

  getToken() {
    return localStorage.getItem('utc_agent_token');
  },

  removeToken() {
    localStorage.removeItem('utc_agent_token');
  },
};