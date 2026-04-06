import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function useViewport() {
  const getWidth = () => window.innerWidth;

  const [width, setWidth] = useState(getWidth());

  useEffect(() => {
    const handleResize = () => setWidth(getWidth());
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

function validateForm(form) {
  const errors = {};

  if (!form.shop_name.trim()) errors.shop_name = 'Shop name is required';
  if (!form.owner_name.trim()) errors.owner_name = 'Owner name is required';
  if (!form.mobile.trim()) errors.mobile = 'Mobile is required';
  else if (!/^\d{10}$/.test(form.mobile)) errors.mobile = 'Mobile must be 10 digits';

  if (form.alternate_mobile && !/^\d{10}$/.test(form.alternate_mobile)) {
    errors.alternate_mobile = 'Alternate mobile must be 10 digits';
  }

  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.state.trim()) errors.state = 'State is required';
  if (!form.pincode.trim()) errors.pincode = 'Pincode is required';
  else if (!/^\d{6}$/.test(form.pincode)) errors.pincode = 'Pincode must be 6 digits';

  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email';
  }

  return errors;
}

function FieldError({ error }) {
  if (!error) return null;

  return (
    <div style={{ color: '#c62828', fontSize: '12px', marginTop: '4px' }}>
      {error}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
        {value || '-'}
      </div>
    </div>
  );
}

function RetailerListContent() {
  const navigate = useNavigate();

  const {
    retailers,
    loading,
    submitting,
    error,
    fetchRetailers,
    createRetailer,
    updateRetailer,
    updateRetailerStatus,
  } = useRetailers();

  const { isMobile, isTablet } = useViewport();

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');
  const [editingRetailerId, setEditingRetailerId] = useState(null);

  useEffect(() => {
    fetchRetailers();
  }, [fetchRetailers]);

  const isEditMode = useMemo(() => !!editingRetailerId, [editingRetailerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingRetailerId(null);
  };

  const handleEdit = (retailer) => {
    setMessage('');
    setEditingRetailerId(retailer.id);
    setForm({
      shop_name: retailer.shop_name || '',
      owner_name: retailer.owner_name || '',
      mobile: retailer.mobile || '',
      alternate_mobile: retailer.alternate_mobile || '',
      email: retailer.email || '',
      gst_number: retailer.gst_number || '',
      pan_number: retailer.pan_number || '',
      address_line_1: retailer.address_line_1 || '',
      address_line_2: retailer.address_line_2 || '',
      city: retailer.city || '',
      state: retailer.state || '',
      pincode: retailer.pincode || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLoan = (retailer) => {
    navigate('/loans/create', {
      state: {
        retailer: {
          id: retailer.id,
          shop_name: retailer.shop_name,
          owner_name: retailer.owner_name,
          mobile: retailer.mobile,
          city: retailer.city,
          state: retailer.state,
          pincode: retailer.pincode,
          status: retailer.status,
        },
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      if (isEditMode) {
        await updateRetailer(editingRetailerId, form);
        setMessage('Retailer updated successfully');
      } else {
        await createRetailer(form);
        setMessage('Retailer created successfully');
      }

      resetForm();
    } catch (err) {}
  };

  const handleStatusToggle = async (retailer) => {
    const nextStatus = retailer.status === 'Blocked' ? 'Active' : 'Blocked';

    try {
      await updateRetailerStatus(retailer.id, nextStatus);
      setMessage(`Retailer status updated to ${nextStatus}`);
    } catch (err) {}
  };

  const pagePadding = isMobile ? '88px 16px 110px' : isTablet ? '96px 20px 110px' : '110px 32px 120px';
  const gridColumns = isMobile ? '1fr' : 'minmax(340px, 420px) minmax(0, 1fr)';
  const detailsColumns = isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))';
  const actionDirection = isMobile ? 'column' : 'row';
  const fullWidthButton = isMobile ? '100%' : 'auto';

  return (
    <div
      style={{
        padding: pagePadding,
        background: '#f5f7fb',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1
            style={{
              fontSize: isMobile ? '32px' : '42px',
              lineHeight: 1.1,
              marginBottom: '8px',
              color: '#111827',
              fontWeight: '800',
            }}
          >
            Retailers
          </h1>
          <p style={{ color: '#6b7280', fontSize: isMobile ? '14px' : '15px' }}>
            Manage retailer onboarding, updates, and active status.
          </p>
        </div>

        {loading && <p style={{ marginBottom: '14px' }}>Loading...</p>}

        {error && (
          <div
            style={{
              background: '#fdecea',
              color: '#b71c1c',
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1px solid #f5c2c7',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: '#e8f5e9',
              color: '#1b5e20',
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1px solid #c8e6c9',
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              border: '1px solid #dbe2ea',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              background: '#ffffff',
              position: isMobile ? 'static' : 'sticky',
              top: isMobile ? 'auto' : '96px',
            }}
          >
            <h2 style={{ fontSize: isMobile ? '24px' : '28px', marginBottom: '16px', color: '#111827' }}>
              {isEditMode ? 'Edit Retailer' : 'Add Retailer'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <input name="shop_name" placeholder="Shop Name" value={form.shop_name} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.shop_name} />
              </div>

              <div>
                <input name="owner_name" placeholder="Owner Name" value={form.owner_name} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.owner_name} />
              </div>

              <div>
                <input name="mobile" placeholder="Mobile" value={form.mobile} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.mobile} />
              </div>

              <div>
                <input name="alternate_mobile" placeholder="Alternate Mobile" value={form.alternate_mobile} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.alternate_mobile} />
              </div>

              <div>
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.email} />
              </div>

              <div>
                <input name="gst_number" placeholder="GST Number" value={form.gst_number} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <input name="pan_number" placeholder="PAN Number" value={form.pan_number} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <input name="address_line_1" placeholder="Address Line 1" value={form.address_line_1} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <input name="address_line_2" placeholder="Address Line 2" value={form.address_line_2} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <input name="city" placeholder="City" value={form.city} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.city} />
              </div>

              <div>
                <input name="state" placeholder="State" value={form.state} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.state} />
              </div>

              <div>
                <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} style={inputStyle} />
                <FieldError error={formErrors.pincode} />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: actionDirection,
                  gap: '10px',
                  marginTop: '8px',
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...primaryButtonStyle, width: fullWidthButton }}
                >
                  {submitting ? 'Saving...' : isEditMode ? 'Update Retailer' : 'Create Retailer'}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ ...secondaryButtonStyle, width: fullWidthButton }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div
            style={{
              border: '1px solid #dbe2ea',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <h2 style={{ fontSize: isMobile ? '24px' : '28px', color: '#111827' }}>
                Retailer List
              </h2>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Total: {retailers.length}
              </div>
            </div>

            {retailers.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  background: '#f9fafb',
                  border: '1px dashed #d1d5db',
                  color: '#6b7280',
                  textAlign: 'center',
                }}
              >
                No retailers found
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {retailers.map((retailer) => (
                  <div
                    key={retailer.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '14px',
                      padding: isMobile ? '14px' : '16px',
                      background: '#fafafa',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'flex-start',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {retailer.id}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '24px' : '30px',
                            fontWeight: '800',
                            color: '#111827',
                            lineHeight: 1.1,
                            marginBottom: '6px',
                          }}
                        >
                          {retailer.shop_name}
                        </div>
                        <div style={{ color: '#374151', fontSize: '16px', fontWeight: '500' }}>
                          {retailer.owner_name}
                        </div>
                      </div>

                      <div
                        style={{
                          alignSelf: isMobile ? 'flex-start' : 'flex-start',
                          padding: '7px 12px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: retailer.status === 'Blocked' ? '#fdecea' : '#e8f5e9',
                          color: retailer.status === 'Blocked' ? '#b71c1c' : '#1b5e20',
                        }}
                      >
                        {retailer.status}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: detailsColumns,
                        gap: '12px',
                        marginTop: '16px',
                      }}
                    >
                      <InfoRow label="Mobile" value={retailer.mobile} />
                      <InfoRow label="City" value={retailer.city} />
                      <InfoRow label="State" value={retailer.state} />
                      <InfoRow label="Pincode" value={retailer.pincode} />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: actionDirection,
                        gap: '10px',
                        marginTop: '16px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(retailer)}
                        style={{ ...secondaryButtonStyle, width: fullWidthButton }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusToggle(retailer)}
                        style={{
                          ...(retailer.status === 'Blocked' ? primaryButtonStyle : dangerButtonStyle),
                          width: fullWidthButton,
                        }}
                      >
                        {retailer.status === 'Blocked' ? 'Unblock' : 'Block'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartLoan(retailer)}
                        style={{ ...successButtonStyle, width: fullWidthButton }}
                      >
                        Start Loan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
};

const primaryButtonStyle = {
  background: '#1a73e8',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
};

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111827',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
};

const dangerButtonStyle = {
  background: '#b71c1c',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
};

const successButtonStyle = {
  background: '#0f9d58',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
};

export default function RetailerListPage() {
  return (
    <RetailerProvider>
      <RetailerListContent />
    </RetailerProvider>
  );
}
