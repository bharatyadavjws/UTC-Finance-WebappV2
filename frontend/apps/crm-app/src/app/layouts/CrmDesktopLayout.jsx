import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { CRM_MENU_ACCESS, hasAnyPermission } from '@utc/permissions'
import { useAuth } from '../providers/AuthProvider'

const navItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'retailers', label: 'Retailers', path: '/retailers' },
  { key: 'loans', label: 'Loans', path: '/loans' },
  { key: 'users', label: 'Users', path: '/users' },
]

function CrmDesktopLayout() {
  const { user, logout } = useAuth()

  const filteredNavItems = navItems.filter((item) =>
    hasAnyPermission(user?.role, CRM_MENU_ACCESS[item.key] || [])
  )

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <div className="crm-sidebar__brand">
          <div className="crm-sidebar__eyebrow">UTC Finance</div>
          <h1 className="crm-sidebar__title">CRM App</h1>
          <p className="crm-sidebar__subtext">
            {user?.name} · {user?.role}
          </p>
        </div>

        <nav className="crm-sidebar__nav">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `crm-sidebar__link ${isActive ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout-button" onClick={logout}>
          Logout
        </button>
      </aside>

      <div className="crm-main">
        <header className="crm-topbar">
          <strong>Desktop CRM</strong>
        </header>

        <main className="crm-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CrmDesktopLayout