import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loanService } from '../../../services/loanService';

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280', fontSize: '14px' }}>{label}</span>
      <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{value || '-'}</span>
    </div>
  );
}

export default function LoanDetailsPage() {
  const { loanCode } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const res = await loanService.getLoanDetails(loanCode);
        setLoan(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [loanCode]);

  if (loading) return <div style={{ padding: '100px 20px', textAlign: 'center' }}>Loading details...</div>;
  if (error) return <div style={{ padding: '100px 20px', color: 'red', textAlign: 'center' }}>{error}</div>;

  const cardStyle = { background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '16px' };
  const sectionTitle = { fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#111827' };

  return (
    <div style={{ padding: '100px 16px 120px', background: '#f5f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => navigate('/loans')} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Loan Details</h1>
        </div>

        {/* Status Card */}
        <div style={{ ...cardStyle, background: '#111827', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Loan Status</div>
          <div style={{ fontSize: '20px', fontWeight: '800' }}>{loan.status}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Code: {loan.loan_code}</div>
        </div>

        {/* Customer Info */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Customer Information</h2>
          <InfoRow label="Name" value={loan.customer_name} />
          <InfoRow label="Mobile" value={loan.customer_phone} />
          <InfoRow label="PAN" value={loan.pan_number} />
          <InfoRow label="Aadhaar" value={loan.aadhar_number} />
        </div>

        {/* Finance Summary — Loan Amount replaced with Disbursed Amount */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Finance Summary</h2>
          <InfoRow label="Item" value={loan.item_name} />
          <InfoRow label="Item Value" value={`₹${Number(loan.item_value).toLocaleString('en-IN')}`} />
          <InfoRow label="Down Payment" value={`₹${Number(loan.down_payment).toLocaleString('en-IN')}`} />
          <InfoRow label="Disbursed Amount" value={`₹${Number(loan.net_disbursement).toLocaleString('en-IN')}`} />
          <InfoRow label="Monthly EMI" value={`₹${Number(loan.emi_amount).toLocaleString('en-IN')}`} />
          <InfoRow label="Tenure" value={`${loan.plan_months} Months`} />
        </div>

        {/* Documents */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Uploaded Documents</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['customer_photo', 'aadhar_front', 'aadhar_back', 'pan_photo', 'item_photo'].map(field => (
              <div key={field} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'capitalize' }}>
                  {field.replace(/_/g, ' ')}
                </div>
                <div style={{ height: '80px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                  {loan[field] ? (
                    <img src={`http://127.0.0.1:8000/storage/${loan[field]}`} alt={field} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '80px', display: 'block' }}>N/A</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => window.alert('Re-downloading PDF Agreement...')}
          style={{
            width: '100%',
            padding: '16px',
            background: '#0f9d58',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '15px',
          }}
        >
          Download Agreement (PDF)
        </button>

      </div>
    </div>
  );
}
