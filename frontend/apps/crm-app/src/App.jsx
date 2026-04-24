// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/providers/AuthProvider';

import CrmDesktopLayout from './app/layouts/CrmDesktopLayout';
import LoginPage        from './features/auth/pages/LoginPage';
import DashboardPage    from './features/dashboard/pages/DashboardPage';
import LoanListPage     from './features/loans/pages/LoanListPage';
import RetailerListPage  from './features/retailers/pages/RetailerListPage';
import UserListPage      from './features/users/pages/UserListPage';
import LoanDetailPage from './features/loans/pages/LoanDetailPage';
import EmiBookPage from './features/emis/pages/EmiBookPage';
import DisbursementPage from './features/disbursements/pages/DisbursementPage';
import CommissionTrackerPage from "./pages/crm/CommissionTrackerPage";
import DisbursementPanelPage from "./pages/crm/DisbursementPanelPage";
import InvestorDashboardPage from './features/dashboard/pages/InvestorDashboardPage';

// inside protected routes:
<Route path="/disbursements" element={<DisbursementPage />} />

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with Sidebar Layout */}
          <Route element={<ProtectedRoute><CrmDesktopLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/loans" element={<LoanListPage />} />
            <Route path="/retailers" element={<RetailerListPage />} />
            <Route path="/users" element={<UserListPage />} />
            <Route path="/loans/:loanCode" element={<LoanDetailPage />} />
            <Route path="/emis" element={<EmiBookPage />} />
            {/* <Route path="/disbursements" element={<DisbursementPage />} /> */}
            <Route path="/crm/commissions" element={<CommissionTrackerPage />} />
            <Route path="/crm/disbursement" element={<DisbursementPanelPage />} />
            <Route path="/investor" element={<InvestorDashboardPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}