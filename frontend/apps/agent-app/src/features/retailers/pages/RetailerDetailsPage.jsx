import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { retailerRepository } from '../services/retailerRepository'

export default function RetailerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [retailer, setRetailer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('Retailer ID is missing')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    retailerRepository.getById(id)
      .then(setRetailer)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page-section">
        <p className="muted-text">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-section">
        <p className="error-text">{error}</p>
      </div>
    )
  }

  if (!retailer) {
    return (
      <div className="page-section">
        <p className="muted-text">Retailer not found.</p>
      </div>
    )
  }

  const handleStartLoan = () => {
    navigate(`/loans/create?retailer_id=${retailer.id}`)
  }

  return (
    <section className="page-section">
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#2563eb',
          fontWeight: '600',
          fontSize: '14px'
        }}
      >
        ← Back
      </button>

      <div className="info-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}
        >
          <div>
            <h2 className="page-title">{retailer.shop_name}</h2>
            <p className="muted-text" style={{ marginBottom: '0' }}>
              {retailer.retailer_code}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartLoan}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Start Loan
          </button>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <Row label="Owner" value={retailer.owner_name} />
          <Row label="Mobile" value={retailer.mobile} />
          <Row label="Alt Mobile" value={retailer.alternate_mobile} />
          <Row label="Email" value={retailer.email} />
          <Row label="GST Number" value={retailer.gst_number} />
          <Row label="PAN Number" value={retailer.pan_number} />
          <Row
            label="Address"
            value={[retailer.address_line_1, retailer.address_line_2].filter(Boolean).join(', ')}
          />
          <Row label="City" value={retailer.city} />
          <Row label="State" value={retailer.state} />
          <Row label="Pincode" value={retailer.pincode} />
          <Row label="Status" value={retailer.status} />
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '8px',
        gap: '16px'
      }}
    >
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  )
}