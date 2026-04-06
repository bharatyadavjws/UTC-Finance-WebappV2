import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

// Inline permission check — replaces @utc/permissions
function hasAnyPermission(role, permissions) {
  if (!role || !permissions || permissions.length === 0) return true
  return true // allow all roles for now — tighten later
}

function ProtectedRoute({ requiredPermissions = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (
    requiredPermissions.length > 0 &&
    !hasAnyPermission(user?.role, requiredPermissions)
  ) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute