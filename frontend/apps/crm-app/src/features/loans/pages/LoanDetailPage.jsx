// src/features/loans/pages/LoanDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loanService } from '../../../services/loanService';

const STATUSES = ['Pending', 'Approved', 'Active', 'Rejected', 'Cancelled', 'Closed', 'Blocked'];

export default function LoanDetailPage() {
  const { loanCode } = useParams();
  const navigate     = useNavigate();
  const [loan, setLoan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loanService.getLoanDetails(loanCode)
      .then(res => setLoan(res.data ?? res))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [loanCode]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    setUpdating(true);
    try {
      await loanService.updateStatus(loanCode, { status: newStatus });
      setLoan(prev => ({ ...prev, status: newStatus }));
      setStatusMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading loan details...</div>;
  if (error)   return <div style={{ padding: '40px', color: '#ef4444' }}>{error}</div>;
  if (!loan)   return <div style={{ padding: '40px', color: '#94a3b8' }}>Loan not found.</div>;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/loans')} style={backBtn}>← Back</button>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>{loan.loan_code}</h1>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>
            Created {loan.created_at ?? '—'} &nbsp;·&nbsp; Agent: {loan.agent_name ?? loan.agent?.name ?? '—'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {statusMsg && <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>{statusMsg}</span>}
          <StatusPill status={loan.status} />
        </div>
      </div>

      {/* Status Change Bar — UTC Team only */}
      <div style={card}>
        <div style={cardTitle}>Change Loan Status</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '0 24px 20px' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              disabled={updating || loan.status === s}
              onClick={() => handleStatusChange(s)}
              style={{
                ...statusBtn,
                opacity: loan.status === s ? 0.4 : 1,
                background: loan.status === s ? '#e2e8f0' : '#fff',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <GenerateEmiSection loanCode={loan.loan_code} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Customer Info */}
        <Section title="Customer Details">
          <Row label="Name"          value={loan.customer_name} />
          <Row label="Phone"         value={loan.customer_phone} />
          <Row label="Email"         value={loan.customer_email} />
          <Row label="Date of Birth" value={loan.customer_dob} />
          <Row label="Monthly Salary" value={loan.customer_monthly_salary ? `₹${Number(loan.customer_monthly_salary).toLocaleString('en-IN')}` : '—'} />
          <Row label="Address"       value={loan.customer_address} />
        </Section>

        {/* KYC Info */}
        <Section title="KYC Details">
          <Row label="Aadhar Number" value={loan.aadhar_number} />
          <Row label="PAN Number"    value={loan.pan_number} />
          <Row label="Account No."   value={loan.account_number} />
          <Row label="IFSC Code"     value={loan.ifsc_code} />
          <Row label="CIBIL Score"   value={loan.cibil_score} />
        </Section>

        {/* Loan / EMI Plan */}
        <Section title="Loan Plan">
          <Row label="Plan"            value={loan.plan_label} />
          <Row label="Tenure"          value={loan.plan_months ? `${loan.plan_months} months` : '—'} />
          <Row label="Loan Amount"     value={loan.loan_amount     ? `₹${Number(loan.loan_amount).toLocaleString('en-IN')}` : '—'} />
          <Row label="Net Disbursement" value={loan.net_disbursement ? `₹${Number(loan.net_disbursement).toLocaleString('en-IN')}` : '—'} />
          <Row label="EMI Amount"      value={loan.emi_amount       ? `₹${Number(loan.emi_amount).toLocaleString('en-IN')}` : '—'} />
          <Row label="Processing Fee"  value={loan.processing_fee   ? `₹${Number(loan.processing_fee).toLocaleString('en-IN')}` : '—'} />
          <Row label="Total Repay"     value={loan.total_repay      ? `₹${Number(loan.total_repay).toLocaleString('en-IN')}` : '—'} />
          <Row label="Down Payment"    value={loan.down_payment     ? `₹${Number(loan.down_payment).toLocaleString('en-IN')}` : '—'} />
          <Row label="First EMI Date"  value={loan.first_emi_date} />
          <Row label="Last Repayment"  value={loan.last_repayment_date} />
        </Section>

        {/* Device Info */}
        <Section title="Device Details">
          <Row label="Item Name"   value={loan.item_name} />
          <Row label="Item Value"  value={loan.item_value ? `₹${Number(loan.item_value).toLocaleString('en-IN')}` : '—'} />
          <Row label="IMEI"        value={loan.item_imei} />
          <Row label="Device Type" value={loan.device_type} />
          <Row label="Retailer"    value={loan.retailer_name ?? loan.retailer?.shop_name ?? loan.retailer_code} />
        </Section>

      </div>
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={card}>
      <div style={cardTitle}>{title}</div>
      <div style={{ padding: '0 24px 20px', display: 'grid', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
      <span style={{ color: '#64748b', fontWeight: '500' }}>{label}</span>
      <span style={{ color: '#1e293b', fontWeight: '600', textAlign: 'right', maxWidth: '60%' }}>{value ?? '—'}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending:   { bg: '#fef3c7', color: '#92400e' },
    approved:  { bg: '#d1fae5', color: '#065f46' },
    active:    { bg: '#dbeafe', color: '#1e40af' },
    rejected:  { bg: '#fee2e2', color: '#991b1b' },
    closed:    { bg: '#f1f5f9', color: '#475569' },
    cancelled: { bg: '#f1f5f9', color: '#475569' },
    blocked:   { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[(status ?? '').toLowerCase()] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
      {status ?? 'Unknown'}
    </span>
    
  );
}

function GenerateEmiSection({ loanCode }) {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg]         = useState('');
    const [success, setSuccess] = useState(false);
  
    const handleGenerate = async () => {
      if (!window.confirm('Generate EMI schedule for this loan?')) return;
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/loans/${loanCode}/generate-emis`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('utc_crm_token')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });
        const json = await res.json();
        setMsg(json.message);
        setSuccess(json.success);
      } catch {
        setMsg('Failed to generate EMI schedule.');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div style={{ ...card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>EMI Schedule</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {msg
              ? <span style={{ color: success ? '#10b981' : '#ef4444' }}>{msg}</span>
              : 'Generate installment schedule for this loan to track payments in EMI Book.'
            }
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || success}
          style={{
            background: success ? '#d1fae5' : '#2563eb',
            color: success ? '#065f46' : '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: success ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Generating...' : success ? '✓ Generated' : 'Generate EMI Schedule'}
        </button>
      </div>
    );
  }

// ── Styles ─────────────────────────────────────────────────────
const card      = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const cardTitle = { padding: '18px 24px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', fontSize: '14px', color: '#1e293b' };
const backBtn   = { background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '13px' };
const statusBtn = { padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' };