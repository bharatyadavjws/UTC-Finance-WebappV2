export function normalizeUser(user = {}) {
    return {
      userId: user.userId || '',
      name: user.name || '',
      role: user.role || '',
    }
  }
  
  export function isAuthenticated(user) {
    return !!user
  }
  
  export function hasRole(user, role) {
    return user?.role === role
  }
  
  export function hasAnyRole(user, roles = []) {
    return roles.includes(user?.role)
  }