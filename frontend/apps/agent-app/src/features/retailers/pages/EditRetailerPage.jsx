import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RetailerForm from '../components/RetailerForm'
import { useRetailers } from '../providers/RetailerProvider'

function EditRetailerPage() {
  const navigate = useNavigate()
  const { retailerId } = useParams()
  const { getRetailerById, updateRetailer } = useRetailers()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const retailer = getRetailerById(retailerId)

  if (!retailer) {
    return (
      <section className="page-section">
        <h2 className="page-title">Retailer not found</h2>
      </section>
    )
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      setSubmitError('')
      await updateRetailer(retailerId, values)
      navigate(`/retailers/${retailerId}`)
    } catch (err) {
      setSubmitError(err?.message || 'Failed to update retailer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section">
      <h2 className="page-title">Edit Retailer</h2>
      <p className="muted-text">Update retailer profile details.</p>

      <div className="info-card">
        {submitError ? <p className="error-text">{submitError}</p> : null}
        <RetailerForm
          initialValues={retailer}
          onSubmit={handleSubmit}
          submitLabel={submitting ? 'Updating...' : 'Update Retailer'}
        />
      </div>
    </section>
  )
}

export default EditRetailerPage