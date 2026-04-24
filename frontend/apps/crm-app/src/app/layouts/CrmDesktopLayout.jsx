import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function CrmDesktopLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menu = [
    { label: 'Dashboard',          path: '/dashboard',        roles: ['utc_team', 'investor'] },
    { label: 'Loan Book',          path: '/loans',            roles: ['utc_team'] },
    { label: 'Retailers',          path: '/retailers',        roles: ['utc_team'] },
    { label: 'Agents',             path: '/users',            roles: ['utc_team'] },
    { label: 'EMI Book',           path: '/emis',             roles: ['utc_team'] },
    { label: 'Disbursements',      path: '/disbursements',    roles: ['utc_team'] },
    { label: 'Commission Tracker', path: '/crm/commissions',  roles: ['utc_team'] },
    { label: 'Disbursement Panel', path: '/crm/disbursement', roles: ['utc_team'] },
    { label: 'Investor View', path: '/investor', roles: ['utc_team', 'investor'] },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={sidebarStyle}>
        <div style={{ padding: '32px 24px', fontWeight: '800', fontSize: '22px' }}>UTC <span style={{ color: '#2563eb' }}>CRM</span></div>
        <nav style={{ flex: 1 }}>
          {menu.filter(m => user?.role && m.roles.includes(user.role)).map(item => (
            <Link key={item.path} to={item.path} style={navItemStyle(location.pathname === item.path)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>{user?.role?.toUpperCase()}</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>{user?.name}</div>
          <button onClick={logout} style={logoutBtn}>Sign Out</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}><Outlet /></main>
    </div>
  );
}

const sidebarStyle = { width: '260px', background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' };
const navItemStyle = (active) => ({
  display: 'block', padding: '14px 24px', textDecoration: 'none',
  color: active ? '#2563eb' : '#475569', background: active ? '#f1f5f9' : 'transparent',
  fontWeight: active ? '600' : '500', borderRight: active ? '3px solid #2563eb' : 'none'
});
const logoutBtn = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600', padding: 0 };
