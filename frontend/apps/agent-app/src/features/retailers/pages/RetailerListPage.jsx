import React, { useEffect, useState } from 'react';
import { RetailerProvider, useRetailers } from '../providers/RetailerProvider';

const initialForm = {
  shop_name: '',
  owner_name: '',
  mobile: '',
  alternate_mobile: '',
  email: '',
  gst_number: '',
  pan_number: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  pincode: '',
};

function validateForm(form) {
  const errors = {};
  if (!form.shop_name.trim()) errors.shop_name = 'Shop name is required';
  if (!form.owner_name.trim()) errors.owner_name = 'Owner name is required';
  if (!form.mobile.trim()) errors.mobile = 'Mobile is required';
  else if (!/^\d{10}$/.test(form.mobile)) errors.mobile = 'Mobile must be 10 digits';
  if (form.alternate_mobile && !/^\d{10}$/.test(form.alternate_mobile))
    errors.alternate_mobile = 'Alternate mobile must be 10 digits';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.state.trim()) errors.state = 'State is required';
  if (!form.pincode.trim()) errors.pincode = 'Pincode is required';
  else if (!/^\d{6}$/.test(form.pincode)) errors.pincode = 'Pincode must be 6 digits';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
  return errors;
}

function FieldError({ error }) {
  if (!error) return null;
  return <div style={{ color: '#c62828', fontSize: '12px', marginTop: '4px' }}>{error}</div>;
}

function LabeledInput({ label, name, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder || label}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
      <FieldError error={error} />
    </div>
  );
}

function RetailerListContent() {
  const { submitting, error, fetchRetailers, createRetailer } = useRetailers();
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => { fetchRetailers(); }, [fetchRetailers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await createRetailer(form);
      setMessage('Retailer added successfully!');
      setForm(initialForm);
      setFormErrors({});
    } catch (err) {}
  };

  return (
    <div style={{ padding: '100px 16px 120px', background: '#f5f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>Add Retailer</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Onboard a new retailer to the platform</p>

        {error && (
          <div style={{ background: '#fdecea', color: '#b71c1c', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #f5c2c7' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ background: '#e8f5e9', color: '#1b5e20', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #c8e6c9' }}>
            {message}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <LabeledInput label="Shop Name *" name="shop_name" value={form.shop_name} onChange={handleChange} error={formErrors.shop_name} />
            <LabeledInput label="Owner Name *" name="owner_name" value={form.owner_name} onChange={handleChange} error={formErrors.owner_name} />
            <LabeledInput label="Mobile Number *" name="mobile" value={form.mobile} onChange={handleChange} error={formErrors.mobile} type="tel" />
            <LabeledInput label="Alternate Mobile" name="alternate_mobile" value={form.alternate_mobile} onChange={handleChange} error={formErrors.alternate_mobile} type="tel" />
            <LabeledInput label="Email Address" name="email" value={form.email} onChange={handleChange} error={formErrors.email} type="email" />
            <LabeledInput label="GST Number" name="gst_number" value={form.gst_number} onChange={handleChange} />
            <LabeledInput label="PAN Number" name="pan_number" value={form.pan_number} onChange={handleChange} />
            <LabeledInput label="Address Line 1" name="address_line_1" value={form.address_line_1} onChange={handleChange} />
            <LabeledInput label="Address Line 2" name="address_line_2" value={form.address_line_2} onChange={handleChange} />
            <LabeledInput label="City *" name="city" value={form.city} onChange={handleChange} error={formErrors.city} />
            <LabeledInput label="State *" name="state" value={form.state} onChange={handleChange} error={formErrors.state} />
            <LabeledInput label="Pincode *" name="pincode" value={form.pincode} onChange={handleChange} error={formErrors.pincode} type="tel" />

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                width: '100%',
                marginTop: '8px',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Saving...' : 'Add Retailer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
};

export default function RetailerListPage() {
  return (
    <RetailerProvider>
      <RetailerListContent />
    </RetailerProvider>
  );
}
