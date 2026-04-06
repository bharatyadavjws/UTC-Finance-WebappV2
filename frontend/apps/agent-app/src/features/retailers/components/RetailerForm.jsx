import React, { useState } from 'react'
import { retailerInitialValues } from '../utils/retailerInitialValues'
import { validateRetailerForm } from '../utils/validateRetailerForm'

function RetailerForm({ initialValues = retailerInitialValues, onSubmit, submitLabel = 'Save Retailer' }) {
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const validationErrors = validateRetailerForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    onSubmit(form)
  }

  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null
    return <p className="field-error">{errors[fieldName]}</p>
  }

  return (
    <form className="retailer-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="shopName">Shop Name</label>
        <input id="shopName" name="shopName" value={form.shopName} onChange={handleChange} />
        {renderFieldError('shopName')}
      </div>

      <div className="form-group">
        <label htmlFor="ownerName">Owner Name</label>
        <input id="ownerName" name="ownerName" value={form.ownerName} onChange={handleChange} />
        {renderFieldError('ownerName')}
      </div>

      <div className="form-group">
        <label htmlFor="mobile">Mobile Number</label>
        <input id="mobile" name="mobile" value={form.mobile} onChange={handleChange} />
        {renderFieldError('mobile')}
      </div>

      <div className="form-group">
        <label htmlFor="alternateMobile">Alternate Mobile</label>
        <input
          id="alternateMobile"
          name="alternateMobile"
          value={form.alternateMobile}
          onChange={handleChange}
        />
        {renderFieldError('alternateMobile')}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" value={form.email} onChange={handleChange} />
        {renderFieldError('email')}
      </div>

      <div className="form-group">
        <label htmlFor="gstNumber">GST Number</label>
        <input id="gstNumber" name="gstNumber" value={form.gstNumber} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label htmlFor="panNumber">PAN Number</label>
        <input id="panNumber" name="panNumber" value={form.panNumber} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label htmlFor="addressLine1">Address Line 1</label>
        <input
          id="addressLine1"
          name="addressLine1"
          value={form.addressLine1}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="addressLine2">Address Line 2</label>
        <input
          id="addressLine2"
          name="addressLine2"
          value={form.addressLine2}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="city">City</label>
        <input id="city" name="city" value={form.city} onChange={handleChange} />
        {renderFieldError('city')}
      </div>

      <div className="form-group">
        <label htmlFor="state">State</label>
        <input id="state" name="state" value={form.state} onChange={handleChange} />
        {renderFieldError('state')}
      </div>

      <div className="form-group">
        <label htmlFor="pincode">Pincode</label>
        <input id="pincode" name="pincode" value={form.pincode} onChange={handleChange} />
        {renderFieldError('pincode')}
      </div>

      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  )
}

export default RetailerForm