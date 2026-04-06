import React from 'react'
import { Link } from 'react-router-dom'

function UnauthorizedPage() {
  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--crm">
        <h1 className="auth-card__title">Unauthorized</h1>
        <p className="auth-card__text">You do not have access to this page.</p>
        <Link className="primary-button primary-button--link" to="/dashboard">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}

export default UnauthorizedPage