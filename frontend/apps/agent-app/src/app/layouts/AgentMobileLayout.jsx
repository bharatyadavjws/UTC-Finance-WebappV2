import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AGENT_MENU_ACCESS, hasAnyPermission } from '@utc/permissions'
import { useAuth } from '../providers/AuthProvider'

const navItems = [
    { key: 'dashboard', label: 'Home', path: '/dashboard' },
    { key: 'retailers', label: 'Retailers', path: '/retailers' },
    { key: 'eligibility', label: 'Check', path: '/eligibility' }, // 👈 Added this
    { key: 'loans', label: 'Loans', path: '/loans' },
    { key: 'emiCalculator', label: 'EMI', path: '/emi-calculator' },
  ]

function AgentMobileLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const filteredNavItems = navItems.filter((item) =>
    hasAnyPermission(user?.role, AGENT_MENU_ACCESS[item.key] || [])
  )

  return (
    <div className="agent-shell">
      <header className="agent-header">
        <div>
          <div className="agent-header__eyebrow">UTC Finance</div>
          <h1 className="agent-header__title">Agent App</h1>
          <p className="agent-header__subtext">
            {user?.name} · {user?.userId}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '13px',
          }}
        >
          Logout
        </button>
      </header>

      <main className="agent-content">
        <Outlet />
      </main>

      <nav className="agent-bottom-nav">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `agent-bottom-nav__item ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default AgentMobileLayout