import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
// import { PERMISSIONS } from '@utc/permissions'
import AgentMobileLayout from './app/layouts/AgentMobileLayout'
import ProtectedRoute from './app/routes/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import UnauthorizedPage from './features/auth/pages/UnauthorizedPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import RetailerListPage from './features/retailers/pages/RetailerListPage'
import AddRetailerPage from './features/retailers/pages/AddRetailerPage'
import RetailerDetailsPage from './features/retailers/pages/RetailerDetailsPage'
import EditRetailerPage from './features/retailers/pages/EditRetailerPage'
import LoanListPage from './features/loans/pages/LoanListPage'
import EmiCalculatorPage from './features/emi-calculator/pages/EmiCalculatorPage'
import LoanCreatePage from './features/loans/pages/LoanCreatePage'
import LoanDetailsPage from './features/loans/pages/LoanDetailsPage';
import EligibilityPage from './features/loans/pages/EligibilityPage';

const PERMISSIONS = {
    VIEW_AGENT_DASHBOARD: 'VIEW_AGENT_DASHBOARD',
  }

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="loans/:loanCode" element={<LoanDetailsPage />} />

      <Route
        element={
          <ProtectedRoute
            requiredPermissions={[PERMISSIONS.VIEW_AGENT_DASHBOARD]}
          />
        }
      >
        <Route path="/" element={<AgentMobileLayout />}>
        <Route path="eligibility" element={<EligibilityPage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="retailers" element={<RetailerListPage />} />
        <Route path="retailers/new" element={<AddRetailerPage />} />
        <Route path="retailers/:retailerId" element={<RetailerDetailsPage />} />
        <Route path="retailers/:retailerId/edit" element={<EditRetailerPage />} />
        <Route path="loans" element={<LoanListPage />} />
        <Route path="loans/create" element={<LoanCreatePage />} />
        <Route path="emi-calculator" element={<EmiCalculatorPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App