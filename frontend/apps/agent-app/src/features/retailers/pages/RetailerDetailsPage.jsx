import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRetailers } from '../providers/RetailerProvider'

function RetailerDetailsPage() {
  const { retailerId } = useParams()
  const { getRetailerById } = useRetailers()
  const retailer = getRetailerById(retailerId)

  if (!retailer) {
    return (
      <section className="page-section">
        <h2 className="page-title">Retailer not found</h2>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">{retailer.shopName}</h2>
          <p className="muted-text">{retailer.ownerName}</p>
        </div>

        <Link to={`/retailers/${retailer.id}/edit`} className="primary-button primary-button--link">
          Edit
        </Link>
      </div>

      <div className="info-card">
        <span className="info-card__label">Mobile</span>
        <strong>{retailer.mobile}</strong>
      </div>

      <div className="info-card">
        <span className="info-card__label">Alternate Mobile</span>
        <strong>{retailer.alternateMobile || '-'}</strong>
      </div>

      <div className="info-card">
        <span className="info-card__label">Email</span>
        <strong>{retailer.email || '-'}</strong>
      </div>

      <div className="info-card">
        <span className="info-card__label">PAN Number</span>
        <strong>{retailer.panNumber || '-'}</strong>
      </div>

      <div className="info-card">
        <span className="info-card__label">GST Number</span>
        <strong>{retailer.gstNumber || '-'}</strong>
      </div>

      <div className="info-card">
        <span className="info-card__label">Address</span>
        <strong>
          {[retailer.addressLine1, retailer.addressLine2, retailer.city, retailer.state, retailer.pincode]
            .filter(Boolean)
            .join(', ') || '-'}
        </strong>
      </div>

      <div className="info-card">
        <span className="info-card__label">Status</span>
        <strong>{retailer.status}</strong>
      </div>
    </section>
  )
}

export default RetailerDetailsPage