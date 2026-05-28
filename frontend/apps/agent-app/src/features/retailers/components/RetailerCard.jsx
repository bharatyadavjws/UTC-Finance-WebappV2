import React from 'react'
import { Link } from 'react-router-dom'

function RetailerCard({ retailer }) {
  return (
    <Link to={`/loans/create?retailer_id=${retailer.id}`} className="retailer-card">
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
  )
}

export default RetailerCard