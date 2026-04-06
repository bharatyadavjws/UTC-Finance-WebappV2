import React, { useState, useEffect } from 'react';
import { calculateEmiOptions, computeApprovedCreditLimit, getMinimumDownPayment } from '../../../utils/loanUtils';

const fieldGroupStyle = { display: 'grid', gap: '6px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.025em' };
const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff' };
const primaryButtonStyle = { background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' };
const secondaryButtonStyle = { background: '#fff', color: '#111827', border: '1px solid #d1d5db', borderRadius: '10px', padding: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' };

export default function EligibilityPage() {
  const [form, setForm] = useState({ itemValue: '', income: '', cibil: '', currentEmi: '', dpd: '0', enquiries: '0', deviceType: 'ANDROID' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [emiOptions, setEmiOptions] = useState([]);

  const handleCheck = (e) => {
    e.preventDefault();
    setError(''); setResult(null); setEmiOptions([]);

    const { itemValue, income, cibil, currentEmi, dpd, enquiries, deviceType } = form;
    if (!itemValue || !income) { setError("Item Value and Income are required."); return; }

    // 1. RUN CORE LOGIC
    const autoDown = getMinimumDownPayment(itemValue);
    const eligibility = computeApprovedCreditLimit(itemValue, autoDown, income, cibil, currentEmi);

    if (!eligibility.ok) {
      setError(eligibility.error);
      return; // 👈 STOPS if FOIR > band limit
    }

    // 2. CHECK RISK CAPS
    if (Number(enquiries) > 6) { setError("Ineligible: Too many enquiries (> 6)."); return; }
    if (Number(dpd) > 30) { setError("Ineligible: DPD exceeds 30 days."); return; }

    let creditLimit = eligibility.creditLimit;
    if (Number(dpd) > 0) creditLimit = Math.floor(creditLimit * 0.5);

    // 3. GENERATE EMI CARDS BASED ON LIMIT
    const effectiveDown = Math.max(Number(itemValue) - creditLimit, 0);
    const opts = calculateEmiOptions(itemValue, effectiveDown, deviceType);

    setResult(creditLimit);
    setEmiOptions(opts);
  };

  return (
    <div style={{ padding: '24px 16px 140px', maxWidth: '500px', margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>Eligibility Checker</h2>
        <form onSubmit={handleCheck} style={{ display: 'grid', gap: '16px' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Item Value</label>
            <input type="number" style={inputStyle} value={form.itemValue} onChange={e => setForm({...form, itemValue: e.target.value})} placeholder="61000" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldGroupStyle}><label style={labelStyle}>Income</label><input type="number" style={inputStyle} value={form.income} onChange={e => setForm({...form, income: e.target.value})} /></div>
            <div style={fieldGroupStyle}><label style={labelStyle}>Cur. EMI</label><input type="number" style={inputStyle} value={form.currentEmi} onChange={e => setForm({...form, currentEmi: e.target.value})} /></div>
          </div>
          <div style={fieldGroupStyle}><label style={labelStyle}>CIBIL</label><input type="number" style={inputStyle} value={form.cibil} onChange={e => setForm({...form, cibil: e.target.value})} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldGroupStyle}><label style={labelStyle}>DPD</label><input type="number" style={inputStyle} value={form.dpd} onChange={e => setForm({...form, dpd: e.target.value})} /></div>
            <div style={fieldGroupStyle}><label style={labelStyle}>Enquiries</label><input type="number" style={inputStyle} value={form.enquiries} onChange={e => setForm({...form, enquiries: e.target.value})} /></div>
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Platform</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" style={{ ...secondaryButtonStyle, flex: 1, background: form.deviceType === 'ANDROID' ? '#111827' : '#fff', color: form.deviceType === 'ANDROID' ? '#fff' : '#111827' }} onClick={() => setForm({...form, deviceType: 'ANDROID'})}>Android</button>
              <button type="button" style={{ ...secondaryButtonStyle, flex: 1, background: form.deviceType === 'IOS' ? '#111827' : '#fff', color: form.deviceType === 'IOS' ? '#fff' : '#111827' }} onClick={() => setForm({...form, deviceType: 'IOS'})}>iOS</button>
            </div>
          </div>
          {error && <div style={{ color: '#b91c1c', fontWeight: '700', padding: '12px', background: '#fef2f2', borderRadius: '10px', textAlign: 'center' }}>⚠️ {error}</div>}
          <button type="submit" style={primaryButtonStyle}>Check Eligibility</button>
        </form>
      </div>

      {result && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#ecfdf5', borderRadius: '20px', border: '2px solid #10b981', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#065f46', fontWeight: '800' }}>Approved Credit Limit</div>
          <div style={{ fontSize: '48px', fontWeight: '900', color: '#047857' }}>₹{result.toLocaleString('en-IN')}</div>
        </div>
      )}

      {emiOptions.map((opt) => (
        <div key={opt.key} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '18px', marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '16px', fontWeight: '800' }}>{opt.label} Plan</div>
            <div style={{ background: '#1a73e8', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' }}>₹{opt.emi}/mo</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div style={{ color: '#6b7280' }}>Disbursement</div><div style={{ fontWeight: '700', textAlign: 'right' }}>₹{opt.netDisbursement.toLocaleString()}</div>
            <div style={{ color: '#6b7280' }}>Loan Amount</div><div style={{ fontWeight: '700', textAlign: 'right' }}>₹{opt.loanAmount.toLocaleString()}</div>
            <div style={{ color: '#6b7280', paddingTop: '8px', borderTop: '1px dashed #eee' }}>Total Repayable</div>
            <div style={{ fontWeight: '800', textAlign: 'right', color: '#1a73e8', paddingTop: '8px', borderTop: '1px dashed #eee' }}>₹{Math.round(opt.totalRepay).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
