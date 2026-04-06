import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'

function LoginPage() {
  const { loginAsUtcTeam, loginAsInvestor } = useAuth()
  const navigate = useNavigate()

  const handleUtcLogin = () => {
    loginAsUtcTeam()
    navigate('/dashboard')
  }

  const handleInvestorLogin = () => {
    loginAsInvestor()
    navigate('/dashboard')
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--crm">
        <div className="auth-card__eyebrow">UTC Finance</div>
        <h1 className="auth-card__title">CRM Login</h1>
        <p className="auth-card__text">Choose a role for mock access.</p>

        <div className="auth-actions">
          <button className="primary-button" onClick={handleUtcLogin}>
            Login as UTC Team
          </button>
          <button className="secondary-button" onClick={handleInvestorLogin}>
            Login as Investor
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage