import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

function RetailerCard({ retailer }) {
  const navigate = useNavigate()

  return (
    <div className="retailer-card">
      <Link to={`/retailers/${retailer.id}`} className="retailer-card__body">
        <div className="retailer-card__top">
          <div>
            <h3 className="retailer-card__title">{retailer.shop_name}</h3>
            <p className="retailer-card__subtitle">{retailer.owner_name}</p>
          </div>

          <span className={`status-badge status-badge--${retailer.status.toLowerCase()}`}>
            {retailer.status}
          </span>
        </div>

        <div className="retailer-card__meta">
          <span>{retailer.mobile}</span>
          <span>{retailer.city}, {retailer.state}</span>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => navigate('/loans/create', { state: { retailer } })}
      >
        Start Loan
      </button>
    </div>
  )
}

export default RetailerCard