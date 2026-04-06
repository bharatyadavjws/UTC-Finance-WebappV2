import { ROLE_PERMISSIONS } from './permissions'

export function getPermissionsByRole(role) {
  return ROLE_PERMISSIONS[role] || []
}

export function hasPermission(role, permission) {
  const permissions = getPermissionsByRole(role)
  return permissions.includes(permission)
}

export function hasAnyPermission(role, permissionList = []) {
  const permissions = getPermissionsByRole(role)
  return permissionList.some((permission) => permissions.includes(permission))
}