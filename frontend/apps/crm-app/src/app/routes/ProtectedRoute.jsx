import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasAnyPermission } from '@utc/permissions'
import { useAuth } from '../providers/AuthProvider'

function ProtectedRoute({ requiredPermissions = [] }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

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