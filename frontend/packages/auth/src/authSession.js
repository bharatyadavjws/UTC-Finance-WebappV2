import {
    clearStoredSession,
    getStoredAuthToken,
    getStoredAuthUser,
    setStoredAuthToken,
    setStoredAuthUser,
  } from './authStorage'
  
  export function createSession({ user, token }) {
    setStoredAuthUser(user)
    setStoredAuthToken(token)
  
    return {
      user,
      token,
    }
  }
  
  export function getSession() {
    return {
      user: getStoredAuthUser(),
      token: getStoredAuthToken(),
    }
  }
  
  export function destroySession() {
    clearStoredSession()
  }