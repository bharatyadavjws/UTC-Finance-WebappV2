import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PERMISSIONS } from '@utc/permissions'
import CrmDesktopLayout from './app/layouts/CrmDesktopLayout'
import ProtectedRoute from './app/routes/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import UnauthorizedPage from './features/auth/pages/UnauthorizedPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import RetailerListPage from './features/retailers/pages/RetailerListPage'
import LoanListPage from './features/loans/pages/LoanListPage'
import UserListPage from './features/users/pages/UserListPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        element={
          <ProtectedRoute
            requiredPermissions={[PERMISSIONS.VIEW_CRM_DASHBOARD]}
          />
        }
      >
        <Route path="/" element={<CrmDesktopLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="retailers" element={<RetailerListPage />} />
          <Route path="loans" element={<LoanListPage />} />
          <Route path="users" element={<UserListPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App