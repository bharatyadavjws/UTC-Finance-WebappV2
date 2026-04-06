import React from 'react'

function DashboardPage() {
  return (
    <section className="page-section">
      <h2 className="page-title">Dashboard</h2>
      <div className="crm-card-grid">
        <div className="crm-card">
          <span className="crm-card__label">Total Loans</span>
          <strong className="crm-card__value">0</strong>
        </div>
        <div className="crm-card">
          <span className="crm-card__label">Active Retailers</span>
          <strong className="crm-card__value">0</strong>
        </div>
        <div className="crm-card">
          <span className="crm-card__label">Pending Disbursements</span>
          <strong className="crm-card__value">0</strong>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage