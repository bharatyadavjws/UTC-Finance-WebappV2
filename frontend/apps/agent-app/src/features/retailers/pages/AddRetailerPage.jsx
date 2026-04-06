import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RetailerForm from '../components/RetailerForm'
import { useRetailers } from '../providers/RetailerProvider'

function AddRetailerPage() {
  const navigate = useNavigate()
  const { addRetailer } = useRetailers()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      setSubmitError('')
      const newRetailer = await addRetailer(values)
      navigate(`/retailers/${newRetailer.id}`)
    } catch (err) {
      setSubmitError(err?.message || 'Failed to create retailer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section">
      <h2 className="page-title">Add Retailer</h2>
      <p className="muted-text">Create a new retailer profile for agent onboarding.</p>

      <div className="info-card">
        {submitError ? <p className="error-text">{submitError}</p> : null}
        <RetailerForm
          onSubmit={handleSubmit}
          submitLabel={submitting ? 'Saving...' : 'Create Retailer'}
        />
      </div>
    </section>
  )
}

export default AddRetailerPage