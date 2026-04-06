let authUser = null
let authToken = null

export function setStoredAuthUser(user) {
  authUser = user
}

export function getStoredAuthUser() {
  return authUser
}

export function clearStoredAuthUser() {
  authUser = null
}

export function setStoredAuthToken(token) {
  authToken = token
}

export function getStoredAuthToken() {
  return authToken
}

export function clearStoredAuthToken() {
  authToken = null
}

export function clearStoredSession() {
  authUser = null
  authToken = null
}