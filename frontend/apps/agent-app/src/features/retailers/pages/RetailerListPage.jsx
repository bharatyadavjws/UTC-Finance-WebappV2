import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetailerProvider, useRetailers } from '../providers/RetailerProvider'
import RetailerCard from '../components/RetailerCard'

function RetailerListContent() {
  const { retailers, loading, error, fetchRetailers } = useRetailers()
  const navigate = useNavigate()

  useEffect(() => { fetchRetailers() }, [fetchRetailers])

  if (loading) return <div className="page-section"><p className="muted-text">Loading retailers...</p></div>
  if (error)   return <div className="page-section"><p className="error-text">{error}</p></div>

  return (
    <section className="page-section">
      <div style={{ marginBottom: '20px' }}>
        <h2 className="page-title">My Retailers</h2>
        <p className="muted-text">Retailers assigned to you by UTC Team.</p>
      </div>
      {retailers.length === 0 ? (
        <div className="info-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="muted-text">No retailers assigned to you yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {retailers.map(retailer => (
            <RetailerCard
              key={retailer.id}
              retailer={retailer}
              onClick={() => navigate(`/retailers/${retailer.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function RetailerListPage() {
  return (
    <RetailerProvider>
      <RetailerListContent />
    </RetailerProvider>
  )
}
