// src/services/authService.js

const TOKEN_KEY = 'utc_crm_token';
const USER_KEY  = 'utc_crm_user';

export const authService = {

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },

  getRole() {
    return this.getUser()?.role ?? null;
  },

  async login(email, password) {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  
    const json = await response.json();
  
    if (!response.ok) {
      throw new Error(json.message || 'Login failed');
    }
  
    // ✅ Laravel wraps response in `data`
    const data = json.data;
  
    this.setToken(data.token);
    this.setUser(data.user);
  
    return data;
  },
  
  logout() {
    this.removeToken();
    window.location.href = '/login';
  },
};